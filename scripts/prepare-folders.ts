/**
 * 根據 input.json 建立對應的圖片資料夾
 * 使用 species-slug、產區和標本編號作為資料夾結構
 * 結構：images/fossils/{species-slug}/{location-id}/{specimen-number}/
 *
 * 使用方式：
 * npx tsx scripts/prepare-folders.ts

 * npx tsx scripts/prepare-folders.ts --clean
 */

import * as fs from "fs";
import * as path from "path";

// 生成短碼（基於 slug hash，固定不變）
function generateShortCode(slug: string): string {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    const char = slug.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString().slice(0, 11).padStart(11, "0");
}

// 將學名轉換為 slug
function scientificToSlug(scientific: string): string {
  return scientific
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

// 國家名稱轉換為代碼
function countryToCode(country: string): string {
  const mapping: Record<string, string> = {
    摩洛哥: "morocco",
    Morocco: "morocco",
    美國: "usa",
    USA: "usa",
    "United States": "usa",
    加拿大: "canada",
    Canada: "canada",
    中國: "china",
    China: "china",
    墨西哥: "mexico",
    Mexico: "mexico",
  };
  return mapping[country] || country.toLowerCase().replace(/\s+/g, "-");
}

// 州/省名稱轉換為代碼
function stateToCode(state: string): string {
  return state.toLowerCase().replace(/\s+/g, "-");
}

async function prepareFolders() {
  const inputPath = path.join(process.cwd(), "data", "input.json");
  const fossilsDir = path.join(process.cwd(), "public", "images", "fossils");

  if (!fs.existsSync(inputPath)) {
    console.error(`❌ 找不到 input.json: ${inputPath}`);
    process.exit(1);
  }

  const inputData = JSON.parse(fs.readFileSync(inputPath, "utf-8"));

  console.log("🚀 開始建立圖片資料夾...\n");
  console.log("📝 只參照本機端 input.json 資料，不查詢 Firestore\n");

  // 確保 fossils 資料夾存在
  if (!fs.existsSync(fossilsDir)) {
    fs.mkdirSync(fossilsDir, { recursive: true });
    console.log(`✅ 建立資料夾: ${fossilsDir}\n`);
  }

  // 第一遍掃描：統計每個物種有幾個不同產區（解決 hasMultipleLocations 時序問題）
  const speciesLocationSets = new Map<string, Set<string>>();
  for (const input of inputData.specimens) {
    const speciesSlug = scientificToSlug(input.species);
    const locationId = `${countryToCode(input.country)}-${stateToCode(input.state)}`;
    if (!speciesLocationSets.has(speciesSlug)) {
      speciesLocationSets.set(speciesSlug, new Set());
    }
    speciesLocationSets.get(speciesSlug)!.add(locationId);
  }

  // 第二遍掃描：逐筆計算編號（只基於 input.json 的順序）
  const locationCounters = new Map<string, number>(); // locationKey -> 目前計數
  const requiredFolders = new Set<string>();
  const folderMapping: Record<
    string,
    {
      speciesSlug: string;
      locationId: string;
      specimenNumber: number;
      fossilSlug: string;
      species: string;
      folder: string;
    }
  > = {};

  for (let i = 0; i < inputData.specimens.length; i++) {
    const input = inputData.specimens[i];
    const speciesSlug = scientificToSlug(input.species);
    const countryCode = countryToCode(input.country);
    const stateCode = stateToCode(input.state);
    const locationId = `${countryCode}-${stateCode}`;
    const locationKey = `${speciesSlug}::${locationId}`;

    // 更新計數器（只基於 input.json 的順序）
    const prev = locationCounters.get(locationKey) ?? 0;
    const specimenNumber = prev + 1;
    locationCounters.set(locationKey, specimenNumber);

    // 決定 slug 格式（全局確認多產區）
    const hasMultipleLocations =
      (speciesLocationSets.get(speciesSlug)?.size ?? 0) > 1;
    const specimenNumberStr = specimenNumber.toString().padStart(3, "0");
    const fossilSlug = hasMultipleLocations
      ? `${speciesSlug}-${locationId}-${specimenNumberStr}`
      : `${speciesSlug}-${specimenNumberStr}`;

    // 如果 bodyPart.category 不是 'other'，加入部位資料夾
    const bodyPartFolder =
      input.bodyPart && input.bodyPart.category !== "other"
        ? input.bodyPart.category
        : null;
    const folderKey = bodyPartFolder
      ? `${speciesSlug}/${locationId}/${specimenNumberStr}/${bodyPartFolder}`
      : `${speciesSlug}/${locationId}/${specimenNumberStr}`;

    requiredFolders.add(folderKey);
    folderMapping[folderKey] = {
      speciesSlug,
      locationId,
      specimenNumber,
      fossilSlug,
      species: input.species,
      folder: input.images?.folder || null,
    };
  }

  // 建立需要的資料夾
  let createdCount = 0;
  let existingCount = 0;

  for (const folderKey of requiredFolders) {
    const folderPath = path.join(fossilsDir, folderKey);
    const info = folderMapping[folderKey];

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
      console.log(`✅ 建立資料夾: ${folderKey}`);
      console.log(`   slug: ${info.fossilSlug}`);
      console.log(`   species: ${info.species}`);
      console.log(`   location: ${info.locationId}`);
      console.log(`   來源資料夾: ${info.folder}\n`);
      createdCount++;
    } else {
      console.log(`⏭️  資料夾已存在: ${folderKey}`);
      console.log(`   slug: ${info.fossilSlug}\n`);
      existingCount++;
    }
  }

  // 只基於 input.json 的資料夾，不查詢 Firestore
  const allRequiredFolders = requiredFolders;

  console.log(
    `✅ 總共需要保留 ${allRequiredFolders.size} 個資料夾（基於 input.json）\n`,
  );

  // 找出並列出不需要的資料夾（遞迴檢查所有子資料夾）
  const unusedFolders: string[] = [];

  function checkDirectory(dirPath: string, relativePath: string = "") {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const fullPath = path.join(dirPath, entry.name);
        const relativeFolderPath = relativePath
          ? `${relativePath}/${entry.name}`
          : entry.name;

        // 檢查是否是需要的資料夾（只基於 input.json）
        const isRequired = Array.from(allRequiredFolders).some((required) => {
          // 1. 這個路徑本身就在需要列表中
          if (relativeFolderPath === required) return true;
          // 2. 這個路徑是某個需要路徑的父資料夾（例如檢查 asaphus-kowalewskii/ 時，001 在它下面）
          if (required.startsWith(relativeFolderPath + "/")) return true;
          return false;
        });

        if (!isRequired) {
          unusedFolders.push(relativeFolderPath);
        }

        // 遞迴檢查子資料夾
        checkDirectory(fullPath, relativeFolderPath);
      }
    }
  }

  checkDirectory(fossilsDir);

  // 檢查是否需要清理
  const shouldClean = process.argv.includes("--clean");

  if (unusedFolders.length > 0) {
    if (shouldClean) {
      console.log(
        "⚠️  警告：即將刪除以下資料夾（這些資料夾不在 input.json 中）：\n",
      );
      unusedFolders.forEach((folder) => {
        console.log(`   - ${folder}`);
      });
      console.log(`\n📊 共 ${unusedFolders.length} 個資料夾將被刪除`);
      console.log(
        `📊 input.json 中有 ${requiredFolders.size} 個標本資料夾（已保護）`,
      );
      console.log("🗑️  開始刪除...\n");

      let deletedCount = 0;
      unusedFolders.forEach((folder) => {
        const folderPath = path.join(fossilsDir, folder);
        try {
          // 再次確認：這個資料夾真的不在保護列表中
          const isProtected = Array.from(allRequiredFolders).some(
            (required) => {
              // 1. 這個路徑本身就在需要列表中
              if (folder === required) return true;
              // 2. 這個路徑是某個需要路徑的父資料夾
              if (required.startsWith(folder + "/")) return true;
              return false;
            },
          );

          if (isProtected) {
            console.log(`⏭️  跳過（已保護）: ${folder}`);
            return;
          }

          fs.rmSync(folderPath, { recursive: true, force: true });
          console.log(`✅ 已刪除: ${folder}`);
          deletedCount++;
        } catch (error: any) {
          console.error(`❌ 刪除失敗: ${folder} - ${error.message}`);
        }
      });
      console.log(`\n📊 已刪除: ${deletedCount} 個資料夾\n`);
    } else {
      console.log("⚠️  以下資料夾不在 input.json 中，可以刪除：\n");
      unusedFolders.forEach((folder) => {
        console.log(`   - ${folder}`);
      });
      console.log(`\n📊 共 ${unusedFolders.length} 個資料夾`);
      console.log(
        "\n💡 提示：執行 `npx tsx scripts/prepare-folders.ts --clean` 可自動刪除",
      );
      console.log(
        "   ⚠️  注意：--clean 會直接刪除這些資料夾，請確認後再執行！",
      );
      console.log(
        "   📝 注意：prepare-folders.ts 只參照 input.json，不查詢 Firestore",
      );
    }
  }

  console.log("\n🎉 完成!");
  console.log(`📊 建立: ${createdCount} 個資料夾`);
  console.log(`📊 已存在: ${existingCount} 個資料夾`);
  if (unusedFolders.length > 0) {
    console.log(`📊 可刪除: ${unusedFolders.length} 個資料夾\n`);
  } else {
    console.log("");
  }
}

prepareFolders()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ 執行失敗:", error);
    process.exit(1);
  });
