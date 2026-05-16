<script lang="ts">
import type { Node } from "@openpolicy/core";
import { getOverridesContext } from "./context.svelte";
import DefaultBold from "./defaults/DefaultBold.svelte";
import DefaultHeading from "./defaults/DefaultHeading.svelte";
import DefaultItalic from "./defaults/DefaultItalic.svelte";
import DefaultLink from "./defaults/DefaultLink.svelte";
import DefaultList from "./defaults/DefaultList.svelte";
import DefaultParagraph from "./defaults/DefaultParagraph.svelte";
import DefaultSection from "./defaults/DefaultSection.svelte";
import DefaultText from "./defaults/DefaultText.svelte";
import RenderNode from "./RenderNode.svelte";
import RenderTable from "./RenderTable.svelte";

let { node }: { node: Node } = $props();
const overridesGetter = getOverridesContext();
const overrides = $derived(overridesGetter());
</script>

{#if node.type === "document"}
	{#each node.sections as section, i (i)}
		<RenderNode node={section} />
	{/each}
{:else if node.type === "section"}
	{#snippet sectionChildren()}
		{#each node.content as child, i (i)}
			<RenderNode node={child} />
		{/each}
	{/snippet}
	{#if overrides.section}
		{@render overrides.section({ section: node, children: sectionChildren })}
	{:else}
		<DefaultSection section={node}>{@render sectionChildren()}</DefaultSection>
	{/if}
{:else if node.type === "heading"}
	{#if overrides.heading}
		{@render overrides.heading({ node })}
	{:else}
		<DefaultHeading {node} />
	{/if}
{:else if node.type === "paragraph"}
	{#snippet paragraphChildren()}
		{#each node.children as child, i (i)}
			<RenderNode node={child} />
		{/each}
	{/snippet}
	{#if overrides.paragraph}
		{@render overrides.paragraph({ node, children: paragraphChildren })}
	{:else}
		<DefaultParagraph {node}>{@render paragraphChildren()}</DefaultParagraph>
	{/if}
{:else if node.type === "list"}
	{#snippet listChildren()}
		{#each node.items as item, i (i)}
			<RenderNode node={item} />
		{/each}
	{/snippet}
	{#if overrides.list}
		{@render overrides.list({ node, children: listChildren })}
	{:else}
		<DefaultList {node}>{@render listChildren()}</DefaultList>
	{/if}
{:else if node.type === "listItem"}
	<li data-op-list-item="">
		{#each node.children as child, i (i)}
			<RenderNode node={child} />
		{/each}
	</li>
{:else if node.type === "table"}
	<RenderTable {node} />
{:else if node.type === "text"}
	{#if overrides.text}
		{@render overrides.text({ node })}
	{:else}
		<DefaultText {node} />
	{/if}
{:else if node.type === "bold"}
	{#if overrides.bold}
		{@render overrides.bold({ node })}
	{:else}
		<DefaultBold {node} />
	{/if}
{:else if node.type === "italic"}
	{#if overrides.italic}
		{@render overrides.italic({ node })}
	{:else}
		<DefaultItalic {node} />
	{/if}
{:else if node.type === "link"}
	{#if overrides.link}
		{@render overrides.link({ node })}
	{:else}
		<DefaultLink {node} />
	{/if}
{:else if node.type === "unknown"}
	<!-- Forward-compat escape hatch: an UnknownNode renders as a no-op so a
	     reader on an older astVersion that meets an unrecognized block-level
	     node degrades gracefully instead of crashing (ADR 0001). -->
{/if}
