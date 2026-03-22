# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start development server
npm run build        # Build static export
npm run lint         # Run ESLint
npm run test         # Run Jest in watch mode
npm run test:ci      # Run Jest with coverage (CI)
```

To run a single test file:
```bash
npx jest src/app/util/posts/getPosts.test.ts
```

## Architecture

This is **Curtis Timson's personal blog** (curtiscode.dev), a Next.js 15 static site (`output: 'export'`) using the App Router. Content is stored as markdown files in `/posts/{year}/`.

### Content Pipeline

Markdown posts are loaded at build time:
1. `getPosts()` (`src/app/util/posts/`) reads all `.md` files recursively
2. `gray-matter` parses YAML frontmatter; content is validated with a Zod schema
3. `showdown` converts markdown body to HTML
4. `highlight.js` handles syntax highlighting (JS, Bash, TS, CSS)

Post frontmatter requires: `id` (timestamp), `title`, `slug`, `date` (ISO), `tags` (array). Optional: `description`, `image`, `author`.

### Routing

- `/` — paginated post listing (20/page)
- `/post/[slug]` — individual post
- `/posts/[page]` — paginated index
- `/tag/[tag]/[page]` — tag-filtered listing
- `/rss.xml`, `/sitemap.xml` — generated feeds

All dynamic routes use `generateStaticParams` for static pre-rendering.

### Key Locations

- `src/app/config.ts` — site title, URL, social links, posts-per-page
- `src/app/util/posts/` — all post processing logic (filtering, pagination, tags, related posts); tests are co-located here
- `src/app/context/` — theme (light/dark) via React Context
- `src/app/components/` — shared UI components

### Styling

Tailwind CSS + DaisyUI (light/dark themes) + SCSS modules per component. Typography for post prose via `@tailwindcss/typography`.

### SEO

Each post page generates OpenGraph tags, Twitter Card tags, JSON-LD `BlogPosting` schema, and canonical URLs. Images for OG should be 1200×630px placed under `public/post/{slug}/`.
