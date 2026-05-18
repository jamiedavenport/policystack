<script lang="ts">
import type { TextNode } from "@policystack/core";

let { node }: { node: TextNode } = $props();
</script>

{node.value}
