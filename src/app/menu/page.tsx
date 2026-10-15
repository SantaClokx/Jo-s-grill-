import type { Metadata } from "next";

import { MenuCatalogue } from "@/components/menu-catalogue";
import { SectionHeading } from "@/components/ui/states";

export const metadata: Metadata = {
  title: "Menu",
  description:
    "Browse the JO'S Grill menu — grills, rice dishes, soups, sides, drinks and desserts with prices in Naira.",
};

export default async function MenuPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;

  return (
    <div className="shell py-12 md:py-16">
      <SectionHeading
        eyebrow="Our menu"
        title="Pick your craving"
        description="Every dish is prepared to order. Prices are shown in Nigerian Naira. Add what you like to your cart and check out when you're ready."
      />
      <div className="mt-10">
        <MenuCatalogue initialCategory={category} />
      </div>
    </div>
  );
}
