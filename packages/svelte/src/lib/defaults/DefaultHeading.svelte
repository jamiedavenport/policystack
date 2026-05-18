<script lang="ts">
import type { HeadingNode } from "@policystack/core";

let { node }: { node: HeadingNode } = $props();
const tag = $derived(`h${node.level ?? 2}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6");
</script>

<svelte:element this={tag} data-op-heading="">{node.value}</svelte:element>
