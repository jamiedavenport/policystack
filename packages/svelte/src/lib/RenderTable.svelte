<script lang="ts">
import type {
	TableCellNode,
	TableHeaderCellNode,
	TableHeaderRowNode,
	TableNode,
	TableRowNode,
} from "@openpolicy/core";
import { getOverridesContext } from "./context.svelte";
import DefaultTable from "./defaults/DefaultTable.svelte";
import DefaultTableBody from "./defaults/DefaultTableBody.svelte";
import DefaultTableCell from "./defaults/DefaultTableCell.svelte";
import DefaultTableHead from "./defaults/DefaultTableHead.svelte";
import DefaultTableHeader from "./defaults/DefaultTableHeader.svelte";
import DefaultTableHeaderRow from "./defaults/DefaultTableHeaderRow.svelte";
import DefaultTableRow from "./defaults/DefaultTableRow.svelte";
import RenderNode from "./RenderNode.svelte";

let { node }: { node: TableNode } = $props();
const overridesGetter = getOverridesContext();
const overrides = $derived(overridesGetter());
</script>

{#snippet renderHeaderCell(cell: TableHeaderCellNode)}
	{#snippet cellChildren()}
		{#each cell.children as child, i (i)}
			<RenderNode node={child} />
		{/each}
	{/snippet}
	{#if overrides.tableHead}
		{@render overrides.tableHead({ node: cell, children: cellChildren })}
	{:else}
		<DefaultTableHead node={cell}>{@render cellChildren()}</DefaultTableHead>
	{/if}
{/snippet}

{#snippet renderCell(cell: TableCellNode)}
	{#snippet cellChildren()}
		{#each cell.children as child, i (i)}
			<RenderNode node={child} />
		{/each}
	{/snippet}
	{#if overrides.tableCell}
		{@render overrides.tableCell({ node: cell, children: cellChildren })}
	{:else}
		<DefaultTableCell node={cell}>{@render cellChildren()}</DefaultTableCell>
	{/if}
{/snippet}

{#snippet renderHeaderRow(row: TableHeaderRowNode)}
	{#snippet rowChildren()}
		{#each row.cells as cell, i (i)}
			{@render renderHeaderCell(cell)}
		{/each}
	{/snippet}
	{#if overrides.tableHeaderRow}
		{@render overrides.tableHeaderRow({ node: row, children: rowChildren })}
	{:else}
		<DefaultTableHeaderRow node={row}>{@render rowChildren()}</DefaultTableHeaderRow>
	{/if}
{/snippet}

{#snippet renderRow(row: TableRowNode)}
	{#snippet rowChildren()}
		{#each row.cells as cell, i (i)}
			{@render renderCell(cell)}
		{/each}
	{/snippet}
	{#if overrides.tableRow}
		{@render overrides.tableRow({ node: row, children: rowChildren })}
	{:else}
		<DefaultTableRow node={row}>{@render rowChildren()}</DefaultTableRow>
	{/if}
{/snippet}

{#snippet headerContents()}
	{@render renderHeaderRow(node.header)}
{/snippet}

{#snippet bodyContents()}
	{#each node.rows as row, i (i)}
		{@render renderRow(row)}
	{/each}
{/snippet}

{#snippet tableContents()}
	{#if overrides.tableHeader}
		{@render overrides.tableHeader({ children: headerContents })}
	{:else}
		<DefaultTableHeader>{@render headerContents()}</DefaultTableHeader>
	{/if}
	{#if overrides.tableBody}
		{@render overrides.tableBody({ children: bodyContents })}
	{:else}
		<DefaultTableBody>{@render bodyContents()}</DefaultTableBody>
	{/if}
{/snippet}

{#if overrides.table}
	{@render overrides.table({ node, children: tableContents })}
{:else}
	<DefaultTable {node}>{@render tableContents()}</DefaultTable>
{/if}
