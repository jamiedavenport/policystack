# `@policystack/vue`

> Vue components for rendering [PolicyStack](https://policystack.dev) documents at runtime.

`@policystack/vue` provides headless Vue components that compile and render policies directly from config.

## Install

```sh
bun add @policystack/vue @policystack/sdk
```

## Usage

```ts
// policystack.ts
import { ContractPrerequisite, defineConfig, LegalBases } from "@policystack/sdk";

export default defineConfig({
	company: {
		name: "Acme Inc.",
		legalName: "Acme Corporation",
		address: "123 Main St, Springfield, USA",
		contact: { email: "privacy@acme.com" },
	},
	effectiveDate: "2026-01-01",
	jurisdictions: ["eu", "us-ca"],
	data: {
		collected: { "Account Information": ["Email", "Name"] },
		context: {
			"Account Information": {
				purpose: "To create and manage user accounts",
				lawfulBasis: LegalBases.Contract,
				retention: "Until account deletion",
				provision: ContractPrerequisite("We cannot create or operate your account."),
			},
		},
	},
	cookies: {
		used: { essential: true, analytics: false, marketing: false },
		context: {
			essential: { lawfulBasis: LegalBases.LegalObligation },
			analytics: { lawfulBasis: LegalBases.Consent },
			marketing: { lawfulBasis: LegalBases.Consent },
		},
	},
	thirdParties: [],
});
```

```ts
// App.ts
import openpolicy from "./openpolicy";
import { PolicyStack, PrivacyPolicy } from "@policystack/vue";

export default {
	components: { PolicyStack, PrivacyPolicy },
	template: `
		<PolicyStack :config="openpolicy">
			<PrivacyPolicy />
		</PolicyStack>
	`,
	data() {
		return { openpolicy };
	},
};
```

## Exports

- `PolicyStack`
- `PrivacyPolicy`
- `CookiePolicy`
- `renderDocument`

## Links

- [GitHub](https://github.com/jamiedavenport/policystack)
- [policystack.dev](https://policystack.dev)
