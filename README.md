# aadaharma.com

Aada Härmä's craft site: a showcase of the
[Karelian Embroidery Designer](https://aadaharma.com/karelianembroiderymaker/),
a library of knitting patterns, and later a knitting pattern generator.
The site is in English and Finnish.

Built with [Next.js](https://nextjs.org/) (App Router) and plain CSS, hosted on
[Vercel](https://vercel.com/). Patterns are stored in a Postgres database (Neon) with
photos and PDFs in Vercel Blob.

## Development

Requires Node.js 20.19+ (22 recommended).

```sh
npm install
npm run dev         # http://localhost:3000
npm run build       # production build
npm run start       # serves the production build
npm run typecheck
```

Without a `DATABASE_URL`, the site reads patterns from the Markdown files in
`content/patterns/` (see below), so it runs without any setup. To use the real
database locally, pull the environment variables from Vercel:

```sh
npx vercel link
npx vercel env pull .env.local
```

## How the pages work

- `app/[lang]/` holds the pages. English pages have no prefix (`/patterns/`) and
  Finnish ones start with `/fi/`; `proxy.ts` maps the English addresses onto `app/[lang]`
  and redirects `/en/...` to the unprefixed address.
- `app/global-not-found.tsx` is the 404 page.
- `components/` holds the shared markup: `SiteDocument` (the page around the content),
  `Header`, `Footer`, decorations, and the small interactive parts (theme toggle,
  pattern filters, print button, fade-in on scroll).
- `src/i18n/en.json` and `fi.json` hold all the text. To edit copy, change it in both.
- `src/styles/` holds the CSS: `tokens.css` has the colours (light and dark) and fonts,
  `print.css` the print layout for patterns.
- `lib/knit-art.ts` draws the knitting charts and app mockups as inline SVG.
- `public/` is served as is (images, fonts, favicon).

To add a page, add its name to `PAGES` in `lib/i18n.ts`, create
`app/[lang]/<page>/page.tsx` (copy an existing one), and add its strings to both JSON files.

## Knitting patterns

Patterns live in the `patterns` table (`lib/db/schema.ts`). Each one has an address
`/patterns/<slug>/`, or `/fi/patterns/<slug>/` when its language is Finnish. Drafts
show in `npm run dev` but aren't published; to include them in a build, run
`SHOW_DRAFTS=1 npm run build`. The library's filter buttons are made from the `craft`,
`difficulty` and `yarnWeight` values, so keep those spelled consistently.

Pattern text is Markdown. A colourwork chart can be typed as text in a
```` ```chart ```` block (`X` = main colour, `.` = contrast colour); it's drawn as a
numbered chart.

An admin page for uploading patterns is on the way. Until then, patterns are written
as Markdown files and imported:

1. Copy `content/patterns/_template.md` and fill in the details at the top.
   The file name becomes the slug.
2. Put photos and an optional PDF in a folder with the same name,
   e.g. `content/patterns/my-socks/cover.jpg`.
3. Import them into the database (and the files into Blob). Running it again updates
   the patterns rather than duplicating them:

   ```sh
   npm run import:patterns
   ```

### Database changes

The schema is in `lib/db/schema.ts` and migrations in `drizzle/`. After changing the
schema:

```sh
npm run db:generate   # writes a new migration to drizzle/
npm run db:migrate    # applies it to the database in DATABASE_URL
```

## Deployment

Vercel builds and deploys every push: `main` goes to aadaharma.com and other branches
get a preview address. Environment variables are set in the Vercel project:

| Variable | Set by |
|---|---|
| `DATABASE_URL` | the Neon integration |
| `BLOB_READ_WRITE_TOKEN` | the Blob store |
| `NEXT_PUBLIC_SITE_URL` | optional, defaults to `https://aadaharma.com` (used for canonical links) |
