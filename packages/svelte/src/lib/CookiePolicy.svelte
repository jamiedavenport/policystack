<script lang="ts">
import type { CookiePolicyConfig, OpenPolicyConfig } from "@openpolicy/core";
import { visit } from "@openpolicy/core";
import { setOverridesContext } from "./context.svelte";
import DefaultRoot from "./defaults/DefaultRoot.svelte";
import { planVisitor } from "./plan";
import RenderNode from "./RenderNode.svelte";
import type { PolicyComponents } from "./types";
import { resolveDocument } from "./usePolicyDocument.svelte";

type Props = {
	config?: OpenPolicyConfig | CookiePolicyConfig;
	style?: string;
} & PolicyComponents;

const props: Props = $props();

const doc = $derived(resolveDocument("cookie", props.config));
const plan = $derived(doc ? visit(doc, planVisitor) : null);

const overrides = $derived({
	Root: props.Root,
	Section: props.Section,
	Heading: props.Heading,
	Paragraph: props.Paragraph,
	List: props.List,
	ListItem: props.ListItem,
	Table: props.Table,
	TableHeaderRow: props.TableHeaderRow,
	TableHeaderCell: props.TableHeaderCell,
	TableRow: props.TableRow,
	TableCell: props.TableCell,
	Text: props.Text,
	Bold: props.Bold,
	Italic: props.Italic,
	Link: props.Link,
	Unknown: props.Unknown,
}) satisfies PolicyComponents;

setOverridesContext(() => overrides);
</script>

{#if doc && plan}
	{#snippet rootChildren()}
		<RenderNode {plan} />
	{/snippet}
	{#if props.Root}
		{@render props.Root({ node: doc, children: rootChildren })}
	{:else}
		<DefaultRoot node={doc} style={props.style}>{@render rootChildren()}</DefaultRoot>
	{/if}
{/if}
