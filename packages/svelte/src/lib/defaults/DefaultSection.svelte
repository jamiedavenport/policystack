<script lang="ts">
import type { DocumentSection } from "@openpolicy/core";
import type { Snippet } from "svelte";

let {
	section,
	children,
}: {
	section: DocumentSection;
	children: Snippet;
} = $props();
</script>

<section
	data-op-section=""
	id={section.id}
	data-op-reason={section.context?.reason?.code}
>
	{@render children()}
</section>
