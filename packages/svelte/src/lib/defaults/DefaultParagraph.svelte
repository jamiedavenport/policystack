<script lang="ts">
import type { ParagraphNode } from "@policystack/core";
import type { Snippet } from "svelte";

let {
	children,
}: {
	node: ParagraphNode;
	children: Snippet;
} = $props();
</script>

<p data-op-paragraph="">{@render children()}</p>
