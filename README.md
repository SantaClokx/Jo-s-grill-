# JO'S Grill — Website

Online ordering website for **JO'S Grill**, a restaurant in Elelenwo, Port Harcourt,
Rivers State, Nigeria.

Tagline: _Order Fresh. Eat Happy._

Customers can browse the menu, build a cart, enter delivery details, see a clear
price breakdown with the correct delivery fee, and send the order to the
restaurant on WhatsApp.

---

## Status: what is real and what is not

This project is deliberately honest about its current capabilities. Read this
before going live.

| Capability | Status |
| --- | --- |
| Public website (home, menu, cart, checkout, contact) | Working |
| Menu, categories, prices, availability | Working (in-repo data) |
| Cart with persistence in the browser | Working |
| Delivery fee rules (₦1,000 Rivers / ₦5,000 outside) | Working, enforced on the server |
| Server-side validation and re-pricing | Working |
| **Order storage (database)** | **Not implemented — see below** |
| **Payment collection** | **Not implemented — see below** |
| Admin dashboard | Not built (planned for a later phase) |

### Important: orders are not stored yet

There is **no database**. The order endpoint validates the request, re-prices it
from the server-side catalogue, and returns the confirmed order — but it does
**not** save it anywhere. The API response says so explicitly:

```json
{ "persisted": false, "deliveredToRestaurant": false }
```

The checkout screen tells the customer the same thing and directs them to the
WhatsApp button, which is the live, working order channel today. **Do not
describe orders as "saved" or "recorded" until a database is connected.**

### Important: no payment is collected

No payment provider is integrated. The site does not ask for card details and
must not be changed to do so without a PCI-compliant provider (for example
Paystack or Flutterwave) and the backend work described in
[`docs/BACKEND-REQUIREMENTS.md`](docs/BACKEND-REQUIREMENTS.md).

---

## Tech stack

- **Next.js 16** (App Router, Turbopack) with **React 19**
- **TypeScript** (strict)
- **Tailwind CSS v4** — design tokens defined in `src/app/globals.css`
- **Node's built-in test runner** — no extra test dependency
- No Supabase, no Firebase, no third-party backend services

Deploys cleanly to **Vercel** and lives happily in a normal **GitHub** repository.

---

## Getting started

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

### Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, no emit |
| `npm test` | Unit tests |
| `npm run check` | lint + typecheck + tests |

---

## Project structure

```
src/
  app/
    page.tsx              Homepage
    menu/                 Menu with search + category filter
    cart/                 Cart review
    checkout/             Delivery details, pricing, WhatsApp handoff
    contact/              Contact details, map, delivery areas
    api/orders/route.ts   Order validation + server-side pricing
    error.tsx             Route error boundary
    not-found.tsx         404
  components/             Header, footer, cart, checkout, menu UI, icons, states
  lib/
    menu.ts               Menu catalogue (single source of truth)
    delivery.ts           Delivery fee rules and Nigerian state list
    validation.ts         Checkout validation (client + server)
    cart.ts               Pure cart operations
    cart-store.ts         localStorage-backed external store
    currency.ts           Naira formatting
    site.ts               Business details (address, phone)
  types/                  Shared domain types
tests/                    Unit tests for pricing, delivery, cart, validation, menu
scripts/                  Menu placeholder image generator
```

---

## Business information: verified vs. unknown

Everything shown on the site about JO'S Grill was taken from the original source
material. Nothing was invented. What the source did **not** state is listed below
and must be confirmed by JO'S Grill before launch.

| Detail | Value | Source |
| --- | --- | --- |
| Name | JO'S Grill | Source |
| Tagline | Order Fresh. Eat Happy. | Source |
| Phone / WhatsApp | +234 708 345 0350 | Source |
| Address | R3Q9+VJ5, Old Refinery Road, Umurolu, Elelenwo, Rivers State | Source |
| Delivery fee — Rivers | ₦1,000 | Requirements |
| Delivery fee — outside Rivers | ₦5,000 | Requirements |
| Menu items and prices (6 core) | See `src/lib/menu.ts` | Source |
| **Opening hours** | **Not stated in the source — not displayed** | Missing |
| **Email address** | **Not stated in the source — not displayed** | Missing |
| **Social media accounts** | **Not stated in the source — not displayed** | Missing |
| **Real food photography** | **Not supplied — SVG placeholders used** | Missing |

The site says "Opening hours confirmed on WhatsApp" rather than showing a
schedule, because a wrong schedule sends customers away for nothing. Replace
`hoursNote` in `src/lib/site.ts` with a real list once the hours are confirmed.

Additional menu items beyond the six core ones were added to fill out the
categories. Their prices are reasonable starting points, not confirmed prices.
Review them with JO'S Grill before launch.

---

## Delivery fee rules

The single source of truth is `src/lib/delivery.ts`.

- **Within Rivers State: ₦1,000**
- **Outside Rivers State: ₦5,000**

The fee is calculated **on the server** in the order endpoint from the
customer's state. The client shows the same number for transparency, but a
tampered client cannot change what the server charges.

---

## Menu data and images

Menu items live in `src/lib/menu.ts`. Each item has a name, description, price,
category, availability flag and image path.

Images in `public/menu/` are **generated SVG placeholders**, not photographs of
the real food. Replace them with real photography before launch:

1. Put the real images in `public/menu/` (keep the same filenames, or update the
   `image` field in `src/lib/menu.ts`).
2. Recommended: JPG or WebP, roughly 1200×900, optimised.
3. `next/image` handles resizing and lazy loading automatically.

To regenerate the placeholders: `npm run generate:menu`.

---

## Accessibility

- Semantic landmarks, labelled form fields, and `aria-invalid` / `aria-describedby`
  on invalid inputs.
- Visible focus ring defined globally in `globals.css`.
- `prefers-reduced-motion` respected.
- Loading, empty, success and error states are all present and announced.

---

## Deployment

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for Vercel settings and
environment variables, and
[`docs/BACKEND-REQUIREMENTS.md`](docs/BACKEND-REQUIREMENTS.md) for what a real
order backend needs.

---

## License

Private project. All rights reserved.
