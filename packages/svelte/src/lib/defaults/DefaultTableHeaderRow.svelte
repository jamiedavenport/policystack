<script lang="ts">
import type { TableHeaderRowNode } from "@openpolicy/core";
import type { Snippet } from "svelte";

let {
	children,
}: {
	node: TableHeaderRowNode;
	children: Snippet;
} = $props();
</script>

<tr data-op-table-row="">{@render children()}</tr>
