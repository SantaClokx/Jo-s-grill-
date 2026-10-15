import Image from "next/image";
import Link from "next/link";

import { ButtonLink, ExternalButton } from "@/components/ui/button";
import {
  ArrowRightIcon,
  ClockIcon,
  MapPinIcon,
  PhoneIcon,
  StarIcon,
  UtensilsIcon,
  WhatsAppIcon,
} from "@/components/ui/icons";
import { SectionHeading } from "@/components/ui/states";
import { formatNaira } from "@/lib/currency";
import { MENU_CATEGORIES, MENU_ITEMS } from "@/lib/menu";
import { mapsLink, site, whatsappLink } from "@/lib/site";

const POPULAR = MENU_ITEMS.filter((item) => item.tags?.includes("Popular")).slice(0, 3);

const STEPS = [
  {
    title: "Browse the menu",
    body: "Explore grills, rice dishes, soups, sides and drinks with clear prices in Naira.",
  },
  {
    title: "Build your order",
    body: "Add dishes to your cart and adjust quantities. Your total updates as you go.",
  },
  {
    title: "Checkout & confirm",
    body: "Enter your name, phone and delivery address. We calculate your delivery fee automatically.",
  },
];

const FEATURES = [
  {
    title: "Freshly grilled",
    body: "Made to order with real, local ingredients — not reheated fast food.",
  },
  {
    title: "Transparent pricing",
    body: "Every price and the delivery fee are shown before you confirm, in Naira.",
  },
  {
    title: "Fast delivery",
    body: "₦1,000 within Rivers State and ₦5,000 outside Rivers State.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_88%_18%,#ffd18a_0,transparent_30%),linear-gradient(135deg,#fff8ed_0%,#ffe9c8_100%)]">
        <div className="shell grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-2 text-xs font-bold">
              <MapPinIcon width={14} height={14} className="text-brand" />
              Elelenwo, Port Harcourt
            </span>

            <h1 className="mt-6 text-balance text-4xl font-black leading-[0.98] tracking-[-0.05em] sm:text-5xl md:text-6xl">
              Good food.
              <br />
              <span className="text-brand">Zero hassle.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg">
              Localized fast food made for real cravings — from loaded burgers and crispy fish
              &amp; chips to quick bites and cold drinks. Pick your food, add your details and
              check out in minutes.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/menu" size="lg">
                Browse the menu
                <ArrowRightIcon width={18} height={18} />
              </ButtonLink>
              <ExternalButton href={site.phoneHref} variant="secondary" size="lg">
                <PhoneIcon width={18} height={18} />
                Call JO&apos;S Grill
              </ExternalButton>
            </div>

            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4">
              <Stat value="13" label="Menu items" />
              <Stat value="₦1,000" label="Rivers delivery" />
              <Stat value="₦5,000" label="Nationwide delivery" />
            </dl>
          </div>

          <div className="relative">
            <div className="relative overflow-hidden rounded-[2rem] bg-ink shadow-lift">
              <div className="relative aspect-[4/5]">
                <Image
                  src="/menu/grilled-fish.svg"
                  alt="A JO'S Grill signature grilled dish"
                  fill
                  priority
                  sizes="(max-width: 768px) 92vw, 45vw"
                  className="object-cover opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
              </div>
              <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                <p className="text-2xl font-black tracking-[-0.03em]">Fresh. Fast. Local.</p>
                <p className="mt-1 flex items-center gap-2 text-sm text-white/80">
                  <MapPinIcon width={16} height={16} />
                  {site.address.line}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular */}
      <section className="shell py-16 md:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            eyebrow="Crowd favourites"
            title="Popular right now"
            description="The dishes our customers keep coming back for."
          />
          <Link
            href="/menu"
            className="inline-flex items-center gap-1 text-sm font-bold text-brand hover:underline"
          >
            View full menu
            <ArrowRightIcon width={16} height={16} />
          </Link>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {POPULAR.map((item) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-3xl border border-line bg-white shadow-card"
            >
              <div className="relative aspect-[4/3] bg-cream-deep">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black">{item.name}</h3>
                  <StarIcon width={14} height={14} className="text-orange" />
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-black">{formatNaira(item.price)}</span>
                  <Link href="/menu" className="text-sm font-bold text-brand hover:underline">
                    Add to order
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="border-y border-line bg-white py-16 md:py-20">
        <div className="shell">
          <SectionHeading
            eyebrow="What we serve"
            title="Find your craving"
            description="Six categories, from smoky grills to something sweet."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MENU_CATEGORIES.map((category) => (
              <Link
                key={category.id}
                href={`/menu?category=${category.id}`}
                className="group flex items-start gap-4 rounded-2xl border border-line bg-cream p-5 transition-colors hover:border-brand/40 hover:bg-cream-deep"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-ink text-cream">
                  <UtensilsIcon />
                </span>
                <span>
                  <span className="block font-black">{category.name}</span>
                  <span className="mt-1 block text-sm text-muted">{category.description}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="shell py-16 md:py-20">
        <SectionHeading
          eyebrow="Simple ordering"
          title="Three steps to your meal"
          align="center"
        />
        <ol className="mt-10 grid gap-5 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="rounded-3xl border border-line bg-white p-6 shadow-card"
            >
              <span className="text-sm font-black text-brand">0{index + 1}</span>
              <h3 className="mt-3 text-lg font-black">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-10 flex justify-center">
          <ButtonLink href="/menu" variant="dark" size="lg">
            Start your order
            <ArrowRightIcon width={18} height={18} />
          </ButtonLink>
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-line bg-white py-16 md:py-20">
        <div className="shell grid gap-5 md:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="rounded-3xl border border-line bg-cream p-6">
              <h3 className="text-lg font-black">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="shell py-16 md:py-20">
        <div className="grid gap-8 rounded-[2rem] bg-ink p-8 text-white sm:p-10 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-3xl font-black tracking-[-0.03em]">Visit or call us</h2>
            <ul className="mt-6 space-y-4 text-sm text-white/85">
              <li className="flex gap-3">
                <MapPinIcon className="mt-0.5 shrink-0" />
                <a
                  href={mapsLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  {site.address.line}, {site.address.city}, {site.address.state}
                </a>
              </li>
              <li className="flex gap-3">
                <PhoneIcon className="mt-0.5 shrink-0" />
                <a href={site.phoneHref} className="hover:text-white">
                  {site.phoneDisplay}
                </a>
              </li>
              <li className="flex gap-3">
                <ClockIcon className="mt-0.5 shrink-0" />
                <span>{site.hoursNote}</span>
              </li>
            </ul>
          </div>
          <div className="flex flex-col gap-3">
            <ExternalButton
              href={whatsappLink("Hello JO'S Grill! I'd like to place an order.")}
              target="_blank"
              rel="noopener noreferrer"
              variant="whatsapp"
              size="lg"
            >
              <WhatsAppIcon />
              Chat on WhatsApp
            </ExternalButton>
            <ButtonLink href="/contact" variant="secondary" size="lg">
              Contact &amp; location
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white/70 px-4 py-3">
      <dt className="text-lg font-black">{value}</dt>
      <dd className="text-xs font-semibold text-muted">{label}</dd>
    </div>
  );
}
