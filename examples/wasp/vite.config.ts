import { policyStack } from "@policystack/vite";
import { defineConfig } from "vite";
import { wasp } from "wasp/client/vite";

export default defineConfig({
  plugins: [
    wasp(),
    // Optional dev-time safety net: scans src/ on every dev start and HMR
    // update, regenerates src/policystack.gen.ts, and warns on any cookie
    // write or vendor call that isn't consent-gated.
    policyStack({
      srcDir: "./src",
      consent: { mode: "warn" },
      // The demo "analytics" cookie is a raw document.cookie write in
      // MainPage.tsx, which the scanner can't attribute to a category — a
      // real app would use gateScript() with a recognised vendor instead.
      // Suppressing here commits that accepted gap to review.
      suppress: ["cookie-category-declared-not-used"],
    }),
  ],
});
