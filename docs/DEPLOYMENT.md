# Deployment — Vercel

The project is a standard Next.js App Router app and needs no special Vercel
configuration. `next.config.ts` already enables Cache Components and Partial
Prefetching.

> **Not yet deployed.** Nothing in this repository has been deployed to Vercel.
> Do not state otherwise until a deployment has actually succeeded and the live
> URL has been tested.

> **Current blocker.** Vercel refuses to build commits whose author lacks
> contributing access to the project. See
> [Blocked deployments](#7-blocked-deployments-commit-author) below.

---

## 1. Import the repository

The GitHub repository is `SantaClokx/Jo-s-grill-` (private). Note the name:
GitHub strips apostrophes, so `jo's-grill` becomes `Jo-s-grill-`.

1. In the Vercel dashboard, choose **Add New → Project**.
2. Import the `SantaClokx/Jo-s-grill-` GitHub repository.
3. Vercel detects Next.js automatically. Keep the defaults.

## 2. Build settings

Vercel fills these in from the framework preset. Confirm they match:

| Setting | Value |
| --- | --- |
| Framework preset | Next.js |
| Install command | `npm install` |
| Build command | `npm run build` |
| Output directory | `.next` (default — do not override) |
| Node.js version | 20.x or newer |

No `vercel.json` is required. Do not add one unless a specific redirect or header
rule is needed.

## 3. Environment variables

Authentication (Clerk) and order storage (Neon PostgreSQL) both read from the
environment. Set these in **Settings → Environment Variables**:

| Variable | Scope | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | browser-safe (public by design) | Clerk admin auth. |
| `CLERK_SECRET_KEY` | server only | Clerk. Never `NEXT_PUBLIC_`. |
| `DATABASE_URL` | server only | Neon **pooled** connection string. Never `NEXT_PUBLIC_`. |
| `ADMIN_EMAILS` | server only | Optional. Comma-separated allow-list of administrator emails. Never `NEXT_PUBLIC_`. |

The first administrator: set a role in the account's Clerk `publicMetadata`
(`{"role":"admin"}`) from the Clerk Dashboard, **or** add the account's verified
email to `ADMIN_EMAILS`. The metadata role is the primary mechanism; the
allow-list exists so the owner can grant themselves access without writing
metadata by hand, and is revoked by removing the address. An `ADMIN_EMAILS`
entry is only ever matched against the server-verified session email, so a
forged address in a request has no effect.

Without Clerk keys, the public site works and the admin area is denied (503).
Without `DATABASE_URL`, the site works and orders are not stored
(`persisted: false`). Both degrade safely; neither takes the site down.

Rules that must not be broken:

- Secrets go in **Settings → Environment Variables**, never in the repository.
- `.env`, `.env.local` and friends are git-ignored. Keep it that way.
- Only variables prefixed `NEXT_PUBLIC_` are exposed to the browser. Never put a
  secret behind that prefix.

To pull variables for local work: `vercel env pull .env.local`.

### Applying migrations

Migrations are committed in `drizzle/`. Apply them once per environment:

```bash
DATABASE_URL="postgresql://…" npm run db:migrate
```

This is **idempotent** — safe to rerun, and safe to wire into a deploy step. It
exits non-zero on failure so a pipeline stops rather than serving against an
unmigrated schema. It logs neither the connection string nor any data.

You may run it from your machine against the Neon database, or add it to the
build command. It is not run automatically by `next build`, so that a build never
depends on database reachability.

## 4. Deployment protection

Preview deployments may require Vercel authentication. To let automated checks or
agents load a preview URL, either:

- Generate a **Protection Bypass for Automation** secret under
  **Settings → Deployment Protection**, then use the
  `x-vercel-protection-bypass` header or `?x-vercel-protection-bypass=<secret>`
  query parameter, or
- Set **Vercel Authentication** to *Only Production Deployments*.

## 5. Post-deployment verification

After the first successful deployment, check on the live URL:

- [ ] `/` `/menu` `/cart` `/checkout` `/contact` all return 200.
- [ ] An unknown path returns the custom 404.
- [ ] The menu renders with images, prices in Naira, and category filters.
- [ ] Adding items updates the cart badge.
- [ ] Checkout with a Rivers State address shows a ₦1,000 delivery fee.
- [ ] Checkout with a non-Rivers address shows a ₦5,000 delivery fee.
- [ ] `POST /api/orders` responds with `persisted: true` once `DATABASE_URL` is
      set (and `persisted: false`, honestly, when it is not).
- [ ] An order row appears in the database after checkout, with its lines.
- [ ] Layout holds up at 360 px width (mobile) through desktop.
- [ ] No secrets appear in the deployed bundle.

## 6. Deployment-specific notes

- **Static vs dynamic:** the marketing pages are static or partially prerendered;
  `POST /api/orders` runs as a serverless function. No configuration needed.
- **Node runtime:** the order endpoint uses standard Web APIs and runs on the
  default Node runtime.
- **Fonts are self-hosted.** `src/app/layout.tsx` uses `next/font/local` with the
  files in `public/fonts/`. Do not switch back to `next/font/google`: it
  downloads fonts during `next build`, and a failed fetch aborts the build. That
  is what caused an earlier deployment failure.
  `tests/fonts.test.ts` guards against a regression.
- **Custom domain:** add it under **Settings → Domains** once DNS is ready.

## 7. Blocked deployments (commit author)

Vercel refuses to build a commit whose **author** does not have contributing
access to the project. The error reads:

> The deployment was blocked because the commit author did not have contributing
> access to the project on Vercel. The Hobby Plan does not support collaboration
> for private repositories.

The Hobby plan cannot add collaborators to a **private** repository, so this
cannot be fixed by inviting the author. There are three ways forward:

### Option A — make the repository public (free)

Hobby-plan collaboration restrictions apply to private repositories. A public
repository has no such restriction, so the existing commits build as-is. This
exposes the source code, which is acceptable for a brochure site with no secrets,
but it is the owner's call.

### Option B — let only the owner's account author the commits (free)

If commits are authored by the account that owns the Vercel project
(`SantaClokx`), the block does not apply. Configure Git before committing:

```bash
git config user.name  "SantaClokx"
git config user.email "santus4jah@gmail.com"
```

Then amend or recommit. Because the author is part of the commit hash, amending
rewrites history and requires a force-push:

```bash
git rebase --root --exec 'git commit --amend --no-edit --reset-author'
git push --force-with-lease origin main
```

> The email must match a verified address on the GitHub account, otherwise GitHub
> will not attribute the commit to the owner and Vercel will still block it.

### Option C — upgrade to Vercel Pro (paid)

Pro supports collaboration on private repositories, so the author can be added as
a team member and the commits build unchanged.

### Chosen approach

**Option A — the repository is public.** This was chosen by the owner after being
told that a public repository exposes all source code, and that visibility cannot
be restored once the code has been forked or mirrored.

Before the change was made, the full git history was scanned for credentials.
The scan found no real secrets: the only match was the commented-out placeholder
`# DATABASE_URL="postgres://user:password@host:5432/jos_grill"` in
`.env.example`, which is an example string, not a credential.

> **The integration used to push code cannot change repository visibility.**
> `PATCH /repos/{owner}/{repo}` with `{"private": false}` returns
> `403 Resource not accessible by integration`, even though the token reports
> `admin: true` on the repository. Changing visibility requires the repository
> owner to act in the GitHub UI:
> **Settings → General → Danger Zone → Change repository visibility → Public**.

Because the repository is public, the admin dashboard's security must not depend
on source secrecy. See [`ADMIN-SECURITY.md`](ADMIN-SECURITY.md).

### Rejected alternatives

- **Option B — owner authors the commits.** Keeps the repository private, but
  fixes only existing commits; every subsequent agent-authored commit is blocked
  again, so the project cannot progress.
- **Option C — Vercel Pro.** Also keeps the repository private and allows
  agent-authored commits to deploy, at a recurring cost.

