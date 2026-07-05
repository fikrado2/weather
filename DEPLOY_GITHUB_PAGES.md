# Deploying to GitHub Pages

> **Important:** This project is scaffolded as a TanStack Start SSR app
> (Cloudflare Workers target). GitHub Pages only serves static files, so
> you must convert it to a static build **or** switch to Cloudflare Pages
> (which works with zero changes).

## 1. Push to GitHub

In Lovable: click the **GitHub** button (top-right or in the `+` menu) →
**Connect project** → **Create repository**. Every save syncs
automatically.

## 2. Convert to a static build

Because the weather app fetches Open-Meteo directly from the browser, no
server code is required — it can run as a pure static SPA. You have two
ways to produce a static `dist/` folder:

### Option A — Migrate to Vite SPA (simplest, one-time)
Clone the repo locally and:

```bash
# swap TanStack Start SSR wrapper for plain Vite + react-router-dom
bun remove @lovable.dev/vite-tanstack-config @tanstack/react-start nitro
bun add react-router-dom
```

Then replace `vite.config.ts` with a standard Vite React config and move
`src/routes/index.tsx` into a `<BrowserRouter>` in `src/main.tsx`. After
this, `bun run build` outputs `dist/` ready for Pages.

### Option B — Keep TanStack, add nitro `static` preset
Advanced. Edit `vite.config.ts`:
```ts
export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
    prerender: { routes: ["/"] },
  },
  vite: {
    build: { outDir: "dist" },
  },
});
```
and set `NITRO_PRESET=static` when building. Not officially supported by
Lovable's config wrapper — may break on updates.

## 3. Set the base path

If your site is served from `https://<user>.github.io/<repo>/` (not a
custom domain), you must set Vite's `base` so assets resolve:

```ts
// vite.config.ts
export default defineConfig({
  base: process.env.BASE_PATH || "/",
});
```

The included workflow passes `BASE_PATH=/<repo-name>/` automatically.
Skip this step for a custom domain (`base: "/"`).

## 4. Enable GitHub Pages

In your GitHub repo → **Settings → Pages** → set **Source** to
**GitHub Actions**.

## 5. Deploy

The included workflow `.github/workflows/deploy-pages.yml` runs on every
push to `main`:
- installs deps with Bun
- runs `bun run build`
- copies `index.html → 404.html` (SPA fallback so deep links work)
- adds `.nojekyll` (so files starting with `_` are served)
- uploads `dist/` and publishes it

Watch progress under the **Actions** tab. Your site goes live at
`https://<user>.github.io/<repo>/` in ~1–2 minutes.

## Prefer zero setup?

If you don't specifically need GitHub Pages, deploy this repo to
**Cloudflare Pages** — it supports the current SSR build directly:
1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect Git**
2. Pick the repo, framework preset: **TanStack Start**
3. Deploy — done.