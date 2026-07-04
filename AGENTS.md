# CyberSec Frontend — Agent Guide

Single-page React app (Vite + React 18 + TypeScript + SWC + shadcn/ui + Tailwind v3).

## Commands

| Command | What |
|---|---|
| `npm run dev` | Dev server on port **8080** (not the Vite default) |
| `npm run build` | Production build to `dist/` |
| `npm run build:dev` | Dev-mode build |
| `npm run lint` | ESLint on all files |
| `npm test` | `vitest run` (single run) |
| `npm run test:watch` | `vitest` (watch mode) |
| `npm run preview` | Vite preview of built `dist/` |

## Key Config

- **Path alias:** `@/` → `src/` (works in TS, Vite, Vitest, ESLint — no special import config needed)
- **Base:** `./` (relative asset paths in build output)
- **Build output:** Single CSS/JS entry (`assets/css/index.css`, `assets/js/index.js`), images go to `assets/images/`
- **TS strict mode:** OFF (`strict: false`, `noImplicitAny: false`, `noUnusedLocals: false`, `strictNullChecks: false`)
- **ESLint:** `@typescript-eslint/no-unused-vars` is **off** — unused vars will not error
- **Dark mode:** Default is dark (`<html class="dark">`). Toggle via `.light` class on `<html>`.
- **Lockfile:** `bun.lockb` (also `package-lock.json` present — use npm to be safe)

## Environment Variables

| Variable | `.env` (dev) | `.env.production` | Usage |
|---|---|---|---|
| `VITE_API_BASE_URL` | `http://127.0.0.1:5000` | `/api` or your server URL | API calls in `HeroSection.tsx` |

Vite automatically loads `.env` for dev, `.env.production` for `vite build`.

## Architecture

- **Entry:** `src/main.tsx` → wraps `<ScanProvider>` around `<App />`
- **Routing:** `BrowserRouter` in `src/App.tsx`. Single real route `"/"` → `Index`, catch-all `"*"` → `NotFound`
- **Global state:** `ScanContext` (`src/context/ScanContext.tsx`) — holds `VulnerabilityItem[]` scan results
- **Data fetching:** Direct `fetch()` to `VITE_API_BASE_URL` endpoint. TanStack React Query available but unused.
- **UI library:** Only 4 shadcn/ui components kept: `toast`, `toaster`, `sonner`, `tooltip` (rest deleted as unused)
- **Styling:** Tailwind v3 + `tailwindcss-animate`. CSS variables in `src/index.css`
- **Utils:** `cn()` from `src/lib/utils.ts` (clsx + tailwind-merge), `attackToSeverity()` / `severityToLevel()` from `src/lib/constants.ts`
- **Font:** Golos Text (loaded from Google Fonts via `<link>` in `index.html`)

## Testing

- **Runner:** Vitest with jsdom environment, globals enabled
- **Setup:** `src/test/setup.ts` — imports `@testing-library/jest-dom`, provides `matchMedia` mock
- **Test pattern:** `src/**/*.{test,spec}.{ts,tsx}`
- **Expect style:** Globals (`describe`, `it`, `expect`) — no import needed

## CI / Deploy

- `.github/workflows/static.yml` — only creates a GitHub Release when pushing a `v*` tag. No build or test step in CI.
- For production: `npm run build` → serve `dist/` via Nginx/Apache or Flask static. Ensure `.env.production` sets `VITE_API_BASE_URL` to the backend URL.

## Notes

- `ScanContext` (`src/context/ScanContext.tsx`) is typed — `useScan() returns { result: VulnerabilityItem[], setResult }`
- Both `bun.lockb` and `package-lock.json` exist. Prefer `npm` to avoid confusion.
- **Delete `dist/` before building** to avoid stale artifacts (Vite doesn't auto-clean).
