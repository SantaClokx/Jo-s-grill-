/**
 * Generates branded SVG placeholder images for the menu into public/menu.
 *
 * These are intentional stand-ins for real food photography. Replace the
 * generated files with real photos (same file names) before launch, or point
 * `image` in src/lib/menu.ts at hosted photography.
 *
 * Usage: node scripts/generate-menu-placeholders.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "menu");

const GRADIENTS = {
  grills: ["#3a2015", "#ff9f1c"],
  rice: ["#143b39", "#efb64a"],
  soups: ["#2d2520", "#d65a31"],
  sides: ["#1f3a3a", "#f0b429"],
  drinks: ["#12324a", "#4fb0e0"],
  desserts: ["#3a1f2e", "#f78fb3"],
};

const ITEMS = [
  { id: "classic-burger", emoji: "🍔", category: "grills" },
  { id: "grilled-fish", emoji: "🐟", category: "grills" },
  { id: "chicken-chips", emoji: "🍗", category: "grills" },
  { id: "fish-chips", emoji: "🐟", category: "sides" },
  { id: "jollof-rice", emoji: "🍚", category: "rice" },
  { id: "fried-rice", emoji: "🍛", category: "rice" },
  { id: "native-soup", emoji: "🥣", category: "soups" },
  { id: "pepper-soup", emoji: "🍲", category: "soups" },
  { id: "loaded-sausage-roll", emoji: "🌭", category: "sides" },
  { id: "chips", emoji: "🍟", category: "sides" },
  { id: "soft-drink", emoji: "🥤", category: "drinks" },
  { id: "bottled-water", emoji: "💧", category: "drinks" },
  { id: "ice-cream", emoji: "🍨", category: "desserts" },
];

function svg({ emoji, category }) {
  const [from, to] = GRADIENTS[category] ?? GRADIENTS.grills;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" role="img" aria-label="Placeholder food image">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${from}"/>
      <stop offset="1" stop-color="${to}"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#g)"/>
  <circle cx="400" cy="300" r="190" fill="#ffffff" opacity="0.10"/>
  <circle cx="400" cy="300" r="140" fill="#ffffff" opacity="0.10"/>
  <text x="400" y="300" font-size="220" text-anchor="middle" dominant-baseline="central">${emoji}</text>
</svg>
`;
}

await mkdir(outDir, { recursive: true });
await Promise.all(
  ITEMS.map((item) => writeFile(join(outDir, `${item.id}.svg`), svg(item), "utf8")),
);
console.log(`Generated ${ITEMS.length} placeholder images in public/menu`);
