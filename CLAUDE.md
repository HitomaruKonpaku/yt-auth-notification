# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build, test, run

```
npx nest build          # TypeScript compile
npm run start:dev       # http://localhost:8080
npx jest                # all unit tests (38 tests, 9 suites)
npx jest path/to/file.spec.ts   # single test file
npx jest --config ./test/jest-e2e.json   # e2e
```

## Architecture

NestJS 11 app with five modules. All modules are `@Global()` — no need to import them unless you need the types.

**Data flow:** `main.ts` boots → `app.listen()` → `PollingService.startPolling()` → `YTProvider.getYt()` creates Innertube session → `poll()` calls `yt.getNotifications()` (and optionally `page.getContinuation()` for pagination) → `NotificationService.processNotifications()` dedupes by ID, inserts via TypeORM → new items relayed to `DiscordService` → embed posted to each configured webhook.

**Polling lifecycle:** `startPolling()` calls `poll()` immediately (first poll on boot), then `setTimeout` loops. Backoff on YouTube errors: `wait = min(wait * 2, 30min)`, resets on success. `NOTIFICATION_NEXT` env controls continuation: `0` = one page, `-1` = all pages, `>0` = N extra pages.

**DB:** TypeORM with `better-sqlite3` driver. `Notification` entity has a `ShortMessage` transformer that transparently JSON-encodes/decodes `{ text, rtl }` objects — no manual `JSON.parse`/`stringify` needed.

**Client:** `index.hbs` is a SPA shell. Client JS fetches `/api/notifications`, renders the list, polls `/api/notifications/latest` every 10s for new items, fires browser `Notification` + plays `/se_chat_announce.ogg` on new items. Pagination via `history.pushState`. Fixed header and footer bars.

## Key details

- `YTProvider` watches the cookie file (`fs.watchFile`, 30s interval) and invalidates the Innertube cache when the file changes — no restart needed.
- `youtubei.js` v17 is ESM-only. Jest can't parse it, so `jest.config.js` maps `youtubei.js` → `src/test-mocks/youtubei.js.mock.ts`.
- `tsconfig.json` has `strictPropertyInitialization: false` (needed for TypeORM entity columns).
- `src/config/config.interface.ts` — all properties optional; `ConfigService` fills defaults.
- `src/common/link-builder.ts` — `buildYtEndpointUrl()` and `buildYtVideoThumbnailUrl()`.
- `src/common/author-parser.ts` — extracts channel name from notification text.
- `example/` — docker-compose, config, cookies templates.
- `docker/Dockerfile` — multi-stage, `tini` init, mounts `/data`, `/cookies.txt`, `/config.yaml`.

## Style

- No git (add/commit/push blocked)
- `catch (err)`, never `catch (e)`
- All `if`/`for`/`while` have braces, body on own line
- Interfaces in dedicated files (not co-located with services)
- Public methods before private
- `?` over `| null` for optional fields
- No inline styles in HTML
