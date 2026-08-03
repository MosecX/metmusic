# MetMusic — HiFi Web Player

A Tidal-inspired web player that streams lossless / Hi-Res FLAC music through a Tidal-compatible API proxy. Built with the Next.js App Router, React 19 and Tailwind CSS.

> This is a **front-end client**. It does **not** interact with Tidal directly — all metadata and streaming go through your own API provider (see [Compatible APIs](#compatible-apis)).

## Status

This project is **very recent** and still under active development. It likely has bugs, rough edges and missing features. If you run into an error, find a broken flow or have a suggestion, please **[open an issue](https://github.com/MosecX/musify/issues)** — we'd be happy to know about it so we can fix it in upcoming updates.

## Features

- **Hi-Res audio streaming** — DASH (MPEG-DASH) and direct-stream playback with automatic quality badges (`HI-RES`, `LOSSLESS`, `HIGH`, `LOSSY`)
- **Fullscreen visualizer** — a native `<dialog>` visualizer with layered album-art animations, lyrics and full transport controls
- **System media controls** — Media Session API so OS / browser media keys (play, pause, next, previous, seek) control the player, with title/artist/artwork and progress in the lock screen
- **Keyboard shortcuts** — Space (play/pause), ←/→ (seek ±10s), ↑/↓ (volume), `N`/`P` (next/previous), `M` (mute)
- **Personalized home** — the featured album and recommendations rotate randomly on first visit and adapt to your listening history on later visits
- **Tidal Mixes** — real generated mixes (`/mix/<id>`) plus a mix hub (`/mix`) with seed-driven cards
- **Search** — live search with debounce across tracks, albums, artists and playlists
- **Library** — saved albums, artists, playlists and tracks
- **Detail pages** — album, artist, track, playlist and mix pages with play-all and queue support
- **Queue & playback controls** — shuffle, repeat (off/all/one), seek, volume, next/previous
- **Responsive UI** — sidebar navigation on desktop, bottom-tab navigation on mobile, aurora gradient background
- **Server-side data fetching** — pages fetch from the API on the server; client components only call the app's own `/api/*` routes

## Compatible APIs

The app talks to Tidal-compatible proxies. Compatibility depends on the provider:

| Provider | Streaming | Metadata | Overall |
| -------- | --------- | -------- | ------- |
| [ez-hifi-api](https://github.com/itenai/ez-hifi-api) (recommended) | DASH (`/track/`) **+ direct** (`/trackv2/`) | Full | **100%** — this is the reference implementation this player was built against |
| [hifi-api](https://github.com/binimum/hifi-api) | DASH (`/track/`) | Full | **~100%** — near-complete; everything works except the `/trackv2/` direct-stream fast path, which gracefully falls back to DASH |

Both are the same lineage: `ez-hifi-api` is a fork of `binimum/hifi-api`, which is itself a fork of the original `sachinsenal0x64/hifi`. Any provider exposing this API schema is supported:

- `GET /search/?s=&a=&al=&p=` — search tracks, artists, albums, playlists
- `GET /info/?id=` — track metadata
- `GET /album/?id=` — album detail + tracklist
- `GET /artist/?id=` / `GET /artist/?f=` — artist profile / discography
- `GET /playlist/?id=` — playlist detail + tracklist
- `GET /mix/?id=` — Tidal mix detail
- `GET /recommendations/?id=` — related tracks
- `GET /lyrics/?id=` — synced lyrics
- `GET /track/?id=&quality=` — DASH manifest (base64 MPD)
- `GET /trackv2/?id=` — direct stream URL (ez-hifi-api only)

## Tech Stack

- [Next.js 16](https://nextjs.org) (App Router, Turbopack)
- React 19
- TypeScript
- Tailwind CSS v4
- [dash.js](https://github.com/Dash-Industry-Forum/dash.js) for DASH playback
- [@uimaxbai/am-lyrics](https://www.npmjs.com/package/@uimaxbai/am-lyrics) for synced lyrics

## How it works

```
┌─────────────┐     ┌─────────────────────────┐     ┌──────────────────────┐
│   Browser   │ ──► │  Next.js app (this repo)│ ──► │   API provider       │
│  (dash.js)  │ ◄── │  /api/stream/* routes   │ ◄── │  (ez-hifi-api / hifi-│
└─────────────┘     └─────────────────────────┘     │   api)               │
                                                    └──────────────────────┘
```

1. Server components fetch metadata (albums, tracks, mixes, lyrics, search) from your provider and render the UI.
2. When the user hits play, the client asks `/api/stream/info?id=…`, which probes the provider for either:
   - a **direct** stream URL (`/trackv2/`, forwarded through `/api/stream`), or
   - a **DASH** manifest (`/track/`, fetched by `/api/stream/manifest`, with segment URLs rewritten to `/api/segment` to keep playback through your own origin).
3. `/api/segment` proxies media segments with `Range` support, so the browser never talks to the provider directly.
4. `/api/artwork` proxies album covers from Tidal's CDN so the Media Session API can display artwork (the CDN doesn't send CORS headers).

## Requirements

- Node.js 20+
- npm
- A Tidal-compatible API endpoint — preferably [ez-hifi-api](https://github.com/itenai/ez-hifi-api) (self-hosted). It's the most-supported provider.

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure the API provider

The app reads the API base URL from the environment. It is **never hardcoded** in the source.

```bash
cp .env.example .env
```

Then edit `.env` and set your provider:

```bash
# .env
NEXT_PUBLIC_API_BASE=https://your-provider.example.com
```

> `.env` is gitignored and must not be committed. `.env.example` is committed and only contains a placeholder, so the provider stays private.

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Keyboard Shortcuts

| Key            | Action                                |
| -------------- | ------------------------------------- |
| `Space`        | Play / pause                          |
| `←` / `→`      | Seek backward / forward 10 seconds    |
| `↑` / `↓`      | Volume up / down                      |
| `N` / `P`      | Next / previous track                 |
| `M`            | Mute / unmute                         |

Shortcuts are ignored while typing in inputs, or when a button/link has focus (native behavior takes over). Media keys (play/pause/next/prev/seek) and the lock-screen metadata are handled through the [Media Session API](https://developer.mozilla.org/en-US/docs/Web/API/Media_Session_API).

## Scripts

| Command            | Description                           |
| ------------------ | ------------------------------------- |
| `npm run dev`      | Start the dev server (Turbopack)      |
| `npm run build`    | Create an optimized production build  |
| `npm run start`    | Start the production server           |
| `npm run lint`     | Run ESLint                            |

## Environment Variables

| Variable               | Required | Description                                   |
| ---------------------- | -------- | --------------------------------------------- |
| `NEXT_PUBLIC_API_BASE` | Yes      | Base URL of your Tidal-compatible API provider |

If `NEXT_PUBLIC_API_BASE` is not set, the app throws a clear error at request time (`Set NEXT_PUBLIC_API_BASE in .env.local`). This variable is only used server-side and inside the app's own `/api/*` routes — the provider stays hidden from the browser.

## Deployment

### Vercel (recommended)

1. Push the repository to your Git host and import it into [Vercel](https://vercel.com) (it auto-detects Next.js — no extra config needed).
2. In **Project → Settings → Environment Variables**, add `NEXT_PUBLIC_API_BASE` pointing at your provider.
3. Deploy. The default build command (`next build`) and output are used as-is.

> **Note on self-hosting your provider:** do **not** deploy `ez-hifi-api`/`hifi-api` to a public host — see their READMEs for the account-ban risks and the intended homelab-only usage. Keep your API private and only expose the player.

### Self-hosted

```bash
npm run build
npm run start
```

Make sure `NEXT_PUBLIC_API_BASE` is present in the environment of the process (e.g. in the systemd unit, Docker env, or `.env.local`).

## API Routes

All routes return JSON or proxied media and are the only thing the client talks to.

| Route                            | Purpose                                                                 |
| -------------------------------- | ----------------------------------------------------------------------- |
| `GET /api/stream/info?id=`       | Returns `{ mode: "direct" \| "dash", url?, manifest?, quality }`          |
| `GET /api/stream?id=`            | Proxies a direct stream URL (Range-aware)                               |
| `GET /api/stream/manifest?id=&quality=` | Fetches the DASH manifest and rewrites segment URLs to `/api/segment` |
| `GET /api/segment?url=`          | Proxies a media segment with Range support                              |
| `GET /api/artwork?url=`          | Proxies album art from `resources.tidal.com` (with CORS headers)        |

## Project Structure

```
.
├── app/
│   ├── layout.tsx              # Root layout, nav shell, PlayerProvider
│   ├── page.tsx                # Home: featured album, recommendations, sections
│   ├── album/[id]/             # Album detail
│   ├── artist/[id]/            # Artist detail + discography
│   ├── track/[id]/             # Track detail
│   ├── playlist/[id]/          # Playlist detail
│   ├── mix/                    # Mix hub (seed-driven mix cards)
│   ├── mix/[id]/               # Real Tidal mix detail
│   ├── search/                 # Live search
│   ├── library/                # Saved albums/artists/playlists/tracks
│   └── api/
│       ├── stream/info/        # Probes provider: direct vs DASH
│       ├── stream/             # Forwards direct stream URL
│       ├── stream/manifest/    # Fetches + rewrites DASH manifest
│       ├── segment/            # Proxies media segments (Range-aware)
│       └── artwork/            # Proxies album art (CORS for Media Session)
├── components/
│   ├── player.tsx              # Playback engine (dash.js), queue, PlayerBar, visualizer
│   ├── track-row.tsx           # Track list rows + quality badge + mix shortcut
│   ├── cards.tsx               # Album / Artist / Mix cards + CardGrid
│   ├── quality-badge.tsx       # Per-track audio-quality badge
│   ├── lyrics.tsx              # Synced lyrics display
│   ├── sidebar.tsx             # Desktop navigation
│   ├── search-box.tsx          # Debounced search input
│   └── play-button.tsx         # Play-all toggle button
├── lib/
│   ├── tidal.ts                # API client + types (server-side fetches)
│   └── utils.ts                # Formatting helpers
└── next.config.ts              # Image remote patterns for Tidal CDNs
```

## Notes

- Image assets are served from Tidal's public CDN (`resources.tidal.com`, `images.tidal.com`); the allowed remote patterns are configured in `next.config.ts`.
- The API provider URL is only used server-side and via the app's own routes, keeping the underlying provider hidden from the browser.
- The CDN rejects the `500x500` cover size (403) — covers are requested at `640x640` and up.
