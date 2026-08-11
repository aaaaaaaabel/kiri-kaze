# 品牌字（Lacunae）與字體設定

## 品牌沿革

網站原本叫 Kiri Kaze，已經改名為 **Lacunae**。文字部分已經全部替換（`nuxt.config.ts` 的 title/meta、`Footer.vue`、`about.vue`、`MainNav.vue` 的 alt 文字）。Logo 圖檔 `public/images/logo.svg`／`logo_white.png` 已經換成向量路徑版的 "Lacunae Studio" 字標——**這個 logo 是外框化的向量圖，不依賴任何字體檔案**，不受這份文件討論的字體設定影響。

## 需要字體的地方：動態顯示的 "Lacunae" 文字

`OpeningScreen.vue`（開場畫面）跟 `Loading.vue`（頁面切換 loading 畫面）裡的 "Lacunae" 是活的文字（不是圖片），這兩處需要字體才能呈現跟 logo 一致的視覺風格。

## 目前用的字體：Bodoni Moda（免費過渡方案）

參考圖裡的字體是 **Bodoni Poster Std Italic**（Adobe/Linotype 發行）——這是商業字體，本機雖然裝了對應的 `.otf` 檔案（`~/Library/Fonts/BodoniStd-PosterItalic.otf`），但檔案本身的 `fsType` 授權旗標標記為 `4`（僅預覽/列印），**不能合法轉成網頁字體嵌入公開網站**，所以沒有直接使用。

改用 **[Bodoni Moda](https://fonts.google.com/specimen/Bodoni+Moda)**（Google Fonts，OFL 開源授權，可以合法自由嵌入網頁）的 Black Italic（字重 900）樣式，視覺上是目前最接近參考圖的免費替代方案。

### 怎麼載入的

透過 [Fontsource](https://fontsource.org) 套件，走專案既有的「npm 字體包」慣例：

```ts
// app/assets/fonts/index.ts
import "@fontsource/bodoni-moda/900-italic.css";
```

```ts
// nuxt.config.ts
css: ["~/assets/fonts/index.ts", "~/assets/styles/main.scss"],
```

```scss
// app/assets/styles/_variables.scss
// 品牌字標（Lacunae wordmark）專用，暫用 Bodoni Moda，待購入 Bodoni Poster Std Italic 網頁授權後替換
$font-family-logo: "Bodoni Moda", Georgia, "Times New Roman", serif;
```

`$font-family-logo` 是獨立於 `$font-family-en`（原本共用的英文字體變數）的新變數，避免換字體時影響到其他還在用 `$font-family-en` 的英文 UI 文字（例如首頁圓形按鈕的 "Portfolio" 文字）。

`OpeningScreen.vue`／`Loading.vue` 套用方式：

```scss
.opening-screen__text {
  font-family: $font-family-logo;
  font-weight: 900;
  font-style: italic;
  letter-spacing: 0; // Bodoni Poster 是緊排的海報字，不是原本 Futura 設計時的大字距
}
```

## 之後買到正版字體授權，怎麼換

如果之後在 [Fonts.com（Linotype）](https://www.fonts.com/font/linotype/bodoni-poster/italic) 或 MyFonts 買到 **Bodoni Poster Std Italic 的 Webfont 授權**，換上去只需要三步，不用動任何 `.vue` 元件：

1. 把買到的 `.woff2` 檔案放進 `app/assets/fonts/`
2. 改 `app/assets/fonts/index.ts`：改成 `@font-face` 宣告（或用套件附的 CSS）指向新檔案
3. 改 `_variables.scss` 的 `$font-family-logo`，把 `"Bodoni Moda"` 換成你買到的字體實際的 `font-family` 名稱

`OpeningScreen.vue`／`Loading.vue` 完全不用改，因為它們永遠讀 `$font-family-logo` 這個變數。

## 為什麼不能「先不管授權，直接把本機字體檔案包進網站」

這不是保守起見的建議，是字體檔案本身內嵌的技術限制：OpenType 的 `OS/2` 表裡有一個 `fsType` 欄位，由字體發行商（這裡是 Adobe）設定，`fsType = 4` 明確表示「僅允許預覽與列印用途嵌入」。網頁 `@font-face`（文字可選取、可複製）不屬於這個允許範圍——這不是使用者授權範圍內能自行決定要不要遵守的規則，是版權方直接寫死在檔案裡的限制。買一份正式的 Webfont 授權，是唯一合法用到這個確切字體的方式。
