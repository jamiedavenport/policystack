import type { Node, Visitor } from "@policystack/core";
import { visit } from "@policystack/core";
import { cloneVNode, h, isVNode, type VNodeChild } from "vue";
import {
	DefaultBold,
	DefaultHeading,
	DefaultItalic,
	DefaultLink,
	DefaultList,
	DefaultListItem,
	DefaultParagraph,
	DefaultSection,
	DefaultTable,
	DefaultTableCell,
	DefaultTableHeaderCell,
	DefaultTableHeaderRow,
	DefaultTableRow,
	DefaultText,
	DefaultUnknown,
} from "../defaults";
import type { PolicyComponents } from "../types";

export type RenderNode = (node: Node, components: PolicyComponents) => VNodeChild;

// `visit()` threads no list index, so the keys the old per-renderer walk put on
// each child are reapplied here by the parent arm: it maps with an index and
// clones the produced VNode with that key. The `table` arm owns its whole grid
// (its row/cell keys are set directly), so the row/cell arms are
// exhaustiveness-only no-ops (ADR 0001 unifying principle). Slots come from the
// one canonical contract in `@policystack/core` (PS-15).
const keyed = (child: VNodeChild, key: number): VNodeChild =>
	isVNode(child) ? cloneVNode(child, { key }) : child;

function buildVisitor(components: PolicyComponents): Visitor<VNodeChild> {
	const cellKids = (cell: { children: Node[] }, v: (child: Node) => VNodeChild) =>
		cell.children.map((n, i) => keyed(v(n), i));

	return {
		document: (node, v) => node.sections.map((s, i) => keyed(v(s), i)),
		section: (node, v) => {
			const SectionComp = components.Section ?? DefaultSection;
			return h(
				SectionComp,
				{ node },
				{ default: () => node.content.map((n, i) => keyed(v(n), i)) },
			);
		},
		heading: (node) => {
			const HeadingComp = components.Heading ?? DefaultHeading;
			return h(HeadingComp, { node });
		},
		paragraph: (node, v) => {
			const ParagraphComp = components.Paragraph ?? DefaultParagraph;
			return h(
				ParagraphComp,
				{ node },
				{ default: () => node.children.map((n, i) => keyed(v(n), i)) },
			);
		},
		list: (node, v) => {
			const ListComp = components.List ?? DefaultList;
			return h(ListComp, { node }, { default: () => node.items.map((it, i) => keyed(v(it), i)) });
		},
		listItem: (node, v) => {
			const ListItemComp = components.ListItem ?? DefaultListItem;
			return h(
				ListItemComp,
				{ node },
				{ default: () => node.children.map((n, i) => keyed(v(n), i)) },
			);
		},
		table: (node, v) => {
			const TableComp = components.Table ?? DefaultTable;
			const TableRowComp = components.TableRow ?? DefaultTableRow;
			const TableHeaderRowComp = components.TableHeaderRow ?? DefaultTableHeaderRow;
			const TableHeaderCellComp = components.TableHeaderCell ?? DefaultTableHeaderCell;
			const TableCellComp = components.TableCell ?? DefaultTableCell;

			const headerCells = node.header.cells.map((c, ci) =>
				h(TableHeaderCellComp, { key: ci, node: c }, { default: () => cellKids(c, v) }),
			);
			const headerRow = h(
				TableHeaderRowComp,
				{ node: node.header },
				{ default: () => headerCells },
			);
			const bodyRows = node.rows.map((row, ri) =>
				h(
					TableRowComp,
					{ key: ri, node: row },
					{
						default: () =>
							row.cells.map((c, ci) =>
								h(TableCellComp, { key: ci, node: c }, { default: () => cellKids(c, v) }),
							),
					},
				),
			);
			return h(TableComp, { node }, { default: () => [headerRow, ...bodyRows] });
		},
		// Owned by the `table` arm — present only for exhaustiveness.
		tableHeaderRow: () => null,
		tableRow: () => null,
		tableHeaderCell: () => null,
		tableCell: () => null,
		unknown: (node) => {
			const UnknownComp = components.Unknown ?? DefaultUnknown;
			return h(UnknownComp, { node });
		},
		text: (node) => {
			const Comp = components.Text ?? DefaultText;
			return h(Comp, { node });
		},
		bold: (node) => {
			const Comp = components.Bold ?? DefaultBold;
			return h(Comp, { node });
		},
		italic: (node) => {
			const Comp = components.Italic ?? DefaultItalic;
			return h(Comp, { node });
		},
		link: (node) => {
			const Comp = components.Link ?? DefaultLink;
			return h(Comp, { node });
		},
	};
}

export const renderNode: RenderNode = (node, components) => visit(node, buildVisitor(components));
