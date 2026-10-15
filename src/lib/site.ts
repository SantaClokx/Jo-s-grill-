export const site = {
  name: "JO'S Grill",
  tagline: "Order Fresh. Eat Happy.",
  description:
    "Localized fast food, burgers, fish & chips and more in Elelenwo, Port Harcourt. Browse the menu, build your order and check out online.",
  address: {
    line: "R3Q9+VJ5, Old Refinery Road, Umurolu, Elelenwo",
    city: "Port Harcourt",
    state: "Rivers State",
    country: "Nigeria",
  },
  /** E.164 without the leading "+", required by the wa.me deep link format. */
  whatsapp: "2347083450350",
  phoneDisplay: "+234 708 345 0350",
  phoneHref: "tel:+2347083450350",
  /**
   * The source material did not state opening hours. Do not invent them — a
   * wrong schedule makes customers travel for nothing. Replace this note with a
   * real `hours` list once JO'S Grill confirms their schedule.
   */
  hoursNote: "Opening hours confirmed on WhatsApp",
} as const;

/** Build a WhatsApp deep link with a pre-filled message. */
export function whatsappLink(message: string): string {
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;
}

export function mapsLink(): string {
  const query = encodeURIComponent(
    `${site.address.line}, ${site.address.city}, ${site.address.state}`,
  );
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}
