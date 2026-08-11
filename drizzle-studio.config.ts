/**
 * 給 `npx drizzle-kit studio` 用的設定檔——純粹是本機瀏覽/編輯 D1（SQLite）資料的視覺化工具，
 * 跟 NuxtHub 本身的 migration 流程（.nuxt/hub/db/drizzle.config.ts）無關，不要拿去跑 generate/migrate。
 *
 * 使用方式：npx drizzle-kit studio --config=drizzle-studio.config.ts
 */
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./server/db/schema.ts",
  dbCredentials: {
    url: "file:.data/db/sqlite.db",
  },
});
