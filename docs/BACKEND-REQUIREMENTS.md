# Backend requirements

This document explains what backend capability the site needs, why, and what has
to be decided **before** any provider is chosen. It intentionally names no
credentials and no specific vendor commitment.

Today the project runs with **no backend services**. Everything the customer sees
is real and correct, and the order is handed to the restaurant over WhatsApp. The
gaps below are what stand between the current state and taking real orders
end-to-end.

---

## 1. Order storage (database) — required

**What is missing.** There is no persistence layer. `POST /api/orders` validates
and prices an order, then returns it without saving. `persisted: false` in the
response is the machine-readable truth of this.

**Why it matters.** Without storage there is no order history, no kitchen queue,
no status tracking, and no data for the future admin dashboard. Orders live only
in the customer's browser until they send the WhatsApp message.

**What is needed before choosing a provider.** Decide:

- **Where the data lives.** A managed Postgres (Neon, Supabase Postgres, Railway,
  Vercel Postgres) or a hosted NoSQL store. Serverless-friendly with connection
  pooling is strongly preferred because Vercel functions are short-lived.
- **Schema.** Minimum tables/collections:
  - `orders` — id, reference, created_at, status, subtotal, delivery_fee, total,
    state, is_within_rivers
  - `order_items` — order_id, item_id, name, unit_price, quantity
  - `customers` (optional, can be denormalised onto `orders`) — name, phone,
    city, address, notes
- **Retention and privacy.** Customer name, phone and address are personal data.
  Decide how long they are kept and who can read them.
- **Access.** The public site must only ever *insert* orders. Reads belong to the
  admin dashboard, behind authentication.

**Once a database exists:** set `persisted: true` in the API response only when
the write has actually succeeded, and update the checkout success copy
accordingly. The current copy must stay until then.

---

## 2. Order notification — recommended

The WhatsApp handoff is the live channel today and works with zero infrastructure.
If you later want the kitchen notified automatically (rather than the customer
sending the message), options include:

- A transactional email or SMS provider (server-side API call), or
- The WhatsApp Business API, or
- A push to a kitchen display app.

This is optional and does not block launch.

---

## 3. Payments — not required to launch, required to prepay online

The site collects **no payment data today** and must not start to without a
PCI-compliant provider.

**Before integrating a payment provider, decide:**

- **Provider.** For Nigeria: Paystack or Flutterwave are the common choices. Both
  are PCI-DSS compliant and support cards, bank transfer and USSD.
- **Model.** Pay-on-delivery (cash/transfer on arrival — no provider needed) or
  pay-online (provider needed). Pay-on-delivery is a valid, simpler launch.
- **Server flow.** The server must create the payment intent from the
  **server-computed total**, never a client-supplied amount, and must verify the
  webhook signature before marking an order paid.
- **Secrets.** Provider secret keys and webhook signing secrets go in environment
  variables. Public keys only may reach the browser. **Never commit either.**

---

## 4. Image storage — optional

Menu images currently ship as static files in `public/menu/`. This is fine and
costs nothing. A separate image host (Vercel Blob, Cloudinary, S3) is only needed
if non-developers will upload and change photos frequently. If that becomes a
requirement, prefer a host with on-the-fly resizing so `next/image` can point at
it directly.

---

## 5. Security checklist before taking real orders

- [ ] Database write path is server-side only; the client cannot write directly.
- [ ] Prices and delivery fees are always recomputed on the server (already true).
- [ ] Secrets are in environment variables, never in the repo or Git history.
- [ ] Input is validated and length-capped on the server (already true).
- [ ] A basic rate limit exists on `POST /api/orders` to deter spam.
- [ ] Personal data (name, phone, address) has a defined retention policy.
- [ ] Admin reads are behind authentication.

---

## Environment variables

Copy `.env.example` to `.env.local` for local development. Vercel variables are
set in the dashboard (see [`DEPLOYMENT.md`](DEPLOYMENT.md)).

**None are required today.** The variables below are placeholders for the
integrations above and must be filled in only when the corresponding feature is
actually built.
