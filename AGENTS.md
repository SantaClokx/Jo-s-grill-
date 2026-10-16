<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## JO'S Grill — project notes

Restaurant ordering site for JO'S Grill (Elelenwo, Port Harcourt, Rivers State).
Next.js 16 App Router + React 19 + TypeScript strict + Tailwind v4. No Supabase,
no Firebase, no third-party backend.

### Commands

- `npm run dev` / `npm run build` / `npm run start`
- `npm run check` — lint + typecheck + tests (use this before finishing any task)
- `npm test` — Node's built-in runner, `tests/*.test.ts`

### Conventions

- Business details (address, phone) live only in `src/lib/site.ts`. Opening hours
  are **not known** and are intentionally not shown — see the honesty constraints.
- Menu data lives only in `src/lib/menu.ts` — never hardcode prices in components.
- Delivery fee rules live only in `src/lib/delivery.ts` (Rivers ₦1,000, outside
  ₦5,000). The server recomputes fees; the client display is for transparency only.
- Prices are recomputed server-side in `src/app/api/orders/route.ts` from the
  catalogue, so a tampered client cannot dictate totals.
- React state is synced to external stores via `useSyncExternalStore` (see
  `src/lib/cart-store.ts`, `src/components/copyright-year.tsx`). Do not introduce
  `setState` inside `useEffect` — the ESLint rule `react-hooks/set-state-in-effect`
  is on and static pages depend on this pattern.
- Imports from `src/lib` use explicit `.ts` extensions (`allowImportingTsExtensions`)
  so the Node test runner can import them directly.

### Honesty constraints (do not regress)

- There is **no database**. `POST /api/orders` returns `persisted: false` and does
  not store anything. Never claim orders are saved.
- There is **no payment provider**. Never collect card details.
- Do not add links or buttons that imply unbuilt functionality (this is why the
  generic Instagram/Facebook footer links were removed).
- Menu images in `public/menu/` are generated SVG placeholders, not real photos.
- **Opening hours, email and social accounts were never stated in the source
  material.** Do not add them. The only verified contact channels are the phone
  number and WhatsApp. `site.hoursNote` must not be replaced with a guess.

### Build must not depend on the network

`src/app/layout.tsx` uses `next/font/local` with the files in `public/fonts/`.
Do **not** switch to `next/font/google`: it downloads fonts during `next build`,
and a failed fetch aborts the build. This caused a real deployment failure.
`tests/fonts.test.ts` guards against a regression.

### Admin auth is Clerk, and it must stay fail-closed

Authentication is Clerk (`@clerk/nextjs`), required by the project owner. Do not
add Supabase or Firebase. The database provider for order persistence is a
**separate, still-open decision**.

- Clerk uses `src/proxy.ts`, not `middleware.ts` — Next 16 renamed the file.
- `createRouteMatcher()` is deprecated. Admin protection does not rely on it: the
  `/admin` layout and page both call `requireAdmin()` on the server.
- Admin is deny-by-default. If Clerk keys are absent, admin returns an explicit
  503 and denies access; it must never be treated as "no protection needed". The
  public site keeps working. `tests/auth.test.ts` guards this.
- An admin role is trusted only from server-written `publicMetadata`
  (`sessionClaims.metadata`), never from a client claim.
- The first administrator can also be granted through the server-only
  `ADMIN_EMAILS` allow-list, matched only against the verified session email
  (`sessionClaims.email`). This is a grant on top of `publicMetadata`, not a
  replacement for it.
- Sign-in lives at `/sign-in` (a plain route, not an optional catch-all: the
  catch-all segment triggers Next's "Render in Browser" bailout for the shared
  header). Clerk's `<SignIn />` is mounted client-only via `next/dynamic`.
- See `docs/ADMIN-SECURITY.md` for the full requirements.

### `cacheComponents` and the admin route

The app enables `cacheComponents`, which prerenders a static shell for anything
that does not read request-time data. This has two consequences that are easy to
regress:

- A synchronous admin component returning static JSX gets compiled into the
  route's static shell, embedding privileged markup in the payload served to
  anonymous visitors. An anonymous `GET /admin` must contain **none** of the
  admin page's text. Both `src/app/admin/layout.tsx` and
  `src/app/admin/page.tsx` set `export const instant = false` and each calls
  `requireAdmin()` before constructing privileged markup.
- `export const dynamic` is forbidden. `readAuthContext()` calls `connection()`
  first so the unconfigured path still renders at request time rather than being
  cached.

Do not "simplify" the admin page by removing its self-guard or `instant = false`
— a live build/curl check confirms that doing so leaks admin markup to anonymous
visitors.

### Database (Neon PostgreSQL + Drizzle)

- Order storage is Neon PostgreSQL via Drizzle ORM. It is **not** an auth
  provider — Clerk owns identity. Never add Supabase Auth, Firebase, or a second
  auth system.
- `DATABASE_URL` is server-only. Never prefix it `NEXT_PUBLIC_`, never commit a
  real value. `.env*` is git-ignored except `.env.example`.
- The site must keep working with **no** database. `/api/orders` returns
  `persisted: false` and the admin order API returns 503. Never make a page or a
  build depend on database reachability.
- `persisted: true` may only be returned after a successful commit. Never
  describe an order as "saved" otherwise.
- `clerk_user_id` is written from server-side `auth()` only, never from the
  request body. There is no `users` table; do not mirror Clerk into the database.
- Migrations live in `drizzle/` and are committed. Write them with
  `npm run db:generate`; apply with `npm run db:migrate` (idempotent). Do not
  hand-edit generated SQL unless correcting a generation bug.
- Integration tests in `tests/db/` require `DATABASE_URL` and skip without it, so
  `npm test` stays database-free. Run them with `npm run db:verify`.
- See `docs/DATABASE.md` for the schema, security properties and Clerk↔Neon
  relationship.

### Vercel blocks commits from unaffiliated authors

On the Hobby plan, Vercel refuses to build a commit whose **author** lacks
contributing access to the project, and private repositories cannot add
collaborators. Commits authored by `openhands <openhands@all-hands.dev>` are
therefore blocked. Commits must be authored by the repository owner
(`SantaClokx`). See `docs/DEPLOYMENT.md` § 7.

See `docs/BACKEND-REQUIREMENTS.md` and `docs/DEPLOYMENT.md` for the planned
backend and Vercel setup.
