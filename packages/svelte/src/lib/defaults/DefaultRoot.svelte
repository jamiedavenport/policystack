<script lang="ts">
import type { Document } from "@policystack/core";
import type { Snippet } from "svelte";

let {
	style,
	children,
}: {
	node: Document;
	style?: string;
	children: Snippet;
} = $props();
</script>

<div data-op-policy="" {style}>{@render children()}</div>
