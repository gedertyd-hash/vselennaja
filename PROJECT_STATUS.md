# PROJECT_STATUS

Working notes for whichever Claude session picks up this repo next. Read this before starting new work — it exists specifically because two parallel sessions once duplicated a guide and added off-topic content without knowing about each other (see "Known issues" below). Keep it updated at the end of each content batch (a course module, a handful of guides, a feature change). Keep entries short and factual — no chat transcripts, no unresolved speculation, no secrets.

## What this project is

"ИИшница" — a closed-club learning platform (Next.js Mini App + regular website) tied to a paid Telegram channel, teaching AI tools (Claude, ChatGPT, AI agents) to Russian-speaking business owners/entrepreneurs. Dark "fried egg / yolk" visual identity. Owner (`gedertyd@gmail.com`) is non-technical — communicates in Russian, needs plain-language walkthroughs for anything requiring her to click through Vercel/GitHub/Neon UIs herself.

## Tech stack & key decisions

- **Next.js 16** (App Router) — breaking changes from training-data expectations: `proxy.ts` not `middleware.ts`, async `params`/`searchParams`/`cookies()`. Read `node_modules/next/dist/docs/` before assuming an API.
- **Prisma v7** with `@prisma/adapter-pg` driver adapter, `prisma-client` generator (not `prisma-client-js`), `prisma.config.ts`. Canonical DB is **Postgres via Neon** — SQLite was abandoned early; local `npm run dev` with a real DB connection is not runnable in this sandbox (network restricted), so verification here is `prisma generate` (schema-only) + `npm run lint` + `npx next build` (bypasses the DB-touching build script). Live QA happens on the deployed Vercel URL, by the owner.
- **Auth**: custom session via `jose` JWT + httpOnly cookies (not NextAuth), following Next's documented DAL/session pattern. Telegram Mini App auth via HMAC-validated `initData`.
- **Styling**: Tailwind v4 (CSS-first config in `src/app/globals.css`, no `tailwind.config.js`), `@tailwindcss/typography` with custom `--tw-prose-*` tokens in `.prose-iishnitsa`. Design tokens (colors/fonts) as CSS custom properties in `globals.css` — see that file for the full palette (`--bg`, `--yolk`, `--cream`, etc.) before generating any illustration/image that needs to match brand.
- **Content rendering**: `react-markdown` + `remark-gfm` via `src/components/MarkdownContent.tsx`. Fenced code blocks get a copy-to-clipboard button via `src/components/CodeBlock.tsx` (wired in as the `pre` component override) — reuse this for any prompt/command block in new content, no extra work needed, it's automatic for every ` ``` ` fence.
- **Video**: `Lesson.videoUrl` + `<iframe>` in both the lesson viewer and the single-page material view. Already wired, just set `videoUrl` on a lesson draft to use it.
- **Lesson metadata**: `Lesson.kind` (`THEORY | PRACTICE`, optional) and `Lesson.durationMinutes` (optional) — shown as badges on course/lesson pages (`X/Y · ~Z мин` per module, `Теория · 10 мин` per lesson). Both optional so older content without them still renders fine (badge just doesn't show).
- **Content source of truth**: `src/lib/demo-content.ts` — exports `DEMO_MATERIALS` array + `seedDemoContent(prisma)` (idempotent upsert, sets `published: true`). This is the ONLY place content should be written. An admin-only "Заполнить демо-материалами" button on `/admin` re-runs this against the live DB — that's how the owner gets new content onto the deployed site without touching a terminal.
- **Images in guides**: generated as self-contained HTML (dark bg, brand colors/fonts embedded as base64 woff2 — Google Fonts CDN is NOT reliably reachable from Playwright/Chromium in this sandbox even though `curl` can reach it, so always inline fonts as data URIs rather than `@import`), screenshotted via Playwright + `/opt/pw-browsers/chromium`, saved to `public/guides/*.png`, referenced in markdown as `![alt](/guides/filename.png)`. `.prose-iishnitsa img` has rounded corners + border via `globals.css`.

## Deployment / ops facts (don't rediscover these)

- **Sandbox cannot reach**: the owner's live Neon DB, Prisma's hosted DB API, arbitrary external APIs. It CAN reach npm registry, Google Fonts (via `curl`, not via Chromium/Playwright directly — see above), and GitHub (read) via the git proxy.
- **GitHub push**: the GitHub App integration lacks write access to `gedertyd-hash/vselennaja`. Standing workaround: ask the owner for a fresh classic PAT (`repo` scope) each time, push via `git push "https://gedertyd-hash:TOKEN@github.com/..."`, immediately remind her to revoke it at github.com/settings/tokens. This is not a one-off — expect to do it every session that needs a push.
- **Vercel build**: `package.json` `"build"` script is `prisma generate && prisma db push --accept-data-loss && next build`, plus `"postinstall": "prisma generate"` — this makes Vercel's zero-config `npm run build` fully self-sufficient (handles schema migration automatically on every deploy). Don't remove this.
- **Before any destructive git operation**: check `git status` and `git log origin/<branch>..HEAD` / `git log HEAD..origin/<branch>` first. See "Known issues" — this branch has had unplanned parallel-session pushes before.

## Known issues / incidents

- **2026-08 — parallel session collision**: while this session was waiting on a GitHub token from the owner, a different session (also authorized by the owner) independently pushed 2 commits to the same branch (`claude/telegram-learning-platform-7vet0n`): a duplicate "Лучшие скиллы для твоего Claude" guide (same slug, different content/images) and a new guide "Как не сжечь все токены за раз в Claude Code". Resolved via `git merge` + manual conflict resolution: kept the other session's versions of both (owner confirmed both were wanted), dropped this session's duplicate skills-guide content and its now-unreferenced images, kept `CodeBlock.tsx`/`icons.tsx` from the other session (more polished — icon-based copy button). **Lesson**: always `git fetch && git log origin/<branch>..HEAD` before pushing, not just before merging — the rejection ("fetch first") is the actual signal this happened, don't force-push past it.
- Google Fonts `@import` in HTML fails inside Playwright/Chromium in this sandbox (`net::ERR_CONNECTION_RESET`) even though the same URL works via `curl`. Always download the woff2 and inline as base64 in a `<style>` block instead.

## Content inventory (as of commit `b66cf60`)

**Guides** (`type: GUIDE`): `dobro-pozhalovat-v-club`, `nastroit-claude-za-10-minut`, `5-promptov-chas-v-den`, `chto-nelzya-zagruzhat-v-ii`, `chatgpt-vs-claude-chto-vybrat`, `kommercheskoe-predlozhenie-s-ii`, `kak-ponyat-chto-tekst-pisala-neyroset`, `luchshie-skilly-dlya-claude`, `kak-ne-szhech-tokeny-v-claude-code`.

**Courses** (`type: COURSE`):
- `pervaya-nedelya-s-ii` — "Первая неделя с ИИ", 3 modules / 6 lessons, fully written.
- `claude-s-nulya-do-pro` — "Claude с нуля до PRO", 3 modules / 6 lessons, fully written.
- `chatgpt-s-nulya-do-pro` — "ChatGPT с нуля до PRO", 9 modules / 45 lessons. **Module 1 only (7 lessons) has real content.** Modules 2–9 (38 lessons) are scaffolded with correct titles, `kind`, `durationMinutes: 10` but `content: COMING_SOON` (a shared placeholder string — see top of `demo-content.ts`). This is the main open content task — see "Next steps".

**Cases** (`type: CASE`): `kak-agentstvo-uskorilo-otchety`, `salon-krasoty-otvety-klientam`, `yurfirma-proverka-dogovorov`.

**Workshops** (`type: WORKSHOP`): `vorkshop-svой-ai-agent` (placeholder — "запись появится после следующего эфира", no real content yet, not a priority).

## Next steps (in likely order)

1. Write real content for `chatgpt-s-nulya-do-pro` modules 2–9, one module at a time, matching the voice/structure of module 1 (see `demo-content.ts` lines ~904–1163 for the pattern: `## ` headers, `ты`-address, concrete examples, no fluff, ~10 min per lesson). Module 2 ("Промты и проверка") is next up per the owner's last message.
2. Each new module: write content → `npx tsc --noEmit` → `npm run lint` → `npx next build` → visual QA via the static-render + Playwright screenshot technique (see recent commits for the script pattern — render `MarkdownContent`'s output through `react-dom/server` with the compiled Tailwind CSS from `.next/static/chunks/*.css`, screenshot with Chromium) → commit → ask owner for a fresh PAT → push → remind her to revoke the token → tell her to hit "Заполнить демо-материалами" in `/admin`.
3. Not yet started, explicitly deferred by the owner: Telegram bot integration (token/username), payment gateway, channel invite/kick automation.

## Explicitly established constraints (don't relitigate)

- Never leave a real admin account with known/guessable credentials on production.
- Tokens/secrets pasted by the owner in chat: use once, then remind her to revoke immediately. Never store them in git config, files, or commit messages.
- Don't fabricate or predict async/background results — if something hasn't been tested, say so.
