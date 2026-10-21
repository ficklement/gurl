# gurl. (starter v0.1)

A private, account-based astrology compatibility journal, built with **React + Vite**, **Express**, **PostgreSQL**, and **Better Auth**. The presentation is deliberately minimal; Kaiser and all illustrated/animated layers are postponed.

## What works

- Email/password registration and login with real server sessions.
- One saved birth chart per user with Sun, Moon, and (when birth time is known) Rising signs.
- Open-Meteo birthplace lookup, `geo-tz` time-zone resolution, Luxon local-to-UTC conversion, local planetary calculations via Astronomy Engine.
- Add a named person and save their birth chart plus a **playful** compatibility score and gurl → guuuuurl reaction.
- Private comparison history, sorted by highest score or newest, search by nickname, edit nickname, delete entries.
- Responsive UI for desktop/mobile; no need to prepare mascot artwork yet.

## Run locally

Requirements: Node.js 20.19+ (22 LTS recommended), PostgreSQL 15+, and an internet connection for city search.

1. Extract this directory, then open a terminal in `gurl-starter`.
2. Create a PostgreSQL database (example: `CREATE ROLE gurl WITH LOGIN PASSWORD 'gurl_dev_password'; CREATE DATABASE gurl OWNER gurl;`). Do **not** use that example password on a public deployment.
3. `cp .env.example .env` (PowerShell: `Copy-Item .env.example .env`) and update `DATABASE_URL` and `BETTER_AUTH_SECRET`. Generate a secret via `openssl rand -base64 32` or another secure generator.
4. `npm install`.
5. Initialize Better Auth's tables: `npx auth@latest migrate --config ./server/src/auth.js`. The server code loads the project-root `.env` file directly, so this works from the root. If the CLI prompts about dependencies, approve installation.
6. Initialize gurl's tables with `npm run db:init`.
7. `npm run dev` and open **http://localhost:5173**.

### Birthplace lookup

The free [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api) needs **no account and no API key** for a noncommercial project. Credit Open-Meteo on any views that display its place data. City search is deliberately initiated by pressing Find or Enter, rather than querying on every keystroke. The service is used only to resolve city coordinates.

## API

- `GET /api/health`
- `GET /api/places?q=Phoenix` (requires login)
- `GET /api/chart` and `PUT /api/chart` (requires login)
- `GET /api/comparisons`, `POST /api/comparisons` (requires login)
- `PATCH /api/comparisons/:id`, `DELETE /api/comparisons/:id` (requires login)
- Better Auth handles `GET|POST /api/auth/*`.

## The Big Three math

- Tropical (Western) zodiac: each 30° longitude sector maps to a sign, starting at the vernal equinox (Aries).
- Sun and Moon are apparent/geocentric ecliptic longitudes of date.
- Ascendant is calculated from local apparent sidereal time, geographic latitude and ecliptic obliquity using a standard horizon-intersection formula. Before public deployment, verify rising-sign examples against reliable chart references, especially near sign transitions, very high latitudes, and historical dates.
- If exact birth time is unknown, we use local noon for an approximate Moon. We omit Rising. Sun or Moon are marked uncertain and omitted from scoring if their signs change within the birth date.
- If a chart is updated later, existing readings retain their original score. A future version should support recalculating historical scores by scoring version.

## Important before a public launch

This is a **local development starter**, not a security-reviewed production deployment. Add proper account recovery/email verification, rate limiting and abuse prevention, historical time-zone edge-case tests, additional input validation, consent/privacy copy, backups, and HTTPS on the production domain. Birth data about other people is sensitive: keep readings private and offer deletion. No real-world romantic outcome is predicted by the scoring method.

Do not publish actual passwords, `.env`, or user birth data to GitHub.

## Future art/animation seam

Later, Kaiser can occupy a `MascotStage` React component placed beside the result panel or above it on small screens. The body, head, eyes and mouths can be transparent assets layered and animated with GSAP, with `rating` as its only input. No current page depends on the mascot.
