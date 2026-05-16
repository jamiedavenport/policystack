import type { ContainerSlotName, SlotNodes } from "@openpolicy/core";
import type { ComponentType, ReactNode } from "react";

// Per-slot React props, derived from the canonical core contract: every slot
// receives its `node`; container slots also receive rendered `children`; the
// `Root` wrapper additionally accepts a host `style`.
type SlotProps<K extends keyof SlotNodes> = { node: SlotNodes[K] } & (K extends ContainerSlotName
	? { children: ReactNode }
	: unknown) &
	(K extends "Root" ? { style?: unknown } : unknown);

/**
 * The React component-override map. One optional component per canonical slot
 * (PS-15 §2.4) — keys and node payloads are the single source of truth in
 * `@openpolicy/core`; this type only adapts them to React's `ComponentType`.
 */
export type PolicyComponents = {
	[K in keyof SlotNodes]?: ComponentType<SlotProps<K>>;
};
