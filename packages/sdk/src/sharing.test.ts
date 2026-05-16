import { expect, test } from "vite-plus/test";
import { sharing } from "./sharing";

test("returns the exact same reference as value", () => {
	const value = { email: "ada@example.com", amountCents: 500 };
	const result = sharing("Account Information", "Stripe", value);
	expect(result).toBe(value);
});

test("key and recipient are never evaluated at runtime", () => {
	const value = { email: "ada@example.com" };
	const result = sharing("Account Information", "Stripe", value);
	expect(result).toBe(value);
});

test("returns the payload unchanged for primitives", () => {
	expect(sharing("Usage Data", "PostHog", 42)).toBe(42);
	expect(sharing("Usage Data", "PostHog", "raw")).toBe("raw");
});

test("works when value is an empty object", () => {
	const value = {};
	const result = sharing("Empty", "Nobody", value);
	expect(result).toBe(value);
});

test("preserves branded/opaque payload types without degrading inference", () => {
	type Payload = { readonly __brand: "Payload"; email: string };
	const payload = {
		__brand: "Payload",
		email: "ada@example.com",
	} as unknown as Payload;

	// Compile-time check: the generic should infer `Payload` so the return
	// type is `Payload`.
	const result: Payload = sharing("Account Information", "Stripe", payload);
	expect(result).toBe(payload);
});
