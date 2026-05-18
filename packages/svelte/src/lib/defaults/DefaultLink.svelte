<script lang="ts">
import type { LinkNode } from "@policystack/core";

let { node }: { node: LinkNode } = $props();
</script>

<a href={node.href}>{node.value}</a>
