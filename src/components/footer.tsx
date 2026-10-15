import Link from "next/link";

import { CopyrightYear } from "@/components/copyright-year";
import { PhoneIcon, MapPinIcon, WhatsAppIcon } from "@/components/ui/icons";
import { mapsLink, site, whatsappLink } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-line bg-white">
      <div className="shell grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href="/" className="flex items-center gap-2 text-lg font-black tracking-[-0.04em]">
            <span className="flex size-9 items-center justify-center rounded-xl bg-ink text-sm font-black text-cream">
              J
            </span>
            <span>
              JO&apos;S <span className="text-brand">Grill</span>
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">{site.tagline}</p>
          <div className="mt-5 flex gap-2">
            <a
              href={whatsappLink("Hello JO'S Grill! I'd like to place an order.")}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Chat with JO'S Grill on WhatsApp"
              className="flex size-10 items-center justify-center rounded-xl border border-line text-ink transition-colors hover:border-ink/25"
            >
              <WhatsAppIcon />
            </a>
            <a
              href={site.phoneHref}
              aria-label="Call JO'S Grill"
              className="flex size-10 items-center justify-center rounded-xl border border-line text-ink transition-colors hover:border-ink/25"
            >
              <PhoneIcon />
            </a>
          </div>
        </div>

        <nav aria-label="Footer">
          <h2 className="text-sm font-black uppercase tracking-wider text-ink">Explore</h2>
          <ul className="mt-4 space-y-3 text-sm text-muted">
            <li>
              <Link href="/menu" className="hover:text-brand">
                Full menu
              </Link>
            </li>
            <li>
              <Link href="/cart" className="hover:text-brand">
                Your cart
              </Link>
            </li>
            <li>
              <Link href="/checkout" className="hover:text-brand">
                Checkout
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-brand">
                Contact &amp; location
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-ink">Contact</h2>
          <ul className="mt-4 space-y-3 text-sm text-muted">
            <li>
              <a
                href={whatsappLink("Hello JO'S Grill! I'd like to place an order.")}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-brand"
              >
                WhatsApp us
              </a>
            </li>
            <li>
              <a href={site.phoneHref} className="hover:text-brand">
                {site.phoneDisplay}
              </a>
            </li>
            <li>{site.hoursNote}</li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-ink">Visit us</h2>
          <ul className="mt-4 space-y-3 text-sm text-muted">
            <li className="flex gap-2">
              <MapPinIcon className="mt-0.5 shrink-0" width={18} height={18} />
              <a href={mapsLink()} target="_blank" rel="noopener noreferrer" className="hover:text-brand">
                {site.address.line}, {site.address.city}, {site.address.state}
              </a>
            </li>
            <li className="flex gap-2">
              <PhoneIcon className="mt-0.5 shrink-0" width={18} height={18} />
              <a href={site.phoneHref} className="hover:text-brand">
                {site.phoneDisplay}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="shell flex flex-col items-center justify-between gap-2 py-6 text-xs text-muted sm:flex-row">
          <p className="text-center sm:text-left">
            © <CopyrightYear /> JO&apos;S Grill. All rights reserved.
          </p>
          <p>Website by SNT Studios</p>
          <p className="text-center sm:text-right">
            Delivery within Rivers State ₦1,000 · Outside Rivers State ₦5,000
          </p>
        </div>
      </div>
    </footer>
  );
}
