import type { PolicyStackConfig } from "@policystack/core";
import type { ConsentStore } from "@policystack/core/consent";
import { createContext } from "react";

// The single PolicyStack context. `<PolicyStack>` (the one provider, at
// `@policystack/react/provider`) populates both halves from one
// `PolicyStackConfig`:
//   - `config` is read by the policy components (`@policystack/react/policy`).
//   - `store` is read by the consent hooks (`@policystack/react/consent`); it
//     is `null` for a policy-only config (no cookie categories), which makes
//     the consent hooks throw their "use inside <PolicyStack>" guard.
// This module is intentionally tiny and runtime-dep-free (just `createContext`)
// so importing it from both subpath entries keeps the `./policy ⊥ ./consent`
// tree-shake split intact — the heavy `createConsentStore` lives only in the
// provider entry.
export type PolicyStackContextValue = {
	config: PolicyStackConfig | null;
	store: ConsentStore | null;
};

export const PolicyStackContext = createContext<PolicyStackContextValue>({
	config: null,
	store: null,
});
