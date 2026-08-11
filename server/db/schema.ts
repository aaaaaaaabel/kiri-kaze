/**
 * NuxtHub（Cloudflare D1）資料庫 Schema
 * 巢狀物件（taxonomy、period、specimen、location、measurements、images[]、tags[]）
 * 直接存成 JSON 欄位，對齊 app/types/fossil.ts、app/types/portfolio.ts 的現有 TS 型別，
 * API 層幾乎零轉換即可回傳給前端。
 */

import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import type { IFossilName, IFossilTaxonomy, IFossilPeriod, IFossil } from "../../app/types/fossil";

/** 物種 */
export const species = sqliteTable("species", {
  id: text().primaryKey(),
  slug: text().notNull().unique(),
  name: text({ mode: "json" }).notNull().$type<IFossilName>(),
  taxonomy: text({ mode: "json" }).notNull().$type<IFossilTaxonomy>(),
  period: text({ mode: "json" }).notNull().$type<IFossilPeriod>(),
  description: text({ mode: "json" }).notNull().$type<{ zh: string; en?: string }>(),
  characteristics: text(),
  habitat: text(),
  distribution: text(),
  representativeImage: text(),
  specimenCount: integer().notNull().default(0),
  tags: text({ mode: "json" }).notNull().default("[]").$type<string[]>(),
  category: text().notNull(),
  createdAt: integer({ mode: "timestamp" }).notNull(),
  updatedAt: integer({ mode: "timestamp" }).notNull(),
});

/** 標本 */
export const fossils = sqliteTable("fossils", {
  id: text().primaryKey(),
  slug: text().notNull().unique(),
  shortCode: text(),
  speciesId: text()
    .notNull()
    .references(() => species.id),
  specimen: text({ mode: "json" }).notNull().$type<IFossil["specimen"]>(),
  images: text({ mode: "json" }).notNull().default("[]").$type<IFossil["images"]>(),
  thumbnail: text().notNull(),
  description: text({ mode: "json" }).$type<{ zh: string; en?: string }>(),
  tags: text({ mode: "json" }).notNull().default("[]").$type<string[]>(),
  category: text().notNull(),
  likeCount: integer().notNull().default(0),
  viewCount: integer().notNull().default(0),
  isPublic: integer({ mode: "boolean" }).notNull().default(true),
  featured: integer({ mode: "boolean" }).notNull().default(false),
  createdAt: integer({ mode: "timestamp" }).notNull(),
  updatedAt: integer({ mode: "timestamp" }).notNull(),
});

/** 作品集專案（下一輪才接 API） */
export const projects = sqliteTable("projects", {
  id: text().primaryKey(),
  slug: text().notNull().unique(),
  title: text().notNull(),
  titleEn: text(),
  company: text(),
  role: text().notNull(),
  period: text().notNull(),
  description: text().notNull(),
  challenges: text(),
  achievements: text(),
  technologies: text({ mode: "json" }).notNull().default("[]"),
  thumbnail: text().notNull(),
  cover: text(),
  images: text({ mode: "json" }).notNull().default("[]"),
  url: text(),
  github: text(),
  category: text().notNull(),
  featured: integer({ mode: "boolean" }).notNull().default(false),
  tags: text({ mode: "json" }).notNull().default("[]"),
  isPublic: integer({ mode: "boolean" }).notNull().default(true),
  createdAt: integer({ mode: "timestamp" }).notNull(),
  updatedAt: integer({ mode: "timestamp" }).notNull(),
});

/** 活動（下一輪才接 API） */
export const events = sqliteTable("events", {
  id: text().primaryKey(),
  slug: text().notNull().unique(),
  title: text().notNull(),
  description: text().notNull(),
  date: text().notNull(),
  time: text().notNull(),
  location: text().notNull(),
  image: text().notNull(),
  capacity: integer().notNull().default(0),
  registeredCount: integer().notNull().default(0),
  isPublished: integer({ mode: "boolean" }).notNull().default(false),
  createdAt: integer({ mode: "timestamp" }).notNull(),
});

/** 活動報名（下一輪才接 API） */
export const bookings = sqliteTable("bookings", {
  id: integer().primaryKey({ autoIncrement: true }),
  eventId: text()
    .notNull()
    .references(() => events.id),
  eventTitle: text().notNull(),
  uid: text(),
  name: text().notNull(),
  email: text().notNull(),
  phone: text().notNull(),
  notes: text(),
  createdAt: integer({ mode: "timestamp" }).notNull(),
});
