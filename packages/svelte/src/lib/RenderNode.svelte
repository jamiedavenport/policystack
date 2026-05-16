<script lang="ts">
import { getOverridesContext } from "./context.svelte";
import DefaultBold from "./defaults/DefaultBold.svelte";
import DefaultHeading from "./defaults/DefaultHeading.svelte";
import DefaultItalic from "./defaults/DefaultItalic.svelte";
import DefaultLink from "./defaults/DefaultLink.svelte";
import DefaultList from "./defaults/DefaultList.svelte";
import DefaultListItem from "./defaults/DefaultListItem.svelte";
import DefaultParagraph from "./defaults/DefaultParagraph.svelte";
import DefaultSection from "./defaults/DefaultSection.svelte";
import DefaultTable from "./defaults/DefaultTable.svelte";
import DefaultTableCell from "./defaults/DefaultTableCell.svelte";
import DefaultTableHeaderCell from "./defaults/DefaultTableHeaderCell.svelte";
import DefaultTableHeaderRow from "./defaults/DefaultTableHeaderRow.svelte";
import DefaultTableRow from "./defaults/DefaultTableRow.svelte";
import DefaultText from "./defaults/DefaultText.svelte";
import DefaultUnknown from "./defaults/DefaultUnknown.svelte";
import type { RenderPlan } from "./plan";
import RenderNode from "./RenderNode.svelte";

// Generic interpreter for the `RenderPlan` tree produced by the single core
// `visit()` (see plan.ts). There is no `node.type` walk here — the tree shape
// is precomputed; this only maps each canonical slot (PS-15) to its override
// snippet or default component. This is what lets the old hand-rolled template
// walks collapse onto one visitor (PS-12 / ADR 0001).
let { plan }: { plan: RenderPlan } = $props();
const overridesGetter = getOverridesContext();
const overrides = $derived(overridesGetter());
</script>

{#if plan.k === "frag"}
	{#each plan.children as child, i (i)}
		<RenderNode plan={child} />
	{/each}
{:else if plan.k === "slot"}
	{#snippet kids()}
		{#each plan.children as child, i (i)}
			<RenderNode plan={child} />
		{/each}
	{/snippet}
	{#if plan.slot === "Section"}
		{#if overrides.Section}
			{@render overrides.Section({ node: plan.node, children: kids })}
		{:else}
			<DefaultSection node={plan.node}>{@render kids()}</DefaultSection>
		{/if}
	{:else if plan.slot === "Heading"}
		{#if overrides.Heading}
			{@render overrides.Heading({ node: plan.node })}
		{:else}
			<DefaultHeading node={plan.node} />
		{/if}
	{:else if plan.slot === "Paragraph"}
		{#if overrides.Paragraph}
			{@render overrides.Paragraph({ node: plan.node, children: kids })}
		{:else}
			<DefaultParagraph node={plan.node}>{@render kids()}</DefaultParagraph>
		{/if}
	{:else if plan.slot === "List"}
		{#if overrides.List}
			{@render overrides.List({ node: plan.node, children: kids })}
		{:else}
			<DefaultList node={plan.node}>{@render kids()}</DefaultList>
		{/if}
	{:else if plan.slot === "ListItem"}
		{#if overrides.ListItem}
			{@render overrides.ListItem({ node: plan.node, children: kids })}
		{:else}
			<DefaultListItem node={plan.node}>{@render kids()}</DefaultListItem>
		{/if}
	{:else if plan.slot === "Table"}
		{#if overrides.Table}
			{@render overrides.Table({ node: plan.node, children: kids })}
		{:else}
			<DefaultTable node={plan.node}>{@render kids()}</DefaultTable>
		{/if}
	{:else if plan.slot === "TableHeaderRow"}
		{#if overrides.TableHeaderRow}
			{@render overrides.TableHeaderRow({ node: plan.node, children: kids })}
		{:else}
			<DefaultTableHeaderRow node={plan.node}>{@render kids()}</DefaultTableHeaderRow>
		{/if}
	{:else if plan.slot === "TableHeaderCell"}
		{#if overrides.TableHeaderCell}
			{@render overrides.TableHeaderCell({ node: plan.node, children: kids })}
		{:else}
			<DefaultTableHeaderCell node={plan.node}>{@render kids()}</DefaultTableHeaderCell>
		{/if}
	{:else if plan.slot === "TableRow"}
		{#if overrides.TableRow}
			{@render overrides.TableRow({ node: plan.node, children: kids })}
		{:else}
			<DefaultTableRow node={plan.node}>{@render kids()}</DefaultTableRow>
		{/if}
	{:else if plan.slot === "TableCell"}
		{#if overrides.TableCell}
			{@render overrides.TableCell({ node: plan.node, children: kids })}
		{:else}
			<DefaultTableCell node={plan.node}>{@render kids()}</DefaultTableCell>
		{/if}
	{:else if plan.slot === "Text"}
		{#if overrides.Text}
			{@render overrides.Text({ node: plan.node })}
		{:else}
			<DefaultText node={plan.node} />
		{/if}
	{:else if plan.slot === "Bold"}
		{#if overrides.Bold}
			{@render overrides.Bold({ node: plan.node })}
		{:else}
			<DefaultBold node={plan.node} />
		{/if}
	{:else if plan.slot === "Italic"}
		{#if overrides.Italic}
			{@render overrides.Italic({ node: plan.node })}
		{:else}
			<DefaultItalic node={plan.node} />
		{/if}
	{:else if plan.slot === "Link"}
		{#if overrides.Link}
			{@render overrides.Link({ node: plan.node })}
		{:else}
			<DefaultLink node={plan.node} />
		{/if}
	{:else if plan.slot === "Unknown"}
		{#if overrides.Unknown}
			{@render overrides.Unknown({ node: plan.node })}
		{:else}
			<DefaultUnknown node={plan.node} />
		{/if}
	{/if}
{/if}
