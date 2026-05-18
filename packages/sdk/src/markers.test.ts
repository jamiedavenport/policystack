import { expect, test } from "vite-plus/test";
import { collecting, defineCookie, Ignore, sharing, thirdParty } from "./markers";

// --- collecting ---

test("collecting returns the exact same reference as value", () => {
	const value = { name: "Ada", email: "ada@example.com" };
	const result = collecting("Account Information", value, {
		name: "Name",
		email: "Email address",
	});
	expect(result).toBe(value);
});

test("collecting label object is never evaluated at runtime", () => {
	const value = { name: "Ada" };
	const result = collecting("Account Information", value, { name: "Name" });
	expect(result).toBe(value);
});

test("collecting returns value even when label object has non-string values", () => {
	const value = { name: "Ada" };
	const result = collecting("Account Information", value, {
		name: 42 as unknown as string,
	});
	expect(result).toBe(value);
});

test("collecting works when value is an empty object", () => {
	const value = {};
	const result = collecting("Empty", value, {});
	expect(result).toBe(value);
});

test("collecting preserves branded/opaque row types without degrading inference", () => {
	type UserRow = { readonly __brand: "UserRow"; name: string; email: string };
	const row = {
		__brand: "UserRow",
		name: "Ada",
		email: "ada@example.com",
	} as unknown as UserRow;

	// Compile-time check: the generic should infer `UserRow` so the return
	// type is `UserRow`.
	const result: UserRow = collecting("Account Information", row, {
		name: "Name",
		email: "Email address",
		__brand: "Brand",
	});
	expect(result).toBe(row);
});

test("collecting accepts Ignore sentinel for fields excluded from the policy", () => {
	const value = { name: "Ada", hashedPassword: "hunter2" };
	const result = collecting("Account Information", value, {
		name: "Name",
		hashedPassword: Ignore,
	});
	expect(result).toBe(value);
});

test("omitting a key of value from the label record is a type error", () => {
	const value = { name: "Ada", hashedPassword: "hunter2" };
	// @ts-expect-error — every key of `value` must be labelled (or explicitly
	// marked with `Ignore`); omitting `hashedPassword` is no longer allowed.
	const result = collecting("Account Information", value, { name: "Name" });
	expect(result).toBe(value);
});

// --- sharing ---

test("sharing returns the exact same reference as value", () => {
	const value = { email: "ada@example.com", amountCents: 500 };
	const result = sharing("Account Information", "Stripe", value);
	expect(result).toBe(value);
});

test("sharing returns the payload unchanged for primitives", () => {
	expect(sharing("Usage Data", "PostHog", 42)).toBe(42);
	expect(sharing("Usage Data", "PostHog", "raw")).toBe("raw");
});

test("sharing works when value is an empty object", () => {
	const value = {};
	const result = sharing("Empty", "Nobody", value);
	expect(result).toBe(value);
});

test("sharing preserves branded/opaque payload types without degrading inference", () => {
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

// --- thirdParty / defineCookie (no-op markers) ---

test("thirdParty is a no-op that returns undefined", () => {
	expect(thirdParty("Stripe", "Payments", "https://stripe.com/privacy")).toBeUndefined();
});

test("defineCookie is a no-op that returns undefined", () => {
	expect(defineCookie("analytics")).toBeUndefined();
	expect(defineCookie("marketing")).toBeUndefined();
});
