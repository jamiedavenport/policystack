---
title: Quick Start
description: Add policy pages to your React app in minutes
product: openpolicy
---

## Using shadcn (recommended)

Install a ready-to-use policy component from the OpenPolicy shadcn registry. This copies Tailwind-styled components into your project alongside a starter config.

```sh
# Privacy Policy
bunx shadcn@latest add @policystack/privacy-policy

# Cookie Policy
bunx shadcn@latest add @policystack/cookie-policy
```

Each command installs the component, a `policy-components.tsx` base renderer, and an `policystack.ts` starter config. Fill out the config then wrap your app with the `<OpenPolicy>` provider:

```tsx
import { OpenPolicy } from "@policystack/react";
import openpolicy from "@/openpolicy";

export default function RootLayout({ children }) {
	return <OpenPolicy config={openpolicy}>{children}</OpenPolicy>;
}
```

Then render the component on the relevant page:

```tsx
import { PrivacyPolicy } from "@/components/ui/openpolicy/privacy-policy";

export default function PrivacyPolicyPage() {
	return <PrivacyPolicy />;
}
```

## Manual

Install the packages:

```sh
bun add @policystack/react @policystack/sdk
```

Wrap your app with the provider, then render whichever components you need:

```tsx
import { OpenPolicy, PrivacyPolicy, CookiePolicy } from "@policystack/react";
import openpolicy from "@/openpolicy";

export function PrivacyPolicyPage() {
	return (
		<OpenPolicy config={openpolicy}>
			<PrivacyPolicy />
		</OpenPolicy>
	);
}
```

The components render unstyled by default. Pass a `components` prop to supply your own renderers for headings, paragraphs, lists, and links, or add the `style` prop for inline styles.

## React Native / Expo

`PrivacyPolicy` and `CookiePolicy` work in React Native (Expo) when you supply RN equivalents for every slot via the `components` prop. The wrapper element is also overridable via `Root` — without it, the component renders a `<div>` and Metro will throw `View config getter callback for component "div" must be a function`.

```tsx
import { Linking, Pressable, Text, View } from "react-native";
import { PrivacyPolicy, type PolicyComponents } from "@policystack/react";
import openpolicy from "./openpolicy";

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
	return <PrivacyPolicy config={openpolicy} components={components} />;
}
```

The `style` prop accepts any value (typed `unknown`) so you can pass an RN `ViewStyle` straight through to your custom `Root`. Override the `Table*` slots too if your config produces tables.
