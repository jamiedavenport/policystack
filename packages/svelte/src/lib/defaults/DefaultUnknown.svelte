<script lang="ts">
import type { UnknownNode } from "@openpolicy/core";

// Forward-compat no-op: an unrecognized future block-level node is degraded to
// `UnknownNode` by an older reader and renders as nothing (ADR 0001).
let { node: _node }: { node: UnknownNode } = $props();
</script>
