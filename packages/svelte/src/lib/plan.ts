import type {
	BoldNode,
	DocumentSection,
	HeadingNode,
	ItalicNode,
	LinkNode,
	ListItemNode,
	ListNode,
	ParagraphNode,
	TableCellNode,
	TableHeaderCellNode,
	TableHeaderRowNode,
	TableNode,
	TableRowNode,
	TextNode,
	UnknownNode,
	Visitor,
} from "@openpolicy/core";

/**
 * Svelte renders from compiled templates, not a value-returning function, so it
 * consumes the shared core `visit()` indirectly: `planVisitor` is the single
 * walker that turns the frozen `Node` tree into a serializable `RenderPlan`
 * tree, and one small recursive `RenderNode.svelte` interprets that plan. This
 * replaces the two hand-rolled template walks with one `Visitor` map (PS-12 /
 * ADR 0001).
 *
 * Each slot variant is keyed by the canonical PascalCase slot name from
 * `@openpolicy/core` (PS-15) and carries the precisely-typed node, so the
 * interpreter needs no casts; the `Visitor` mapped type still forces every
 * `Node` variant to be handled. There are no structural-only slots: `<thead>`
 * is a render detail of the default header-row component, and `Root` is applied
 * by the policy component, not the plan.
 */
type SlotPlan =
	| { slot: "Section"; node: DocumentSection }
	| { slot: "Heading"; node: HeadingNode }
	| { slot: "Paragraph"; node: ParagraphNode }
	| { slot: "List"; node: ListNode }
	| { slot: "ListItem"; node: ListItemNode }
	| { slot: "Table"; node: TableNode }
	| { slot: "TableHeaderRow"; node: TableHeaderRowNode }
	| { slot: "TableHeaderCell"; node: TableHeaderCellNode }
	| { slot: "TableRow"; node: TableRowNode }
	| { slot: "TableCell"; node: TableCellNode }
	| { slot: "Text"; node: TextNode }
	| { slot: "Bold"; node: BoldNode }
	| { slot: "Italic"; node: ItalicNode }
	| { slot: "Link"; node: LinkNode }
	| { slot: "Unknown"; node: UnknownNode };

export type RenderPlan =
	| ({ k: "slot"; children: RenderPlan[] } & SlotPlan)
	| { k: "frag"; children: RenderPlan[] };

export const planVisitor: Visitor<RenderPlan> = {
	document: (node, v) => ({ k: "frag", children: node.sections.map(v) }),
	section: (node, v) => ({ k: "slot", slot: "Section", node, children: node.content.map(v) }),
	heading: (node) => ({ k: "slot", slot: "Heading", node, children: [] }),
	paragraph: (node, v) => ({ k: "slot", slot: "Paragraph", node, children: node.children.map(v) }),
	list: (node, v) => ({ k: "slot", slot: "List", node, children: node.items.map(v) }),
	listItem: (node, v) => ({ k: "slot", slot: "ListItem", node, children: node.children.map(v) }),
	// The header row + body rows are direct children of the Table slot; `<thead>`
	// is owned by the default TableHeaderRow component, not a slot.
	table: (node, v) => ({
		k: "slot",
		slot: "Table",
		node,
		children: [v(node.header), ...node.rows.map(v)],
	}),
	tableHeaderRow: (node, v) => ({
		k: "slot",
		slot: "TableHeaderRow",
		node,
		children: node.cells.map(v),
	}),
	tableRow: (node, v) => ({ k: "slot", slot: "TableRow", node, children: node.cells.map(v) }),
	tableHeaderCell: (node, v) => ({
		k: "slot",
		slot: "TableHeaderCell",
		node,
		children: node.children.map(v),
	}),
	tableCell: (node, v) => ({ k: "slot", slot: "TableCell", node, children: node.children.map(v) }),
	text: (node) => ({ k: "slot", slot: "Text", node, children: [] }),
	bold: (node) => ({ k: "slot", slot: "Bold", node, children: [] }),
	italic: (node) => ({ k: "slot", slot: "Italic", node, children: [] }),
	link: (node) => ({ k: "slot", slot: "Link", node, children: [] }),
	// Forward-compat: an unrecognized future node is degraded to an overridable
	// Unknown slot whose default renders nothing (ADR 0001).
	unknown: (node) => ({ k: "slot", slot: "Unknown", node, children: [] }),
};
