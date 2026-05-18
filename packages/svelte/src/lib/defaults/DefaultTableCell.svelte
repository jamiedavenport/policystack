<script lang="ts">
import type { TableCellNode } from "@policystack/core";
import type { Snippet } from "svelte";

let {
	children,
}: {
	node: TableCellNode;
	children: Snippet;
} = $props();
</script>

<td data-op-table-cell="">{@render children()}</td>
