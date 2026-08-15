<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project: MetMusic — HiFi Web Player

Tidal-inspired web player streaming lossless/Hi-Res FLAC through a Tidal-compatible API proxy. Next.js 16 App Router + React 19 + TypeScript + Tailwind v4. Ships as a PWA and an Android app (Capacitor 8). See `README.md` (EN) / `README.es.md` (ES) for the user-facing docs.

## Commands

- `npm run dev` — start dev server (Turbopack), http://localhost:3000
- `npm run build` — production build (uses Turbopack)
- `npm run start` — serve production build on port 3000
- `npm run lint` — ESLint (eslint-config-next)

Always run `npm run lint` (and a build when the change is server/route-level) after making changes.

## Architecture rules

- **Metadata never hits the browser directly.** Server components (`app/**/page.tsx`) and API route handlers (`app/api/**`) are the only things allowed to call the API provider. Client components call only the app's own `/api/*` routes.
- `NEXT_PUBLIC_API_BASE` is read from the environment (never hardcoded). `requireApiBase()` in `lib/tidal.ts` throws a clear error if unset. `.env` is gitignored; `.env.example` is the committed placeholder.
- **Streaming flow:** `/api/stream/info` probes the provider → `direct` (`/api/stream` proxies a `/trackv2/` URL) or `dash` (`/api/stream/manifest` fetches `/track/`, base64 MPD → rewrites segment URLs to `/api/segment`). `/api/segment` is Range-aware. `/api/artwork` proxies Tidal CDN covers (adds CORS headers; required for Media Session artwork).
- `/api/stream/info` accepts `&native=1` (native clients prefer direct AAC over FLAC DASH, since the Android WebView can't decode FLAC via MSE) and `&atmos=1`. On DASH failure the player falls back to direct → `LOSSLESS` → `HIGH`.
- **Long playlists are paginated:** `/api/playlist/[id]/tracks?limit=&offset=` backs the infinite scroll in `components/playlist-content.tsx`.
- Image URLs are built in `lib/tidal.ts` (`coverUrl`, `pictureUrl`, `mixImageUrl`) → `resources.tidal.com/images/...`. Tidal CDN rejects the `500x500` size (403) — use `640x640` or larger.

## API provider compatibility

- **Primary:** [ez-hifi-api](https://github.com/itenai/ez-hifi-api) — 100% compatible (this player was built against it). Endpoints used: `/search/`, `/info/`, `/album/`, `/artist/`, `/playlist/`, `/mix/`, `/recommendations/`, `/lyrics/`, `/track/` (DASH), `/trackv2/` (direct).
- **Also compatible:** [hifi-api](https://github.com/binimum/hifi-api) — near-100%; everything except `/trackv2/` (direct stream falls back to DASH).

## Code conventions

- No code comments unless explicitly requested.
- TypeScript strict; use `@/` path alias (maps to project root).
- Follow existing component/file conventions (see `components/`, `lib/`).
- Player logic lives in `components/player.tsx` (dash.js engine, queue, PlayerBar, Media Session, keyboard shortcuts, visualizer).
- Media Session helpers live in `lib/media-session.ts` — web via the standard `navigator.mediaSession` + `@capgo/capacitor-media-session` when `window.Capacitor?.isNativePlatform?.()` is truthy.
- Native back handling lives in `components/android-back.tsx` (`@capacitor/app`): closes open `<dialog>`, else `history.back()`, else `App.minimizeApp()`.
- Tailwind v4 (CSS-first config, `@import "tailwindcss"`).

## Capacitor / Android

- `capacitor.config.ts`: appId `com.metmusic.app`, `webDir: "web"`, `server.url` points at the deployed web app (the APK is a WebView shell, it doesn't bundle the Next.js server). Do not commit a changed `server.url` without the user asking.
- Local APK build: `npm run build` → `npx cap sync android` → `cd android && ./gradlew assembleDebug`.
- `.github/workflows/build-apk.yml` runs on push to `main`: lint → web build → `cap sync` → Gradle debug build → upload `app-debug.apk`.
- Native-only code must be feature-gated: check `window.Capacitor?.isNativePlatform?.()` and import Capacitor packages only in client components wrapped in `useEffect`.

## Deep links (Android App Links)

- `android/app/src/main/AndroidManifest.xml` declares a `VIEW` intent-filter with `android:autoVerify="true"` for `https://metmusic.qzz.io` → any link on that domain can open `com.metmusic.app`.
- `public/.well-known/assetlinks.json` maps the domain to `com.metmusic.app`. **The `sha256_cert_fingerprints` value must match the signing key of the installed APK** — the committed one is the base64 of the local debug keystore SHA-256 (`keytool -list -v -keystore ~/.android/debug.keystore`). Debug builds from CI (fresh runner keystore) or a release keystore need a matching fingerprint or links won't auto-verify.
- `components/deeplink-handler.tsx` (mounted in `app/layout.tsx`) listens for `appUrlOpen` + `getLaunchUrl()` via `@capacitor/app` and `router.push()`es the path (`/album/123`, `/artist/…`, `/track/…`, `/playlist/…`, `/mix/…`, `/search`, `/library`) when host is `metmusic.qzz.io`.
- Re-run `npx cap sync android` after manifest changes so the Gradle project picks them up.

## Verification

- Dev/build server may be launched detached; it listens on port 3000. To stop a stray server: kill the process listening on port 3000 (it may be `next dev` or `next start`).
- Puppeteer-based verification scripts live in `C:\Users\{user}\AppData\Local\Temp\opencode\cdntest\` (Edge headless).
- Git push in PowerShell prints stderr as a red "error" block but succeeds. The working tree may show a local, uncommitted `capacitor.config.ts` change (user's `server.url`) — leave it alone.