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
} from "@openpolicy/core";
import type { ComponentType, ReactNode } from "react";

export type PolicyComponents = {
	Root?: ComponentType<{ children: ReactNode; style?: unknown }>;
	Section?: ComponentType<{ section: DocumentSection; children: ReactNode }>;
	Heading?: ComponentType<{ node: HeadingNode }>;
	Paragraph?: ComponentType<{ node: ParagraphNode; children: ReactNode }>;
	List?: ComponentType<{ node: ListNode; children: ReactNode }>;
	ListItem?: ComponentType<{ node: ListItemNode; children: ReactNode }>;
	Table?: ComponentType<{ node: TableNode; children: ReactNode }>;
	TableHeader?: ComponentType<{ children: ReactNode }>;
	TableBody?: ComponentType<{ children: ReactNode }>;
	TableRow?: ComponentType<{ node: TableRowNode; children: ReactNode }>;
	TableHeaderRow?: ComponentType<{ node: TableHeaderRowNode; children: ReactNode }>;
	TableHead?: ComponentType<{ node: TableHeaderCellNode; children: ReactNode }>;
	TableCell?: ComponentType<{ node: TableCellNode; children: ReactNode }>;
	Text?: ComponentType<{ node: TextNode }>;
	Bold?: ComponentType<{ node: BoldNode }>;
	Italic?: ComponentType<{ node: ItalicNode }>;
	Link?: ComponentType<{ node: LinkNode }>;
};
