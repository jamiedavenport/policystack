import type {
	BoldNode,
	DocumentSection,
	HeadingNode,
	ItalicNode,
	LinkNode,
	ListNode,
	ParagraphNode,
	TableCellNode,
	TableHeaderCellNode,
	TableHeaderRowNode,
	TableNode,
	TableRowNode,
	TextNode,
} from "@openpolicy/core";
import type { Snippet } from "svelte";

export type PolicyOverrides = {
	section?: Snippet<[{ section: DocumentSection; children: Snippet }]>;
	heading?: Snippet<[{ node: HeadingNode }]>;
	paragraph?: Snippet<[{ node: ParagraphNode; children: Snippet }]>;
	list?: Snippet<[{ node: ListNode; children: Snippet }]>;
	table?: Snippet<[{ node: TableNode; children: Snippet }]>;
	tableHeader?: Snippet<[{ children: Snippet }]>;
	tableBody?: Snippet<[{ children: Snippet }]>;
	tableRow?: Snippet<[{ node: TableRowNode; children: Snippet }]>;
	tableHeaderRow?: Snippet<[{ node: TableHeaderRowNode; children: Snippet }]>;
	tableHead?: Snippet<[{ node: TableHeaderCellNode; children: Snippet }]>;
	tableCell?: Snippet<[{ node: TableCellNode; children: Snippet }]>;
	text?: Snippet<[{ node: TextNode }]>;
	bold?: Snippet<[{ node: BoldNode }]>;
	italic?: Snippet<[{ node: ItalicNode }]>;
	link?: Snippet<[{ node: LinkNode }]>;
};
