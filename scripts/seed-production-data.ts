import * as fs from "node:fs";
import * as path from "node:path";
import { createClient } from "@libsql/client";
import { put } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import eventsData from "../data/mock/events.json";
import fossilsData from "../data/mock/fossils.json";
import projectsData from "../data/mock/projects.json";
import speciesData from "../data/mock/species.json";
import * as schema from "../server/db/schema";

const databaseUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

if (!databaseUrl || !authToken) {
  throw new Error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN.");
}

if (!blobToken) {
  throw new Error("Missing BLOB_READ_WRITE_TOKEN.");
}

const db = drizzle(
  createClient({
    url: databaseUrl,
    authToken,
  }),
  { schema },
);

function listImageFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];

  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...listImageFiles(fullPath));
    } else if (/\.(jpg|jpeg|png|webp|svg)$/i.test(entry.name)) {
      results.push(fullPath);
    }
  }

  return results;
}

function contentTypeFor(file: string): string {
  if (/\.svg$/i.test(file)) return "image/svg+xml";
  if (/\.png$/i.test(file)) return "image/png";
  if (/\.webp$/i.test(file)) return "image/webp";
  return "image/jpeg";
}

function remapFactory(pathMap: Map<string, string>) {
  return (value: string | null | undefined): string | null | undefined => {
    if (!value) return value;
    return pathMap.get(value) ?? value;
  };
}

async function seedDatabase() {
  await db.delete(schema.fossils);
  await db.delete(schema.species);
  await db.delete(schema.bookings);
  await db.delete(schema.events);
  await db.delete(schema.projects);

  await db.insert(schema.species).values(
    speciesData.map((item) => ({
      ...item,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    })) as unknown as (typeof schema.species.$inferInsert)[],
  );

  await db.insert(schema.fossils).values(
    fossilsData.map((item) => ({
      id: item.id,
      slug: item.slug,
      shortCode: item.shortCode,
      speciesId: item.speciesRef.id,
      specimen: item.specimen,
      images: item.images,
      thumbnail: item.thumbnail,
      description: item.description,
      tags: item.tags,
      category: item.category,
      likeCount: item.likeCount,
      viewCount: item.viewCount,
      isPublic: item.isPublic,
      featured: item.featured,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    })) as unknown as (typeof schema.fossils.$inferInsert)[],
  );

  await db.insert(schema.projects).values(
    projectsData.map((item) => ({
      ...item,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    })),
  );

  await db.insert(schema.events).values(
    eventsData.map((item) => ({
      ...item,
      createdAt: new Date(item.createdAt),
    })),
  );

  return {
    species: speciesData.length,
    fossils: fossilsData.length,
    projects: projectsData.length,
    events: eventsData.length,
  };
}

async function migrateImages() {
  const publicDir = path.join(process.cwd(), "public");
  const targetDirs = [path.join(publicDir, "images", "fossils"), path.join(publicDir, "images", "case")];
  const files = targetDirs.flatMap((dir) => listImageFiles(dir));
  const pathMap = new Map<string, string>();

  for (const filePath of files) {
    const relative = path.relative(publicDir, filePath).split(path.sep).join("/");
    await put(relative, fs.readFileSync(filePath), {
      token: blobToken,
      contentType: contentTypeFor(filePath),
      access: "public",
      addRandomSuffix: false,
    });
    pathMap.set(`/${relative}`, `/cdn/${relative}`);
  }

  const remap = remapFactory(pathMap);

  let updatedFossils = 0;
  const fossilRows = await db.select().from(schema.fossils);
  for (const row of fossilRows) {
    const newThumbnail = remap(row.thumbnail) as string;
    const newImages = row.images.map((img) => ({ ...img, url: remap(img.url) ?? img.url }));
    if (newThumbnail === row.thumbnail && JSON.stringify(newImages) === JSON.stringify(row.images)) continue;
    await db.update(schema.fossils).set({ thumbnail: newThumbnail, images: newImages }).where(eq(schema.fossils.id, row.id));
    updatedFossils++;
  }

  let updatedSpecies = 0;
  const speciesRows = await db.select().from(schema.species);
  for (const row of speciesRows) {
    const newRepresentative = remap(row.representativeImage);
    if (newRepresentative === row.representativeImage) continue;
    await db.update(schema.species).set({ representativeImage: newRepresentative }).where(eq(schema.species.id, row.id));
    updatedSpecies++;
  }

  let updatedProjects = 0;
  const projectRows = await db.select().from(schema.projects);
  for (const row of projectRows) {
    const newThumbnail = remap(row.thumbnail) as string;
    const newCover = remap(row.cover);
    const images = row.images as { url: string; [key: string]: unknown }[];
    const newImages = images.map((img) => ({ ...img, url: remap(img.url) ?? img.url }));
    if (newThumbnail === row.thumbnail && newCover === row.cover && JSON.stringify(newImages) === JSON.stringify(row.images)) continue;
    await db
      .update(schema.projects)
      .set({ thumbnail: newThumbnail, cover: newCover, images: newImages })
      .where(eq(schema.projects.id, row.id));
    updatedProjects++;
  }

  let updatedEvents = 0;
  const eventRows = await db.select().from(schema.events);
  for (const row of eventRows) {
    const newImage = remap(row.image) as string;
    if (newImage === row.image) continue;
    await db.update(schema.events).set({ image: newImage }).where(eq(schema.events.id, row.id));
    updatedEvents++;
  }

  return {
    filesUploaded: files.length,
    updatedFossils,
    updatedSpecies,
    updatedProjects,
    updatedEvents,
  };
}

const seedResult = await seedDatabase();
const imageResult = await migrateImages();

console.info(JSON.stringify({ seed: seedResult, images: imageResult }, null, 2));
