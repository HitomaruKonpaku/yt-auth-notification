# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build, test, run

```
npm run build           # client:build + nest build
npm run start:dev       # http://localhost:8080 (watch mode)
npm run start:prod      # node dist/main
npm test                # all unit tests (via jest)
npx jest path/to/file.spec.ts   # single test file
npm run test:e2e        # e2e (jest --config ./test/jest-e2e.json)
```

Vite dev server (React client only — API must run separately on 8080):

```
npm run client:dev      # http://localhost:3000
```

## Architecture

NestJS 11 app with twelve modules. All modules are `@Global()` — no need to import them unless you need the types.

**Modules (all `@Global()`):** `ConfigModule` (YAML config), `YoutubeModule` (Innertube session + cookie watcher), `NotificationModule` (poll processing, repo), `DiscordModule` (webhook relay), `DisplayModule` (HBS web dashboard + JSON API), `AccountModule` (multi-channel session management), `ChannelModule` (channel CRUD), `PostModule` (community post polling), `SseModule` (Server-Sent Events), `HealthCheckModule` (session validity), `PollingModule` (orchestration loop).

**Entities:** `Notification`, `Channel`, `Post` — TypeORM with `better-sqlite3`. `synchronize: true` for schema; `db/migrate.ts` runs manual migrations (e.g. column renames) before Nest boots. `Notification.short_message` uses `jsonTransformer` for transparent JSON-encode/decode of `{ text, rtl }`.

**Data flow:** `main.ts` boots → runs `runMigrations()` → `app.listen()` → `PollingService.startPolling()` schedules first poll → each poll: `AccountService.initialize()` resolves channels from Innertube session → per-account `pollChannel()` calls `yt.getNotifications()` (+ optional continuation on first poll) → `NotificationService.processNotifications()` dedupes by ID, inserts → new items go to `DiscordService` (webhook embeds) and `SseService` (real-time push to React client).

**Polling lifecycle:** `startPolling()` calls `scheduleNext()` (no immediate first poll — first poll is disabled). `scheduleNext()` sets a `setTimeout` at the configured `interval` (seconds). Multi-account: iterates `accountService.accounts`, calls `pollChannel()` per account. `NOTIFICATION_NEXT` env controls first-poll continuation: `0` = one page, `-1` = all pages, `>0` = N extra pages. Also calls `postService.pollPosts()` when `fetchPost` config is enabled.

**Client — two layers:**

- **Server-rendered (HBS):** `display/views/index.hbs` — SPA shell served by Nest. Client JS fetches `/api/notifications`, polls `/api/notifications/latest` every 10s, fires browser `Notification` + plays `/se_chat_announce.ogg`. Pagination via `history.pushState`.
- **React SPA (Vite):** `client/` — React 19 + Mantine 9 + Vite 6. SSE connection to `/api/sse` for real-time updates. `client/src/api.ts` is the API layer. Built output goes to `public/` for Nest to serve as static assets.

## Key details

- `main.ts` respects `HOST` (default `localhost`) and `PORT` (default `8080`) env vars.
- `YTProvider` watches the cookie file (`fs.watchFile`, 30s interval) and invalidates the Innertube cache when the file changes — no restart needed. Also manages per-channel Innertube sessions keyed by channel ID.
- `CookieService` extends `EventEmitter` — emits `'changed'` when cookie file is modified, triggering `AccountService` to reset.
- `AccountService.initialize()` resolves channels via `yt.account.getInfo(true)`, filters to active channels, creates per-channel Innertube sessions. Handoff: selected channel reuses the main session; others get fresh sessions keyed by `pageId`.
- `youtubei.js` v17 is ESM-only. Jest can't parse it, so `jest.config.js` maps `youtubei\.js` → `src/test-mocks/youtubei.js.mock.ts`.
- `tsconfig.json` has `strictPropertyInitialization: false` (needed for TypeORM entity columns).
- `src/config/config.interface.ts` — all properties optional; `ConfigService` fills defaults.
- `src/common/link-builder.ts` — `buildYtEndpointUrl()` and `buildYtVideoThumbnailUrl()`.
- `src/common/author-parser.ts` — extracts channel name from notification text.
- `src/common/json-transformer.ts` — TypeORM value transformer for JSON columns.
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
