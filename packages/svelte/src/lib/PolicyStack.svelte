<script lang="ts">
import type { PolicyStackConfig } from "@policystack/core";
import type { Snippet } from "svelte";
import { setConfigContext } from "./context.svelte";

let {
	config,
	children,
}: {
	config: PolicyStackConfig;
	children: Snippet;
} = $props();

setConfigContext(() => config);
</script>

{@render children()}
