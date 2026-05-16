import type {
	BoldNode,
	DocumentSection,
	HeadingNode,
	ItalicNode,
	LinkNode,
	ListItemNode,
	ListNode,
	Node,
	ParagraphNode,
	TableCellNode,
	TableHeaderCellNode,
	TableHeaderRowNode,
	TableNode,
	TableRowNode,
	TextNode,
} from "@openpolicy/core";
import type { CSSProperties, ReactNode } from "react";
import type { PolicyComponents } from "../types";

export function DefaultRoot({ children, style }: { children: ReactNode; style?: unknown }) {
	return (
		<div data-op-policy style={style as CSSProperties | undefined}>
			{children}
		</div>
	);
}

export function DefaultHeading({ node }: { node: HeadingNode }) {
	const level = node.level ?? 2;
	const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
	return <Tag data-op-heading>{node.value}</Tag>;
}

export function DefaultText({ node }: { node: TextNode }) {
	return <>{node.value}</>;
}

export function DefaultBold({ node }: { node: BoldNode }) {
	return <strong>{node.value}</strong>;
}

function DefaultItalic({ node }: { node: ItalicNode }) {
	return <em>{node.value}</em>;
}

export function DefaultLink({ node }: { node: LinkNode }) {
	return <a href={node.href}>{node.value}</a>;
}

export function DefaultSection({
	section,
	children,
}: {
	section: DocumentSection;
	children: ReactNode;
}) {
	return (
		<section
			data-op-section
			id={section.id}
			{...(section.context?.reason?.code && {
				"data-op-reason": section.context.reason.code,
			})}
		>
			{children}
		</section>
	);
}

export function DefaultParagraph({
	node: _node,
	children,
}: {
	node: ParagraphNode;
	children: ReactNode;
}) {
	return <p data-op-paragraph>{children}</p>;
}

export function DefaultList({ node, children }: { node: ListNode; children: ReactNode }) {
	const Tag = node.ordered ? "ol" : "ul";
	return <Tag data-op-list>{children}</Tag>;
}

export function DefaultListItem({
	node: _node,
	children,
}: {
	node: ListItemNode;
	children: ReactNode;
}) {
	return <li data-op-list-item>{children}</li>;
}

export function DefaultTable({ node: _node, children }: { node: TableNode; children: ReactNode }) {
	return <table data-op-table>{children}</table>;
}

export function DefaultTableHeader({ children }: { children: ReactNode }) {
	return <thead data-op-table-header>{children}</thead>;
}

export function DefaultTableBody({ children }: { children: ReactNode }) {
	return <tbody data-op-table-body>{children}</tbody>;
}

export function DefaultTableRow({
	node: _node,
	children,
}: {
	node: TableRowNode;
	children: ReactNode;
}) {
	return <tr data-op-table-row>{children}</tr>;
}

export function DefaultTableHeaderRow({
	node: _node,
	children,
}: {
	node: TableHeaderRowNode;
	children: ReactNode;
}) {
	return <tr data-op-table-row>{children}</tr>;
}

export function DefaultTableHead({
	node: _node,
	children,
}: {
	node: TableHeaderCellNode;
	children: ReactNode;
}) {
	return (
		<th data-op-table-cell scope="col">
			{children}
		</th>
	);
}

export function DefaultTableCell({
	node: _node,
	children,
}: {
	node: TableCellNode;
	children: ReactNode;
}) {
	return <td data-op-table-cell>{children}</td>;
}

export function renderNode(node: Node, components: PolicyComponents, key?: number): ReactNode {
	switch (node.type) {
		case "document":
			return <>{node.sections.map((s, i) => renderNode(s, components, i))}</>;

		case "section": {
			const SectionComp = components.Section ?? DefaultSection;
			return (
				<SectionComp key={key} section={node}>
					{node.content.map((n, i) => renderNode(n, components, i))}
				</SectionComp>
			);
		}

		case "heading": {
			const HeadingComp = components.Heading ?? DefaultHeading;
			return <HeadingComp key={key} node={node} />;
		}

		case "paragraph": {
			const ParagraphComp = components.Paragraph ?? DefaultParagraph;
			return (
				<ParagraphComp key={key} node={node}>
					{node.children.map((n, i) => renderNode(n, components, i))}
				</ParagraphComp>
			);
		}

		case "list": {
			const ListComp = components.List ?? DefaultList;
			return (
				<ListComp key={key} node={node}>
					{node.items.map((item, i) => renderNode(item, components, i))}
				</ListComp>
			);
		}

		case "listItem": {
			const ListItemComp = components.ListItem ?? DefaultListItem;
			return (
				<ListItemComp key={key} node={node}>
					{node.children.map((n, i) => renderNode(n, components, i))}
				</ListItemComp>
			);
		}

		case "table": {
			const TableComp = components.Table ?? DefaultTable;
			const TableHeaderComp = components.TableHeader ?? DefaultTableHeader;
			const TableBodyComp = components.TableBody ?? DefaultTableBody;
			const TableHeaderRowComp = components.TableHeaderRow ?? DefaultTableHeaderRow;
			const TableRowComp = components.TableRow ?? DefaultTableRow;
			const TableHeadComp = components.TableHead ?? DefaultTableHead;
			const TableCellComp = components.TableCell ?? DefaultTableCell;
			const headerRow = (
				<TableHeaderRowComp node={node.header}>
					{node.header.cells.map((cell, ci) => (
						<TableHeadComp key={ci} node={cell}>
							{cell.children.map((n, i) => renderNode(n, components, i))}
						</TableHeadComp>
					))}
				</TableHeaderRowComp>
			);
			const bodyRows = node.rows.map((row, ri) => (
				<TableRowComp key={ri} node={row}>
					{row.cells.map((cell, ci) => (
						<TableCellComp key={ci} node={cell}>
							{cell.children.map((n, i) => renderNode(n, components, i))}
						</TableCellComp>
					))}
				</TableRowComp>
			));
			return (
				<TableComp key={key} node={node}>
					<TableHeaderComp>{headerRow}</TableHeaderComp>
					<TableBodyComp>{bodyRows}</TableBodyComp>
				</TableComp>
			);
		}

		case "tableRow":
		case "tableCell":
		case "tableHeaderRow":
		case "tableHeaderCell":
			return null;

		// Forward-compat no-op: unrecognized future block-level nodes are
		// represented as UnknownNode and rendered as nothing (see ADR 0001).
		case "unknown":
			return null;

		case "text": {
			const Comp = components.Text ?? DefaultText;
			return <Comp key={key} node={node} />;
		}
		case "bold": {
			const Comp = components.Bold ?? DefaultBold;
			return <Comp key={key} node={node} />;
		}
		case "italic": {
			const Comp = components.Italic ?? DefaultItalic;
			return <Comp key={key} node={node} />;
		}
		case "link": {
			const Comp = components.Link ?? DefaultLink;
			return <Comp key={key} node={node} />;
		}
	}
}
