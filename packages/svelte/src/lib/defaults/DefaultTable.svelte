<script lang="ts">
import type { TableNode } from "@policystack/core";
import type { Snippet } from "svelte";

let {
	children,
}: {
	node: TableNode;
	children: Snippet;
} = $props();
</script>

<table data-op-table="">{@render children()}</table>
