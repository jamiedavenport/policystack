<script lang="ts">
import type { BoldNode } from "@policystack/core";

let { node }: { node: BoldNode } = $props();
</script>

<strong>{node.value}</strong>
