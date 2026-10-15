const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous 0/O/1/I

/**
 * Human-readable order reference, e.g. "JG-8F3K2Q".
 * Uses the Web Crypto API when available so references are unpredictable.
 */
export function createOrderReference(): string {
  const bytes = new Uint8Array(6);
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  const suffix = Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join("");
  return `JG-${suffix}`;
}

export function createOrderId(reference: string): string {
  const stamp = Date.now().toString(36);
  return `${reference.toLowerCase()}-${stamp}`;
}
