import { app, page, route } from "@wasp.sh/spec";
import { MainPage } from "./src/MainPage" with { type: "ref" };
import { CookiePolicyPage } from "./src/pages/CookiePolicyPage" with { type: "ref" };
import { PrivacyPolicyPage } from "./src/pages/PrivacyPolicyPage" with { type: "ref" };
import Root from "./src/Root" with { type: "ref" };

export default app({
  name: "policystackWasp",
  title: "PolicyStack — Wasp Example",
  wasp: { version: "^0.24.0" },
  head: ["<link rel='icon' href='/favicon.ico' />"],
  client: {
    // Wraps every page — this is where the single <PolicyStack> provider
    // (policy context + consent store) is mounted. See src/Root.tsx.
    rootComponent: Root,
  },
  spec: [
    route("RootRoute", "/", page(MainPage)),
    route("PrivacyPolicyRoute", "/privacy-policy", page(PrivacyPolicyPage)),
    route("CookiePolicyRoute", "/cookie-policy", page(CookiePolicyPage)),
  ],
});
