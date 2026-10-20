"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { useCart } from "@/components/cart-provider";
import { ButtonLink } from "@/components/ui/button";
import { CartIcon, CloseIcon, MenuIcon } from "@/components/ui/icons";
import { site } from "@/lib/site";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const pathname = usePathname();
  const { count, isHydrated } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);

  // Close the mobile menu when the route changes. Adjusting state during
  // render is React's documented pattern for reacting to changed props.
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setIsOpen(false);
  }

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream/90 backdrop-blur-md">
      <div className="shell flex h-[68px] items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-black tracking-[-0.04em]">
          <span className="flex size-9 items-center justify-center rounded-xl bg-ink text-sm font-black text-cream">
            J
          </span>
          <span>
            JO&apos;S <span className="text-brand">Grill</span>
          </span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={`rounded-lg px-3 py-2 text-sm font-bold transition-colors ${
                isActive(link.href) ? "text-brand" : "text-ink hover:bg-ink/5"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/cart"
            className="relative flex size-11 items-center justify-center rounded-xl border border-line bg-white text-ink transition-colors hover:border-ink/25"
            aria-label={`Cart${isHydrated && count > 0 ? `, ${count} item${count === 1 ? "" : "s"}` : ", empty"}`}
          >
            <CartIcon />
            {isHydrated && count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[11px] font-black leading-5 text-white">
                {count}
              </span>
            )}
          </Link>

          <Link
            href="/sign-in"
            className="hidden rounded-lg px-3 py-2 text-sm font-bold text-ink transition-colors hover:bg-ink/5 lg:inline-flex"
          >
            Admin sign in
          </Link>

          <ButtonLink href="/menu" className="hidden sm:inline-flex">
            Order now
          </ButtonLink>

          <button
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            className="flex size-11 items-center justify-center rounded-xl border border-line bg-white text-ink md:hidden"
            aria-expanded={isOpen}
            aria-controls="mobile-nav"
            aria-label={isOpen ? "Close menu" : "Open menu"}
          >
            {isOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div id="mobile-nav" className="border-t border-line bg-cream md:hidden">
          <nav aria-label="Mobile" className="shell flex flex-col py-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={`rounded-lg px-3 py-3 text-base font-bold ${
                  isActive(link.href) ? "text-brand" : "text-ink"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link href="/cart" className="rounded-lg px-3 py-3 text-base font-bold text-ink">
              Cart{isHydrated && count > 0 ? ` (${count})` : ""}
            </Link>
            <Link href="/sign-in" className="rounded-lg px-3 py-3 text-base font-bold text-ink">
              Admin sign in
            </Link>
            <ButtonLink href="/menu" className="mt-3" size="lg">
              Order now
            </ButtonLink>
            <a
              href={site.phoneHref}
              className="mt-2 px-3 py-3 text-center text-sm font-bold text-muted"
            >
              Call {site.phoneDisplay}
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
