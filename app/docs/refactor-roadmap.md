# Refactor roadmap

This roadmap defines the next structural refactor for Lacunae. The goal is to make the codebase easier to maintain, safer to extend, and closer to the company Nuxt standard without forcing a risky rewrite.

## Refactor goals

| Goal | Result |
| --- | --- |
| Remove legacy data-provider coupling | The public site ships only the current NuxtHub/server API runtime. |
| Separate API contracts from page state | Endpoint definitions live in API modules; composables manage state and workflows. |
| Harden server behavior | Server routes validate access, publication status, capacity, and duplicate writes. |
| Prepare for admin features | Auth, roles, layouts, and upload flow have clear contracts before UI work starts. |
| Keep changes reviewable | Each phase lands as a small commit set with typecheck, lint, and build verification. |

## Target structure

Use the current project layout as the base. Do not copy `/Users/abel/nuxt-standard` or `/Users/abel/eip_fe` wholesale; borrow their conventions where they solve a current problem.

```text
app/
├── api/
│   ├── client.ts           # shared request layer
│   ├── normalize.ts        # ApiError normalization
│   └── modules/            # endpoint contracts grouped by domain
│       ├── fossils.ts
│       ├── species.ts
│       ├── projects.ts
│       ├── events.ts
│       └── bookings.ts
├── composables/            # stateful UI/data workflows
├── middleware/             # auth/admin guards when admin begins
├── stores/                 # session/global state
└── layouts/                # default/admin layouts

server/
├── api/                    # HTTP handlers
├── db/                     # schema and migrations
├── services/               # reusable domain logic for server routes
└── utils/                  # small server utilities
```

## Consolidation rules from `eip_fe`

`/Users/abel/eip_fe` is a Vue 3 + Vite enterprise admin project. It is not a Nuxt app, but its consolidation rules are useful for Lacunae.

### What to adopt

| Pattern | Why it helps Lacunae |
| --- | --- |
| Domain API files, such as `repairApi.ts` and `websiteApi.ts` | Keep endpoint URLs, payload types, and response unwrapping out of pages. |
| Central API constants, such as module names, permissions, and URL segments | Reduce string typos when admin CRUD APIs grow. |
| Request wrapper owns token, errors, binary responses, and abort handling | Keep authentication and network behavior out of components. |
| Route meta owns title, icon, auth, and back route | Make admin navigation and permissions inspectable from one route table. |
| Stores own cross-page workflow state | Keep pagination, filters, permissions, and session state stable across route changes. |
| Shared table, modal, upload, and form primitives | Avoid rebuilding the same admin interaction on every CRUD page. |
| One branch / one PR per refactor problem | Keep review scope small and make rollback realistic. |

### What not to copy blindly

| Pattern | Reason |
| --- | --- |
| A highly generic `FormInput` that handles every field type | It reduces duplication but can become hard to type and reason about. Prefer focused field components or a small form wrapper. |
| A large router guard that handles many workflows at once | Use the route meta idea, but split guards by responsibility when admin begins. |
| LocalStorage-backed auth as the long-term session model | Lacunae uses Nuxt and SSR, so cookie-backed session state is a better target. |
| Every enterprise-admin abstraction | Lacunae is still a public content site first; add admin abstractions only when the admin feature starts. |

### When to consolidate

Consolidate only when at least two of these are true:

- The same value, payload shape, or workflow appears in more than one place.
- A typo can create a runtime bug, such as route names, permission names, API path segments, or status values.
- Multiple features need to extend the same rule.
- The rule maps to API schema, form schema, or database schema.
- The abstraction makes the caller shorter and clearer.

Do not consolidate when the code appears once, the shape is still exploratory, or the abstraction needs many options to describe one local use case.

## Phase 1: Remove the legacy runtime

Status: **done** (2026-08-11). The public app now ships only the current NuxtHub/server API runtime. Obsolete provider-specific scripts and documents have been removed.

### Tasks

1. Replace `useAuth()` with a local disabled-auth implementation while admin auth is not ready. ✅
2. Replace `useFavorites()` with a localStorage-only implementation. ✅
3. Remove obsolete provider modules from `nuxt.config.ts`. ✅
4. Remove obsolete provider dependencies after imports are gone. ✅
5. Replace provider-specific timestamp type references with local serializable date types. ✅
6. Delete obsolete provider-specific maintenance scripts and documents. ✅

### Acceptance checks

```bash
npm run typecheck
npm run lint:script
npm run lint:style
npm run build
```

The production build should no longer warn that an obsolete data-provider SDK is included in the client bundle.

## Phase 2: Split API modules from composable state

The current `apiFetch()` layer is useful, but endpoint paths still live inside domain composables. Move endpoint calls into API modules first; keep composable public method names stable.

### Tasks

1. Add `app/constants/api.ts` for stable API path segments when they repeat.
2. Add `app/api/modules/fossils.ts`, `species.ts`, `projects.ts`, `events.ts`, and `bookings.ts`.
3. Export plain async functions from modules, such as `listFossils()`, `getFossilBySlug()`, and `createBooking()`.
4. Update `useFossils()`, `useSpecies()`, `useProjects()`, and `useEvents()` to call API modules.
5. Keep page components unchanged unless TypeScript requires a small import cleanup.
6. Document the module convention in [api-reference.md](./api-reference.md) or this file.

### Acceptance checks

- Existing pages keep the same behavior.
- Composable method names stay stable.
- Typecheck and lint pass.

## Phase 3: Harden booking and public-content APIs

The public-content checks for fossils, projects, and events are now improved. Booking still needs stronger server-side rules before the site can safely accept real traffic.

### Tasks

1. In `POST /api/bookings`, verify the event exists and is published.
2. Reject registration when `registeredCount >= capacity`.
3. Reject duplicate registration by `uid` or normalized email for the same event.
4. Wrap booking insert and `registeredCount` update in one transaction if the deployed database driver supports it.
5. Return consistent `ApiError` messages for duplicate, full, missing, and unpublished events.
6. Add focused server-side tests if the project gains a test runner.

### Acceptance checks

- Duplicate requests do not increase `registeredCount`.
- Full events return a client-safe error.
- Unpublished events cannot receive bookings.

## Phase 4: Prepare the admin foundation

Do not start admin UI before defining the auth contract. The UI will be easier to build after session, role, and upload rules are stable.

### Tasks

1. Add a `users` table and decide role fields, such as `role: "admin" | "editor"`.
2. Choose the auth implementation. Prefer a first-party database-backed session.
3. Add `app/stores/session.ts` using cookie-backed session state.
4. Add `app/middleware/auth.ts` and `app/middleware/admin.ts`.
5. Add `app/layouts/admin.vue`.
6. Define route meta fields for title, auth, admin menu visibility, and back route.
7. Define upload APIs for blob images before building upload UI.

### Acceptance checks

- Admin routes have server and client guards.
- Session state works during SSR and client navigation.
- Upload APIs write blob objects and database paths in the same workflow.
- Route meta is the source of truth for admin navigation and permissions.

## Phase 5: Improve page and component boundaries

Some route pages still own data loading, transformation, UI state, and large template sections in one file. Split only where the split reduces real complexity.

### Tasks

1. Keep route pages as composition surfaces.
2. Move large feature sections into `app/components/<domain>/`.
3. Move route-specific state workflows into focused composables.
4. Replace duplicated image URL normalization with one helper.
5. Keep visual components presentational when possible.
6. Extract shared admin primitives only after two screens need the same table, modal, form, upload, or confirm workflow.

### Candidate areas

| Area | Reason |
| --- | --- |
| `app/pages/species/[slug].vue` | Owns routing, data loading, grouping, tabs, image selection, and presentation. |
| `app/pages/index.vue` | Owns hero behavior, fossil fetching, randomization, pagination, and lazy loading. |
| `app/components/ui/BookingModal.vue` | Owns form state, duplicate checks, booking creation, and EmailJS side effects. |

### Admin primitive candidates

These should wait until the first admin pages exist:

| Primitive | Use when |
| --- | --- |
| `AdminDataTable` | Two or more admin resources need the same list, paging, sorting, or row actions. |
| `AdminModal` | Create/edit/delete dialogs share header, footer, pending, and error states. |
| `useCrudModal()` | Multiple admin screens need create/edit/current item state. |
| `usePaginatedQuery()` | Multiple list screens share page, page size, filters, and reload behavior. |
| `useConfirmAction()` | Destructive actions repeat confirm, pending, success, and error handling. |

### Acceptance checks

- Route behavior does not change.
- Extracted components have explicit props and emits.
- Existing lint and typecheck pass after each split.

## Phase 6: Add a lightweight test baseline

Do this after the first structural refactors. Tests should lock high-risk behavior, not snapshot every component.

### Tasks

1. Add Vitest for pure utilities, API normalization, and server service logic.
2. Add Playwright only for critical flows, such as opening the index, species page, portfolio page, and booking modal.
3. Ignore local Playwright MCP artifacts with `.playwright-mcp/`.
4. Add CI commands after tests are stable locally.

### Acceptance checks

```bash
npm run typecheck
npm run lint
npm run build
```

Add test commands to this list once they exist.

## Commit strategy

Use small commits grouped by behavior. Follow the `eip_fe` rule: one problem, one branch, one PR when the change is large enough to review independently.

```text
refactor(auth): remove obsolete runtime fallback
refactor(api): add domain api modules
fix(bookings): enforce server-side registration rules
feat(admin): add session and admin route foundation
refactor(species): split species page sections
test(api): add server behavior coverage
```

Each commit should leave the app runnable. Avoid combining dependency removal, API behavior changes, and UI extraction in the same commit.

## Stop conditions

Pause the refactor when any of these happen:

- A phase requires a product decision, such as auth provider, admin roles, or domain model changes.
- A change requires deleting historical data or regenerating production data.
- A refactor changes public routes, URL query behavior, or image paths.
- A phase cannot pass typecheck and lint without unrelated fixes.
