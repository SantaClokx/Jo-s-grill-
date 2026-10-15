export type MenuCategoryId =
  | "grills"
  | "rice"
  | "soups"
  | "sides"
  | "drinks"
  | "desserts";

export interface MenuCategory {
  id: MenuCategoryId;
  name: string;
  description: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number; // Naira, minor-unit-free (whole naira)
  categoryId: MenuCategoryId;
  image: string;
  available: boolean;
  tags?: string[];
}

export interface CartLine {
  itemId: string;
  quantity: number;
}

export interface CartLineView {
  item: MenuItem;
  quantity: number;
  lineTotal: number;
}

export type DeliveryZone = "rivers" | "outside";

export interface DeliveryDetails {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  notes?: string;
}

export interface OrderPricing {
  subtotal: number;
  deliveryFee: number;
  total: number;
  zone: DeliveryZone;
}

export type OrderStatus = "received" | "confirmed" | "preparing" | "delivered" | "cancelled";

export interface Order {
  id: string;
  reference: string;
  createdAt: string;
  status: OrderStatus;
  customer: DeliveryDetails;
  lines: Array<{ itemId: string; name: string; unitPrice: number; quantity: number }>;
  pricing: OrderPricing;
}
