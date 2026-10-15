import type { Metadata } from "next";

import { ButtonLink, ExternalButton } from "@/components/ui/button";
import { ClockIcon, MapPinIcon, PhoneIcon, WhatsAppIcon } from "@/components/ui/icons";
import { SectionHeading } from "@/components/ui/states";
import { mapsLink, site, whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact & location",
  description:
    "Contact JO'S Grill in Elelenwo, Port Harcourt — phone, WhatsApp, opening hours and directions.",
};

export default function ContactPage() {
  return (
    <div className="shell py-12 md:py-16">
      <SectionHeading
        eyebrow="Get in touch"
        title="Contact & location"
        description="Call, message us on WhatsApp, or visit us in Elelenwo. We're happy to help with your order."
      />

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-line bg-white p-6 shadow-card sm:p-8">
          <h2 className="text-xl font-black">{site.name}</h2>

          <ul className="mt-6 space-y-5 text-sm">
            <li className="flex gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-cream text-brand">
                <MapPinIcon />
              </span>
              <div>
                <p className="font-bold">Address</p>
                <a
                  href={mapsLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-0.5 block text-muted hover:text-brand"
                >
                  {site.address.line}
                  <br />
                  {site.address.city}, {site.address.state}
                  <br />
                  {site.address.country}
                </a>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-cream text-brand">
                <PhoneIcon />
              </span>
              <div>
                <p className="font-bold">Phone</p>
                <a href={site.phoneHref} className="mt-0.5 block text-lg font-black hover:text-brand">
                  {site.phoneDisplay}
                </a>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-cream text-brand">
                <ClockIcon />
              </span>
              <div>
                <p className="font-bold">Opening hours</p>
                <p className="mt-0.5 text-muted">
                  {site.hoursNote} on {site.phoneDisplay}.
                </p>
              </div>
            </li>
          </ul>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ExternalButton
              href={whatsappLink("Hello JO'S Grill! I have a question about my order.")}
              target="_blank"
              rel="noopener noreferrer"
              variant="whatsapp"
              size="lg"
              className="flex-1"
            >
              <WhatsAppIcon />
              Chat on WhatsApp
            </ExternalButton>
            <ExternalButton href={site.phoneHref} variant="secondary" size="lg" className="flex-1">
              <PhoneIcon width={18} height={18} />
              Call us
            </ExternalButton>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-card">
            <iframe
              title="Map showing JO'S Grill location in Elelenwo, Port Harcourt"
              src={`https://www.google.com/maps?q=${encodeURIComponent(
                `${site.address.line}, ${site.address.city}, ${site.address.state}`,
              )}&output=embed`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-[320px] w-full border-0"
            />
          </div>

          <div className="rounded-3xl border border-line bg-white p-6 shadow-card">
            <h2 className="text-lg font-black">Delivery areas</h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-center justify-between rounded-xl bg-cream px-4 py-3">
                <span className="font-semibold">Within Rivers State</span>
                <span className="font-black">₦1,000</span>
              </li>
              <li className="flex items-center justify-between rounded-xl bg-cream px-4 py-3">
                <span className="font-semibold">Outside Rivers State</span>
                <span className="font-black">₦5,000</span>
              </li>
            </ul>
            <ButtonLink href="/menu" className="mt-5 w-full" size="lg">
              Start your order
            </ButtonLink>
          </div>
        </div>
      </div>
    </div>
  );
}
