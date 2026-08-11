// @ts-check
// Single source of truth for ESLint in this project.
// @nuxt/eslint generates the base config via `nuxt prepare`.
import stylistic from "@stylistic/eslint-plugin";
import withNuxt from "./.nuxt/eslint.config.mjs";

const isProductionEnv = process.env.NODE_ENV === "production";

// https://eslint.org/docs/latest/use/configure/configuration-files
export default withNuxt(
  // 註：不套用 stylistic.configs.recommended —— 那份預設規則（arrow-parens、
  // brace-style、member-delimiter-style…）跟這個既有專案目前的寫法大量衝突，
  // 硬套只會產生幾千行純格式 diff，沒有實質收益。只挑跟現有風格一致、
  // 且真的有一致性價值的幾條規則。
  {
    plugins: {
      "@stylistic": stylistic,
    },
    rules: {
      "@stylistic/semi": ["error", "always"],
      "@stylistic/comma-dangle": ["error", "always-multiline"],
      "@stylistic/linebreak-style": ["error", "unix"],
      "@stylistic/no-multiple-empty-lines": ["error", { max: 1 }],
    },
  },
  {
    files: ["**/*.{ts,js,vue}"],
    rules: {
      // eslint
      "no-alert": "error",
      "no-console": [isProductionEnv ? "error" : "warn", { allow: ["warn", "error"] }],
      "no-debugger": isProductionEnv ? "error" : "warn",
      "no-duplicate-imports": ["error", { includeExports: true }],
      "no-unused-vars": "off",
      // typescript-eslint
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", {
        args: "all",
        argsIgnorePattern: "^_",
        caughtErrors: "all",
        caughtErrorsIgnorePattern: "^_",
        vars: "all",
        varsIgnorePattern: "^_",
      }],
      // vue
      "vue/block-lang": ["error", { script: { lang: "ts" }, style: { lang: "scss" } }],
      "vue/component-api-style": ["error", ["script-setup", "composition"]],
      "vue/max-attributes-per-line": ["error", { singleline: 3, multiline: 1 }],
      "vue/no-empty-component-block": "error",
      "vue/padding-line-between-blocks": "error",
      "vue/prefer-separate-static-class": "error",
      "vue/require-default-prop": "off",
      "vue/require-v-for-key": "error",
      "vue/no-use-v-if-with-v-for": ["error", { allowUsingIterationVar: false }],
      "vue/custom-event-name-casing": ["error", "camelCase"],
      "vue/prop-name-casing": ["error", "camelCase"],
    },
  },
  {
    // Nuxt 檔案路由：pages / layouts 允許單詞命名
    files: ["**/{layouts,pages}/*.vue", "**/{layouts,pages,components}/**/*.vue"],
    rules: { "vue/multi-word-component-names": "off" },
  },
  {
    files: ["**/components/**/*.vue"],
    rules: { "vue/multi-word-component-names": "error" },
  },
  {
    // app/components/layout/ 是全域版面骨架單例元件（Footer、Loading、Menu），
    // 不是可重複使用的業務元件，不強制多詞命名（比照 nuxt-standard 對 pages/layouts 的例外）
    files: ["**/components/layout/*.vue"],
    rules: { "vue/multi-word-component-names": "off" },
  },
  {
    // scripts/ 是 Node CLI 維護腳本，允許 console 輸出進度
    files: ["scripts/**/*.ts"],
    rules: { "no-console": "off" },
  },
  {
    // pull.ts / sync.ts 是已停用的 Firebase 同步工具（見 app/docs/README.md「相關但沒有
    // 寫進這份文件的東西」）——Firebase 專案本身已經連不上，這兩個檔案不會被日常流程呼叫。
    // 裡面幾十個 any 幾乎都是 Firestore document/snapshot 的鬆散型別，在無法連線驗證的情況下
    // 逐一補型別風險（可能悄悄改變行為卻沒有辦法測試）大於好處，整份排除在 lint 之外，
    // 之後真的要重新啟用 Firebase 同步流程時再一併處理。
    ignores: ["scripts/pull.ts", "scripts/sync.ts"],
  },
);
