<script lang="ts">
import type { TableHeaderCellNode } from "@policystack/core";
import type { Snippet } from "svelte";

let {
	children,
}: {
	node: TableHeaderCellNode;
	children: Snippet;
} = $props();
</script>

<th data-op-table-cell="" scope="col">{@render children()}</th>
