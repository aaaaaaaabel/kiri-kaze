# Lacunae SCSS System Brief

This brief defines the SCSS refactor target for Lacunae. Use `/Users/abel/eip_fe` as the structural reference, especially its `src/assets/styles/` folder, Bootstrap SCSS variable flow, token maps, and root CSS variable output. Do not copy EIP visual styles into Lacunae.

## Goal

Create a maintainable SCSS system for Lacunae where reusable values come from variables or tokens. After the system exists, new styles must not introduce hard-coded colors, font stacks, z-index values, radius values, spacing scales, breakpoint values, shadows, or transition durations.

The goal is not to make Lacunae look like Bootstrap or EIP. The goal is to use a Bootstrap-like SCSS architecture: source variables, maps, utilities, root CSS variables, and controlled imports.

## Reference Project

Use these EIP files as references:

- `/Users/abel/eip_fe/src/assets/styles/main.scss`
- `/Users/abel/eip_fe/src/assets/styles/abstracts/_variables.scss`
- `/Users/abel/eip_fe/src/assets/styles/abstracts/_tokens.scss`
- `/Users/abel/eip_fe/src/assets/styles/base/_root.scss`
- `/Users/abel/eip_fe/src/assets/styles/vendors/bootstrap/_index.scss`
- `/Users/abel/eip_fe/src/assets/styles/vendors/bootstrap/variables/_overrides.scss`
- `/Users/abel/eip_fe/vite.config.ts`

Lacunae does not need the full EIP theme system in the first pass. Use the architecture pattern, not the product palette or admin UI decisions.

## Required Folder Shape

Reorganize `app/assets/styles/` toward this structure:

```text
app/assets/styles/
├── abstracts/
│   ├── _index.scss
│   ├── _variables.scss
│   ├── _tokens.scss
│   ├── _bootstrap.scss
│   ├── functions/
│   │   └── _index.scss
│   └── mixins/
│       ├── _index.scss
│       ├── _responsive.scss
│       ├── _typography.scss
│       └── _layout.scss
├── vendors/
│   ├── _index.scss
│   └── bootstrap/
│       ├── _index.scss
│       ├── _maps.scss
│       ├── _utilities.scss
│       └── variables/
│           ├── _index.scss
│           ├── _colors.scss
│           └── _overrides.scss
├── base/
│   ├── _index.scss
│   ├── _reset.scss
│   ├── _root.scss
│   └── _typography.scss
├── components/
│   ├── _index.scss
│   ├── _button.scss
│   ├── _card.scss
│   ├── _form.scss
│   ├── _menu.scss
│   └── _modal.scss
├── layouts/
│   ├── _index.scss
│   └── _layout.scss
├── overrides/
│   ├── _index.scss
│   └── _nprogress.scss
└── main.scss
```

Keep the first pass mechanical and conservative. Move files only when imports can remain clear. Avoid rewriting interactive systems such as Menu during the token migration.

## Main Import Order

Use a predictable import order like EIP:

```scss
// 1. Third-party SCSS integration and framework variables
@use "vendors";

// 2. Global base styles and :root tokens
@use "base";

// 3. Shared project component styles
@use "components";

// 4. Global layout helpers
@use "layouts";

// 5. Third-party overrides
@use "overrides";
```

Lacunae currently loads styles through `nuxt.config.ts` with `~/assets/styles/main.scss`. Preserve that entry.

## Token Rules

Define every reusable value in `abstracts/_variables.scss`. Export token maps from `abstracts/_tokens.scss`. Output browser-visible CSS variables from `base/_root.scss`.

Use this naming pattern:

```scss
$lc-color-black: #000;
$lc-color-white: #fff;
$lc-color-bg: #fff;
$lc-color-text: #000;
$lc-color-accent: rgb(164 138 86);

$lc-font-sans: "Helvetica Neue", "Noto Sans JP", sans-serif;
$lc-font-en: "Futura", "Futura PT", "Helvetica Neue", Arial, sans-serif;
$lc-font-logo: "Bodoni Moda", Georgia, "Times New Roman", serif;
$lc-font-serif-tc: "Noto Serif CJK TC", "Noto Serif TC", serif;

$lc-z-grid-number: 30;
$lc-z-portfolio-button: 100;
$lc-z-menu: 200;
$lc-z-header: 300;
$lc-z-loading: 400;
$lc-z-transition: 9200;
$lc-z-overlay: 9999;

$lc-radius-sm: 8px;
$lc-radius-md: 12px;
$lc-radius-pill: 999px;

$lc-space-xs: 10px;
$lc-space-sm: 20px;
$lc-space-md: 30px;
$lc-space-lg: 40px;
$lc-space-xl: 60px;

$lc-transition-fast: 0.25s;
$lc-transition-normal: 0.5s;
$lc-transition-slow: 1s;
```

Then expose CSS variables:

```scss
@use "../abstracts/tokens" as tokens;

:root {
  @each $name, $value in tokens.$lc-base-tokens {
    --lc-#{$name}: #{$value};
  }
}
```

Use SCSS variables for compile-time Sass logic and Bootstrap overrides. Use CSS variables for component styles, runtime style bindings, and values that may become themeable.

## No Hard-Coded Values Rule

After the token layer lands, component styles must use tokens for these categories:

- Colors: no raw `#fff`, `#000`, `rgb(...)`, `rgba(...)`, or named colors except inside token files.
- Fonts: no raw font stacks except inside token files.
- z-index: no raw layer numbers except inside token files.
- Radius: no raw repeated radius values such as `8px`, `12px`, `999px`.
- Spacing: no repeated layout spacing such as `20px`, `40px`, `60px` when the value is part of the project scale.
- Breakpoints: no raw media query widths except inside responsive mixins or breakpoint tokens.
- Timing: no repeated durations such as `0.2s`, `0.5s`, `1s` when they represent standard transitions.

One-off geometry can stay local when it describes a specific artwork or animation path. Examples include exact SVG viewBox dimensions, fossil card scatter positions, hero card coordinates, and Web Animations keyframe offsets. If a value is reused or semantic, make it a token.

## Bootstrap Integration

Use Bootstrap SCSS as a variable, mixin, grid, reboot, and utility foundation. Do not import all Bootstrap components in the first pass.

Start with:

```scss
@import "bootstrap/scss/functions";
@import "variables";
@import "bootstrap/scss/variables";
@import "maps";
@import "bootstrap/scss/maps";
@import "bootstrap/scss/mixins";
@import "bootstrap/scss/root";
@import "bootstrap/scss/reboot";
@import "bootstrap/scss/containers";
@import "bootstrap/scss/grid";
@import "bootstrap/scss/utilities";
@import "utilities";
@import "bootstrap/scss/utilities/api";
```

Avoid importing these in the first pass unless a specific component migration requires them:

```scss
buttons
forms
modal
dropdown
navbar
card
accordion
offcanvas
```

Lacunae already owns its Menu, BookingModal, FossilCard, Portfolio, and hero visual language. Bootstrap components may increase selector conflicts and visual drift.

## Nuxt Configuration

If component-scoped styles need global access to abstracts, consider Nuxt Vite SCSS `additionalData`, modeled after EIP:

```ts
vite: {
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: [
          `@use "sass:math";`,
          `@use "~/assets/styles/abstracts" as *;`,
        ].join("\n"),
      },
    },
  },
}
```

Only add this if it does not duplicate imports or break Sass resolution. If explicit `@use "~/assets/styles/abstracts" as *;` inside each SFC is clearer for this codebase, keep explicit imports.

## Migration Phases

### Phase 1: Add the system without broad behavior changes

Create the folder structure, token files, root output, and main import order. Keep current styles rendering the same. Preserve existing class names.

Move only the safest existing files:

- `_variables.scss` to `abstracts/_variables.scss`
- `_mixins.scss` to `abstracts/mixins/`
- `_typography.scss` to `base/_typography.scss`
- `nprogress-custom.scss` to `overrides/_nprogress.scss`
- `_layout.scss` to `layouts/_layout.scss`
- `_buttons.scss` to `components/_button.scss`
- `_portfolio.scss` to `components/_portfolio.scss` if needed

Leave `_menu.scss` behavior intact during this phase.

### Phase 2: Replace hard-coded values with tokens

Replace repeated colors, font stacks, z-index values, spacing, radius, and transition durations. Start with recent hard-coded additions:

- `app/components/ui/FloatingCardsHero.vue`
- `app/pages/index.vue`
- `app/components/layout/OpeningScreen.vue`
- `app/components/ui/BookingModal.vue`
- `app/components/layout/MainNav.vue`
- `app/assets/styles/_menu.scss` or its new location

Do not change layout or animation behavior while replacing values.

### Phase 3: Add Bootstrap SCSS foundation

Add `bootstrap` only if dependencies exist. If missing, install it deliberately and update `package.json` and lockfile in one commit.

Configure only Bootstrap variables, maps, reboot, containers, grid, and utilities first. Do not add Bootstrap JavaScript unless a feature explicitly needs it.

### Phase 4: Clean up Menu and scroll boundaries

After token migration passes, revisit Menu and global layout. Keep this phase separate because Menu recently had interaction fixes.

Focus on:

- `.wrap` scroll behavior versus window scroll.
- `.menu_on`, `.menu_off`, and `.menu_stop` class ownership.
- z-index layering for header, menu, opening screen, app transition, modals, and NProgress.
- Splitting global menu styles from component-specific auth overlay styles.

## Acceptance Criteria

The refactor is acceptable when:

- `npm run typecheck` passes.
- `npm run lint:style` passes, or all remaining warnings are documented with exact reasons.
- The dev server renders `/`, `/collection`, `/events`, `/portfolio`, and `/about`.
- Opening screen does not block Menu clicks.
- Menu opens, closes, and does not flash-close.
- Collection does not produce hydration mismatch warnings.
- Events can open the booking modal.
- The style entrypoint uses the new import order.
- Token files contain all shared colors, fonts, z-index values, spacing, radius, breakpoints, and transition durations.
- New or touched SCSS does not introduce hard-coded shared values outside token files.

## Review Checklist for Claude

Before finishing, run these searches and address each result:

```bash
rg -n "#[0-9a-fA-F]{3,8}|rgb\\(|rgba\\(|z-index: [0-9]|font-family: \\\"|border-radius: [0-9]|transition: .*s|@media .*width" app/assets/styles app/pages app/components
```

Treat this search as a review aid, not a blind failure. Keep one-off artwork geometry local. Convert semantic or repeated values to tokens.

Also run:

```bash
npm run typecheck
npm run lint:style
```

Do not modify `app/docs` unless the user explicitly asks for documentation updates there.
