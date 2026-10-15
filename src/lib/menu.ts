import type { MenuCategory, MenuItem } from "@/types";

export const MENU_CATEGORIES: MenuCategory[] = [
  {
    id: "grills",
    name: "Grills & Grilled Fish",
    description: "Char-grilled favourites straight off the fire.",
  },
  {
    id: "rice",
    name: "Rice Dishes",
    description: "Hearty, well-seasoned rice plates.",
  },
  {
    id: "soups",
    name: "Soups & Swallow",
    description: "Local soups served with your choice of swallow.",
  },
  {
    id: "sides",
    name: "Sides & Small Chops",
    description: "Perfect add-ons for any meal.",
  },
  {
    id: "drinks",
    name: "Drinks",
    description: "Chilled and refreshing.",
  },
  {
    id: "desserts",
    name: "Desserts",
    description: "A little something sweet to finish.",
  },
];

/**
 * Starter catalogue built from the business's existing concept site.
 * Prices are whole naira. Confirm and replace with JO'S Grill's official
 * menu before launch.
 */
export const MENU_ITEMS: MenuItem[] = [
  {
    id: "classic-burger",
    name: "JO'S Classic Burger",
    description: "Juicy burger with fresh toppings and our house-style sauce.",
    price: 4500,
    categoryId: "grills",
    image: "/menu/classic-burger.svg",
    available: true,
    tags: ["Popular"],
  },
  {
    id: "grilled-fish",
    name: "Grilled Fish",
    description: "Seasoned grilled fish served with a satisfying side.",
    price: 6500,
    categoryId: "grills",
    image: "/menu/grilled-fish.svg",
    available: true,
    tags: ["Popular"],
  },
  {
    id: "chicken-chips",
    name: "Chicken & Chips",
    description: "Crispy chicken paired with golden chips.",
    price: 5000,
    categoryId: "grills",
    image: "/menu/chicken-chips.svg",
    available: true,
  },
  {
    id: "fish-chips",
    name: "Fish & Chips",
    description: "Crispy fish with golden chips and your choice of side.",
    price: 5500,
    categoryId: "sides",
    image: "/menu/fish-chips.svg",
    available: true,
  },
  {
    id: "jollof-rice",
    name: "Jollof Rice",
    description: "Smoky party-style jollof with a rich tomato base.",
    price: 4000,
    categoryId: "rice",
    image: "/menu/jollof-rice.svg",
    available: true,
    tags: ["Popular"],
  },
  {
    id: "fried-rice",
    name: "Fried Rice",
    description: "Vegetable fried rice with a savoury finish.",
    price: 4000,
    categoryId: "rice",
    image: "/menu/fried-rice.svg",
    available: true,
  },
  {
    id: "native-soup",
    name: "Native Soup",
    description: "Local soup served with your choice of swallow.",
    price: 4500,
    categoryId: "soups",
    image: "/menu/native-soup.svg",
    available: true,
  },
  {
    id: "pepper-soup",
    name: "Pepper Soup",
    description: "Spicy, warming broth with tender meat.",
    price: 4500,
    categoryId: "soups",
    image: "/menu/pepper-soup.svg",
    available: true,
  },
  {
    id: "loaded-sausage-roll",
    name: "Loaded Sausage Roll",
    description: "A quick, filling bite for a lighter craving.",
    price: 2500,
    categoryId: "sides",
    image: "/menu/loaded-sausage-roll.svg",
    available: true,
  },
  {
    id: "chips",
    name: "Golden Chips",
    description: "Crispy, well-salted chips.",
    price: 2000,
    categoryId: "sides",
    image: "/menu/chips.svg",
    available: true,
  },
  {
    id: "soft-drink",
    name: "Chilled Soft Drink",
    description: "Cold drink to complete your meal.",
    price: 1000,
    categoryId: "drinks",
    image: "/menu/soft-drink.svg",
    available: true,
  },
  {
    id: "bottled-water",
    name: "Bottled Water",
    description: "Chilled bottled water.",
    price: 500,
    categoryId: "drinks",
    image: "/menu/bottled-water.svg",
    available: true,
  },
  {
    id: "ice-cream",
    name: "Ice Cream Cup",
    description: "Creamy ice cream cup.",
    price: 2000,
    categoryId: "desserts",
    image: "/menu/ice-cream.svg",
    available: true,
  },
];

export function getMenuItem(id: string): MenuItem | undefined {
  return MENU_ITEMS.find((item) => item.id === id);
}

export function getItemsByCategory(categoryId: string): MenuItem[] {
  return MENU_ITEMS.filter((item) => item.categoryId === categoryId);
}

export function getCategory(id: string): MenuCategory | undefined {
  return MENU_CATEGORIES.find((category) => category.id === id);
}
