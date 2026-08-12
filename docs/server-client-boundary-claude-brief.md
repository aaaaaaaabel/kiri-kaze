# Lacunae Server and Client Boundary Brief

This brief defines the next refactor after the SCSS system work. Lacunae previously used a Firebase/client-first style. The project now uses Nuxt server APIs with SQLite/Turso-compatible schema, so the data boundary should move toward a server-first Nuxt model.

Do not mix this work with SCSS token migration. Treat this as a separate task.

## Goal

Create clearer TypeScript and data boundaries between:

- Database rows.
- Server services.
- API DTOs.
- Client composables.
- UI form state.
- Client-only preferences such as localStorage favorites.

The first implementation pass should focus on events and booking. Do not refactor fossils, species, or portfolio in the same pass unless a type dependency makes a small local change unavoidable.

## Current Context

The current app still contains client-first patterns from the Firebase phase:

- Pages often fetch data in `onMounted`.
- Domain interfaces can live inside composables, such as `IEvent` and `IBookingInput` in `app/composables/useEvents.ts`.
- Client components handle some normalization that server APIs can own.
- Booking relies on client checks before submitting.
- Auth is currently disabled and works as a placeholder store.
- Favorites stay in localStorage, which is acceptable until first-party auth lands.

Nuxt server APIs and database access now make a better boundary possible.

## Scope for the First Pass

Only handle events and booking:

- `app/composables/useEvents.ts`
- `app/pages/events.vue`
- `app/components/ui/BookingModal.vue`
- `server/api/events/index.get.ts`
- `server/api/events/slug/[slug].get.ts`
- `server/api/bookings/index.post.ts`
- `server/api/bookings/check.get.ts`
- New event or booking type files.
- New server service or mapper files.

Do not rewrite UI styling. Do not change the visual layout. Do not modify `app/docs` unless the user explicitly asks for documentation changes there.

## Type Organization

Move reusable domain types out of composables. Prefer one of these locations:

```text
app/types/event.ts
```

Use `app/types` if only the client imports the types.

```text
shared/types/event.ts
```

Use `shared/types` only when both server and client need the same DTO or payload types. Avoid importing `app/composables` from server code.

Suggested event and booking types:

```ts
export interface EventDto {
  id: string
  slug: string
  title: string
  description: string
  date: string
  time: string
  location: string
  image: string
  capacity: number
  registeredCount: number
  isPublished: boolean
  createdAt?: string
}

export interface BookingFormState {
  name: string
  email: string
  phone: string
  notes: string
}

export interface BookingInput {
  eventId: string
  eventTitle: string
  uid: string | null
  name: string
  email: string
  phone: string
  notes: string
}

export interface BookingCheckResult {
  exists: boolean
}

export interface BookingResult {
  success: true
}
```

Keep names consistent. Do not start a broad project-wide rename from `IFossil` or other existing interfaces in this task.

## Server Boundary

API routes should parse input, call services, and return DTOs. Move domain logic into server services or mappers.

Recommended files:

```text
server/services/events.service.ts
server/services/bookings.service.ts
server/utils/event-mapper.ts
```

The mapper should convert database rows to API DTOs. The client should not need to know database row shape.

Example responsibilities:

- `event-mapper.ts`: Convert `schema.events.$inferSelect` rows into `EventDto`.
- `events.service.ts`: Fetch published events, fetch by slug, and sort events.
- `bookings.service.ts`: Validate booking eligibility, detect duplicates, create booking, and update `registeredCount`.

## Booking Server Rules

`POST /api/bookings` must enforce these rules on the server:

- The event exists.
- The event is published.
- `capacity <= 0` means unlimited capacity.
- If `capacity > 0`, `registeredCount` must be lower than `capacity`.
- The same event and `uid` cannot register twice when `uid` exists.
- The same event and normalized email cannot register twice when `uid` is missing.
- Booking creation and `registeredCount + 1` should stay consistent.

If the database driver supports transactions in this project, use a transaction for insert plus count update. If a transaction is not straightforward with the current NuxtHub/db0/libsql setup, keep the implementation simple and document the residual race condition in the final report.

## Client Boundary

Use SSR-friendly data fetching for event lists:

```ts
const { data: events, pending, error, refresh } = await useFetch<EventDto[]>("/api/events", {
  default: () => [],
})
```

or wrap it in a composable:

```ts
export function useEventsData() {
  return useFetch<EventDto[]>("/api/events", {
    key: "events",
    default: () => [],
  })
}
```

Booking submission is a mutation and can continue using `$fetch` or the existing `apiFetch` wrapper:

```ts
export function createBooking(input: BookingInput) {
  return apiFetch<BookingResult>("/api/bookings", {
    method: "POST",
    body: input,
  })
}
```

Avoid fetching the initial events list only in `onMounted`. Keep `onMounted` for DOM-only work.

## Auth and Favorites

Do not build authentication in this task.

Auth is currently a placeholder because first-party session auth is not ready. Booking should continue to support guest submissions with `uid: null`.

Favorites can remain localStorage-based. They are client preferences, not database-backed user state. Rename or document this as `local favorites` only if it does not expand the task.

## Docs Cleanup

The project has both root `docs/` task briefs and `app/docs/` maintenance documents. Keep these purposes separate:

- `docs/`: Temporary task briefs for Claude/Cursor coordination.
- `app/docs/`: Project maintenance documentation that ships with the app repository.

Review `app/docs/qa-interaction-report.md` after the event/booking refactor and SCSS work settle. Delete it only when the QA checklist remains true after verification:

- Menu first click is not swallowed by the opening screen.
- Menu does not flash-close from stale timers.
- Menu rapid clicks do not get silently ignored for long periods.
- Home scroll rhythm is acceptable.
- `/events` can open and submit the booking UI when configured.
- `/collection` has no hydration mismatch.

If the QA file is deleted, also remove its link from `app/docs/README.md`.

Do not delete long-term documentation such as:

- `app/docs/README.md`
- `app/docs/maintenance.md`
- `app/docs/database.md`
- `app/docs/api-reference.md`
- `app/docs/images-and-blob.md`
- `app/docs/scripts-reference.md`
- `app/docs/refactor-roadmap.md`
- `app/docs/branding-and-fonts.md`

Instead, update them only when the implementation changes their documented behavior.

## Acceptance Criteria

The refactor is acceptable when:

- `IEvent` and `IBookingInput` no longer live in `app/composables/useEvents.ts`.
- Server code does not import client composables.
- `/events` uses SSR-friendly data fetching.
- Booking server logic checks existence, published state, capacity, and duplicates.
- Guest booking with `uid: null` still works.
- The UI behavior remains visually unchanged.
- `npm run typecheck` passes.
- Existing SCSS migration work is not overwritten.

## Final Report Format

Report:

1. Which type files were added or changed.
2. Which server services or mappers were added.
3. How `/events` now fetches data.
4. What server-side booking protections now exist.
5. Which client-only leftovers remain and why.
6. Whether `app/docs/qa-interaction-report.md` is safe to delete.
7. The `npm run typecheck` result.
