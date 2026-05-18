<script lang="ts">
import type { DocumentSection } from "@policystack/core";
import type { Snippet } from "svelte";

let {
	node,
	children,
}: {
	node: DocumentSection;
	children: Snippet;
} = $props();
</script>

<section
	data-op-section=""
	id={node.id}
	data-op-reason={node.context?.reason?.code}
>
	{@render children()}
</section>
