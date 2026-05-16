import type { SlotNodes } from "@openpolicy/core";
import type { Component } from "vue";

/**
 * The Vue component-override map. One optional component per canonical slot
 * (PS-15 §2.4) — keys and node payloads are the single source of truth in
 * `@openpolicy/core`. Each component receives its `node` as a prop; rendered
 * child nodes are passed through Vue's default slot.
 */
export type PolicyComponents = {
	[K in keyof SlotNodes]?: Component<{ node: SlotNodes[K] }>;
};
