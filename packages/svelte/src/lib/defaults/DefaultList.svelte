<script lang="ts">
import type { ListNode } from "@policystack/core";
import type { Snippet } from "svelte";

let {
	node,
	children,
}: {
	node: ListNode;
	children: Snippet;
} = $props();
</script>

<svelte:element this={node.ordered ? "ol" : "ul"} data-op-list="">
	{@render children()}
</svelte:element>
