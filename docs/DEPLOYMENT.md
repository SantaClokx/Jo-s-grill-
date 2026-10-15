# Deployment — Vercel

The project is a standard Next.js App Router app and needs no special Vercel
configuration. `next.config.ts` already enables Cache Components and Partial
Prefetching.

> **Not yet deployed.** Nothing in this repository has been deployed to Vercel.
> Do not state otherwise until a deployment has actually succeeded and the live
> URL has been tested.

---

## 1. Import the repository

1. In the Vercel dashboard, choose **Add New → Project**.
2. Import the `jos-grill` GitHub repository.
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

**No environment variables are required for the current build.** The site has no
database, no payment provider and no image host, so there is nothing to configure
yet.

When a backend is added (see [`BACKEND-REQUIREMENTS.md`](BACKEND-REQUIREMENTS.md)),
set each variable in **Settings → Environment Variables** and scope it correctly:

- `DATABASE_URL` — server only (order storage)
- `PAYMENT_SECRET_KEY` — server only
- `PAYMENT_WEBHOOK_SECRET` — server only
- `NEXT_PUBLIC_PAYMENT_PUBLIC_KEY` — safe for the browser (public keys only)

Rules that must not be broken:

- Secrets go in **Settings → Environment Variables**, never in the repository.
- `.env`, `.env.local` and friends are git-ignored. Keep it that way.
- Only variables prefixed `NEXT_PUBLIC_` are exposed to the browser. Never put a
  secret behind that prefix.

To pull variables for local work: `vercel env pull .env.local`.

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
- [ ] `POST /api/orders` responds with `persisted: false` (honest until a database
      exists).
- [ ] Layout holds up at 360 px width (mobile) through desktop.
- [ ] No secrets appear in the deployed bundle.

## 6. Deployment-specific notes

- **Static vs dynamic:** the marketing pages are static or partially prerendered;
  `POST /api/orders` runs as a serverless function. No configuration needed.
- **Node runtime:** the order endpoint uses standard Web APIs and runs on the
  default Node runtime.
- **Custom domain:** add it under **Settings → Domains** once DNS is ready.
