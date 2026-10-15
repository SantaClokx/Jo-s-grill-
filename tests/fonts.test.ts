import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const layout = readFileSync(path.join(projectRoot, "src/app/layout.tsx"), "utf8");

/**
 * The production build must not depend on reaching an external font CDN.
 * `next/font/google` downloads font files during `next build`, so an
 * unreachable or slow fonts.googleapis.com fails the build on Vercel even
 * though it succeeds locally. Fonts are therefore self-hosted.
 */
describe("self-hosted fonts", () => {
  it("does not import from next/font/google", () => {
    assert.ok(
      !layout.includes("next/font/google"),
      "layout.tsx must not use next/font/google - it fetches fonts at build time",
    );
  });

  it("uses next/font/local", () => {
    assert.ok(layout.includes("next/font/local"), "layout.tsx should use next/font/local");
  });

  it("ships the referenced font files", () => {
    for (const file of ["inter-latin.woff2", "outfit-latin.woff2"]) {
      const full = path.join(projectRoot, "public/fonts", file);
      assert.ok(existsSync(full), `missing font file: public/fonts/${file}`);
      // wOF2 magic bytes - guards against committing an HTML error page.
      assert.equal(
        readFileSync(full).subarray(0, 4).toString("binary"),
        "wOF2",
        `public/fonts/${file} is not a valid woff2 file`,
      );
    }
  });
});
