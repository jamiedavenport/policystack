// The single PolicyStack config. One `defineConfig()` generates the privacy +
// cookie policy documents AND derives the consent runtime (categories, locked
// vs. gated, re-prompt on policy change) consumed by `<PolicyStack>` in
// src/Root.tsx. The config is framework-neutral — only the provider wiring in
// Root.tsx is Wasp/React-specific.
//
// Scanned data categories and cookies come from ./policystack.gen, which the
// `policyStack()` Vite plugin regenerates by scanning src/. They are merged in
// by passing the module as defineConfig's second argument.
import { timezoneResolver } from "@policystack/core/consent";
import { localStorageAdapter } from "@policystack/core/consent/storage/local-storage";
import { ContractPrerequisite, defineConfig, LegalBases } from "@policystack/sdk";
import * as scanned from "./policystack.gen";

export default defineConfig(
  {
    // Your legal entity — printed verbatim in both policies.
    company: {
      name: "Acme Inc.",
      legalName: "Acme Corporation",
      address: "123 Main St, Springfield, USA",
      url: "https://acme.example",
      contact: { email: "privacy@acme.com", phone: "+1 (800) 555-0199" },
      dpo: { required: false },
    },
    effectiveDate: "2026-07-08",
    // Jurisdictions served, as SDK codes — drives the disclosures rendered.
    jurisdictions: ["eea", "us-ca"],
    data: {
      collected: {
        "Usage Data": ["Pages visited", "Browser type", "IP address"],
      },
      context: {
        "Usage Data": {
          purpose: "To understand product usage and improve the service",
          lawfulBasis: LegalBases.LegitimateInterests,
          retention: "90 days",
          provision: ContractPrerequisite("We cannot deliver or secure the service."),
        },
      },
    },
    // Cookies: the consent runtime is DERIVED from this block. Each enabled
    // `used` key becomes a consent category; its `lawfulBasis` decides locked
    // vs. consent-gated (LegalObligation ⇒ always on; Consent ⇒ opt-in, which
    // is what makes the banner appear).
    cookies: {
      used: { essential: true, analytics: true },
      context: {
        essential: { lawfulBasis: LegalBases.LegalObligation },
        analytics: { lawfulBasis: LegalBases.Consent },
      },
    },
    // Runtime knobs for the consent store: where decisions persist and how the
    // visitor's jurisdiction is resolved before they click anything.
    consent: {
      adapter: localStorageAdapter(),
      jurisdictionResolver: timezoneResolver(),
    },
    automatedDecisionMaking: [],
  },
  scanned,
);
