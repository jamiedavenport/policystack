<script lang="ts">
import type { ListItemNode } from "@openpolicy/core";
import type { Snippet } from "svelte";

let {
	children,
}: {
	node: ListItemNode;
	children: Snippet;
} = $props();
</script>

<li data-op-list-item="">{@render children()}</li>
