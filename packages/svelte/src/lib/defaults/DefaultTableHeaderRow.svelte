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

<!-- `<thead>` is a rendering detail owned by the default header-row component,
     not a node/slot of its own — there is exactly one header row per table. -->
<thead data-op-table-header=""><tr data-op-table-row="">{@render children()}</tr></thead>
