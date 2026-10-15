import { isNigerianState } from "./delivery.ts";
import type { CartLine, DeliveryDetails } from "@/types";

export interface ValidationErrors {
  fullName?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  lines?: string;
}

const NIGERIAN_PHONE = /^(?:\+?234|0)[789]\d{9}$/;

/** Strip spaces, dashes, and parentheses so "+234 803 123 4567" validates. */
export function normalisePhone(phone: string): string {
  return phone.replace(/[\s()-]/g, "");
}

export function isValidNigerianPhone(phone: string): boolean {
  return NIGERIAN_PHONE.test(normalisePhone(phone));
}

export function validateCheckout(
  customer: DeliveryDetails,
  lines: CartLine[],
): ValidationErrors {
  const errors: ValidationErrors = {};

  if (customer.fullName.trim().length < 2) {
    errors.fullName = "Please enter your full name.";
  }

  if (customer.phone.trim() === "") {
    errors.phone = "Please enter your phone number.";
  } else if (!isValidNigerianPhone(customer.phone)) {
    errors.phone = "Enter a valid Nigerian phone number, e.g. 0803 123 4567.";
  }

  if (customer.address.trim().length < 5) {
    errors.address = "Please enter your delivery address.";
  }

  if (customer.city.trim().length < 2) {
    errors.city = "Please enter your city or town.";
  }

  if (customer.state.trim() === "") {
    errors.state = "Please select your state.";
  } else if (!isNigerianState(customer.state)) {
    errors.state = "Please select a valid Nigerian state.";
  }

  if (lines.length === 0) {
    errors.lines = "Your cart is empty. Add an item before checking out.";
  }

  return errors;
}

export function hasErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}
