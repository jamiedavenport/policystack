---
title: Generate a privacy policy in React or export Markdown
description: Generate a privacy policy with PolicyStack V1. Render React components or export privacy and cookie policies as Markdown, HTML, and PDF.
sidebar:
  label: Generate a policy
---

> **PolicyStack V1** — current documentation. [Supported capabilities and limitations](/docs/reference/support).

PolicyStack V1 renders privacy and cookie policies using your application's components, or exports Markdown, HTML, and PDF at build time. Start with the [complete shared configuration](/docs/quickstart#define-a-shared-configuration).

## Render a privacy policy in React

```sh
pnpm add @policystack/sdk@1 @policystack/core@1 @policystack/react@1
```

```tsx
import { PrivacyPolicy, CookiePolicy } from "@policystack/react/policy";
import policy from "./policystack";

export default function Policies() {
	return (
		<>
			<PrivacyPolicy config={policy} />
			<CookiePolicy config={policy} />
		</>
	);
}
```

The imported config is the `policystack.ts` from the quickstart. Components are unstyled; customise the `components` prop or your stylesheet. V1 does not require a shadcn registry or supply a finished consent banner.

## Export Markdown, HTML, or PDF

```sh
pnpm add @policystack/renderers@1
```

```ts
import { writeFile } from "node:fs/promises";
import { compilePolicy } from "@policystack/renderers";
import policy from "./policystack";

const files = await compilePolicy(policy, "privacy", {
	formats: ["markdown", "html", "pdf"],
});
for (const file of files) await writeFile(file.filename, file.content);
```

Run this in a TypeScript-capable build environment. It writes one file for each requested format. Review the generated documents before publication. [Emission rules and limitations](/docs/reference/support#which-documents-and-output-formats-are-supported).

## React Native / Expo

`PrivacyPolicy` and `CookiePolicy` work in React Native (Expo) when you supply RN equivalents for every slot via the `components` prop. The wrapper element is also overridable via `Root` — without it, the component renders a `<div>` and Metro will throw `View config getter callback for component "div" must be a function`.

```tsx
import { Linking, Pressable, Text, View } from "react-native";
import { PrivacyPolicy, type PolicyComponents } from "@policystack/react/policy";
import policy from "./policy";

const components: PolicyComponents = {
	Root: ({ children }) => <View>{children}</View>,
	Section: ({ children }) => <View>{children}</View>,
	Heading: ({ node }) => (
		<Text style={{ fontSize: 24 - (node.level ?? 2) * 2, fontWeight: "600" }}>{node.value}</Text>
	),
	Paragraph: ({ children }) => <Text>{children}</Text>,
	List: ({ children }) => <View>{children}</View>,
	ListItem: ({ children }) => (
		<Text>
			{"\u2022 "}
			{children}
		</Text>
	),
	Text: ({ node }) => <>{node.value}</>,
	Bold: ({ node }) => <Text style={{ fontWeight: "bold" }}>{node.value}</Text>,
	Italic: ({ node }) => <Text style={{ fontStyle: "italic" }}>{node.value}</Text>,
	Link: ({ node }) => (
		<Pressable onPress={() => Linking.openURL(node.href)}>
			<Text style={{ textDecorationLine: "underline" }}>{node.value}</Text>
		</Pressable>
	),
};

export function PrivacyScreen() {
	return <PrivacyPolicy config={policy} components={components} />;
}
```

The `style` prop accepts any value (typed `unknown`) so you can pass an RN `ViewStyle` straight through to your custom `Root`. Override the `Table*` slots too if your config produces tables.
