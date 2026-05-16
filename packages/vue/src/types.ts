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
import type { Component } from "vue";

export type PolicyComponents = {
	Section?: Component<{ section: DocumentSection }>;
	Heading?: Component<{ node: HeadingNode }>;
	Paragraph?: Component<{ node: ParagraphNode }>;
	List?: Component<{ node: ListNode }>;
	Table?: Component<{ node: TableNode }>;
	TableHeader?: Component;
	TableBody?: Component;
	TableRow?: Component<{ node: TableRowNode }>;
	TableHeaderRow?: Component<{ node: TableHeaderRowNode }>;
	TableHead?: Component<{ node: TableHeaderCellNode }>;
	TableCell?: Component<{ node: TableCellNode }>;
	Text?: Component<{ node: TextNode }>;
	Bold?: Component<{ node: BoldNode }>;
	Italic?: Component<{ node: ItalicNode }>;
	Link?: Component<{ node: LinkNode }>;
};
