<script lang="ts">
import type { ItalicNode } from "@policystack/core";

let { node }: { node: ItalicNode } = $props();
</script>

<em>{node.value}</em>
