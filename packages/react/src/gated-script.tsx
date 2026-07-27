"use client";

import type { ScriptDefinition, ScriptEvent } from "@policystack/core/consent";
import { gateScript } from "@policystack/core/consent";
import { useEffect, useRef } from "react";
import { useConsentStore } from "./use-consent-store";

export type GatedScriptProps = {
	def: ScriptDefinition;
	onEvent?: (event: ScriptEvent) => void;
};

/**
 * Consent-gates one third-party script for as long as it is mounted.
 *
 * This is the React binding for `gateScript` (`@policystack/core/consent`) and
 * the intended way to use the `@policystack/scripts` catalogue: it takes the
 * store from `<PolicyStack>` so callers never have to reach for it. The
 * `<script>` tag is injected only once `def.requires` is satisfied, calls to the
 * globals listed in `def.queue` are captured until then and replayed after,
 * and unmounting disposes the gate.
 *
 * Renders no DOM. The gate lives in an effect, so nothing runs during SSR.
 *
 * ```tsx
 * import { GatedScript } from "@policystack/react/consent";
 * import { ga4 } from "@policystack/scripts/ga4";
 *
 * <GatedScript def={ga4({ measurementId: "G-XXXXXXX" })} />;
 * ```
 *
 * Note the core semantics carry over unchanged: a loaded script is never
 * unloaded. Unmounting after consent disposes the gate but leaves the vendor
 * script running, and revoking consent does not re-gate it.
 */
export function GatedScript({ def, onEvent }: GatedScriptProps) {
	const store = useConsentStore();

	// `def` is nearly always built inline (`def={ga4({ ... })}`), making it a
	// fresh object every render. Re-gating on that identity would dispose the
	// gate mid-flight and drop every call the queue stubs had captured, so the
	// gate follows `def.id` instead — the same identity `gateScript` keys its
	// own duplicate-registration guard on — and reads the current `def` and
	// `onEvent` through refs.
	const defRef = useRef(def);
	const onEventRef = useRef(onEvent);

	// Declared before the gating effect so it runs first on mount, and so a
	// re-gate sees the new values (React runs every cleanup before any effect).
	useEffect(() => {
		defRef.current = def;
		onEventRef.current = onEvent;
	});

	useEffect(() => {
		return gateScript(store, defRef.current, {
			onEvent: (event) => onEventRef.current?.(event),
		});
	}, [store, def.id]);

	return null;
}
