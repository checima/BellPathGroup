# Bell Path Group — Website

A two-page marketing site for **Bell Path Group**, a family office. Built as a
zero-build static site (HTML + CSS + vanilla JS) for instant, config-free
deployment to Netlify.

🔗 Production: <https://www.bellpathgroup.com/>

---

## Project structure

```
.
├── index.html              # Homepage (hero + parallax, overview, approach,
│                           #   attributes, sectors, contact form)
├── about/
│   └── index.html          # About page → clean URL /about/
├── thank-you/
│   └── index.html          # Form submission confirmation → /thank-you/
├── assets/
│   ├── brochure.pdf         # Downloadable brochure (linked by the nav button)
│   ├── css/styles.css       # All styles + design tokens from the brand guide
│   └── js/main.js           # Parallax, scroll-aware nav, reveal-on-scroll, menu
├── netlify.toml            # Publish dir, pretty URLs, headers, redirects
├── robots.txt
├── sitemap.xml
└── README.md
```

## Design system

Every color, type-size, radius, spacing step, and motion timing is taken
directly from `bell_path_group_style_guide.html` and exposed as CSS custom
properties at the top of [`assets/css/styles.css`](assets/css/styles.css):

- **Primary** Forest `#226C55` · **Midnight** `#1A2E3B` · **Wheat** gold `#C8A96E`
- System sans-serif stack (`-apple-system, Inter, Segoe UI…`)
- Elevation via border + background contrast — **never** box-shadow
- Calm motion: 150ms hover, 300ms entrance, ease-out, no spring/bounce
- All scroll motion respects `prefers-reduced-motion`

## The hero background

The homepage hero is an **on-brand CSS scene** — layered gradients, an abstract
topographic ridge-line, and a winding "path" motif — rendered entirely in code
(inline SVG data-URIs). No external image, no licensing, fast load. Five layers
parallax at independent rates via a single `requestAnimationFrame` loop using
only `transform` (GPU-composited, 60fps). A gradient scrim keeps headline text
above 4.5:1 contrast.

## Contact form (Netlify Forms)

The homepage form uses [Netlify Forms](https://docs.netlify.com/forms/setup/) —
no backend required. Detection is automatic on deploy via the `data-netlify`
attribute + hidden `form-name` field. A honeypot (`bot-field`) blocks spam.
Submissions appear in **Netlify dashboard → Forms** and redirect to
`/thank-you/`. To get email notifications, add one under
*Site settings → Forms → Form notifications*.

## Local preview

No build step. Serve the folder with any static server, e.g.:

```bash
npx serve .
# or
python -m http.server 8000
```

Open <http://localhost:8000>. (Netlify Forms only run on the deployed site.)

## Deploy to Netlify

1. Push this folder to a GitHub repository.
2. In Netlify: **Add new site → Import an existing project** → pick the repo.
3. Leave build command empty and publish directory as `.` (already set in
   `netlify.toml`). Click **Deploy**.
4. Point the `www.bellpathgroup.com` domain at the site under
   **Domain settings**.

Zero configuration required — the `netlify.toml` handles pretty URLs, caching,
security headers, and `.html → clean URL` redirects.

## Editing content

- Homepage copy → `index.html`
- About copy → `about/index.html`
- Brand tokens / styles → `assets/css/styles.css`
- Replace the brochure → drop a new `assets/brochure.pdf` (keep the filename).
