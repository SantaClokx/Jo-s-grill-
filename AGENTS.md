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

See `docs/BACKEND-REQUIREMENTS.md` and `docs/DEPLOYMENT.md` for the planned
backend and Vercel setup.
