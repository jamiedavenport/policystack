/**
 * Back-compat shim. The two legacy registries (`known-packages.ts` and
 * `consent/vendors.json`) were merged into the one canonical {@link
 * ./registry} (PS-25, decision 13). These two maps are now derived from it;
 * this module stays as a stable import path for existing consumers.
 */
export { KNOWN_COOKIE_PACKAGES, KNOWN_PACKAGES } from "./registry";
