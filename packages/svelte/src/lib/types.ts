import type { ContainerSlotName, SlotNodes } from "@openpolicy/core";
import type { Snippet } from "svelte";

// Per-slot snippet argument, derived from the canonical core contract: every
// slot receives its `node`; container slots additionally receive a `children`
// snippet for the rendered child nodes.
type SlotArg<K extends keyof SlotNodes> = { node: SlotNodes[K] } & (K extends ContainerSlotName
	? { children: Snippet }
	: unknown);

/**
 * The Svelte snippet-override map. One optional snippet per canonical slot
 * (PS-15 §2.4) — keys and node payloads are the single source of truth in
 * `@openpolicy/core`; this type only adapts them to Svelte `Snippet`s.
 */
export type PolicyComponents = {
	[K in keyof SlotNodes]?: Snippet<[SlotArg<K>]>;
};
