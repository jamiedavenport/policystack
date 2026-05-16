import type {
	Document,
	DocumentSection,
	InlineNode,
	ListItemNode,
	ListNode,
	TableNode,
	TableRowNode,
} from "@openpolicy/core";
import PDFDocument from "pdfkit";

const FONT_REGULAR = "Helvetica";
const FONT_BOLD = "Helvetica-Bold";
const FONT_ITALIC = "Helvetica-Oblique";
const SIZE_HEADING_BASE = 16;
const SIZE_BODY = 11;
const COLOR_BODY = "#374151";
const COLOR_HEADING = "#111827";
const COLOR_LINK = "#2563eb";

function headingSize(level: number): number {
	// H1=16, H2=14, H3=13, H4=12, H5=11, H6=10
	return Math.max(10, SIZE_HEADING_BASE - (level - 1) * 1.5);
}

function renderInlineNodes(doc: InstanceType<typeof PDFDocument>, nodes: InlineNode[]): void {
	for (let i = 0; i < nodes.length; i++) {
		const node = nodes[i];
		const continued = i < nodes.length - 1;
		switch (node!.type) {
			case "text":
				doc.font(FONT_REGULAR).fillColor(COLOR_BODY).text(node!.value, { continued });
				break;
			case "bold":
				doc.font(FONT_BOLD).fillColor(COLOR_HEADING).text(node!.value, { continued });
				break;
			case "italic":
				doc.font(FONT_ITALIC).fillColor(COLOR_BODY).text(node!.value, { continued });
				break;
			case "link":
				doc
					.font(FONT_REGULAR)
					.fillColor(COLOR_LINK)
					.text(node!.value, { continued, link: node!.href, underline: true });
				doc.fillColor(COLOR_BODY);
				break;
		}
	}
}

function renderListItem(
	doc: InstanceType<typeof PDFDocument>,
	item: ListItemNode,
	depth: number,
	ordered: boolean,
	index: number,
): void {
	const indent = doc.page.margins.left + 10 + depth * 15;
	const bullet = ordered ? `${index + 1}.` : depth === 0 ? "•" : "◦";

	const inlineNodes = item.children.filter((c): c is InlineNode => c.type !== "list");
	const nested = item.children.find((c): c is ListNode => c.type === "list") ?? null;

	doc
		.font(FONT_REGULAR)
		.fontSize(SIZE_BODY)
		.fillColor(COLOR_BODY)
		.text(`${bullet} `, { continued: true, indent });

	if (inlineNodes.length > 0) {
		renderInlineNodes(doc, inlineNodes);
	} else {
		doc.text("");
	}

	if (nested) {
		for (let i = 0; i < nested.items.length; i++) {
			renderListItem(doc, nested.items[i]!, depth + 1, nested.ordered ?? false, i);
		}
	}
}

function inlineToText(nodes: InlineNode[]): string {
	return nodes.map((n) => n.value).join("");
}

function renderTable(doc: InstanceType<typeof PDFDocument>, node: TableNode): void {
	const headerCells = node.header.cells.map((c) => ({
		text: inlineToText(c.children),
		type: "TH" as const,
		font: { src: FONT_BOLD },
		backgroundColor: "#f3f4f6",
		textColor: COLOR_HEADING,
	}));
	const bodyRows = node.rows.map((r: TableRowNode) =>
		r.cells.map((c) => ({
			text: inlineToText(c.children),
			textColor: COLOR_BODY,
		})),
	);
	doc.fontSize(SIZE_BODY).fillColor(COLOR_BODY);
	doc.table({
		data: [headerCells, ...bodyRows],
		defaultStyle: {
			border: { top: 0.5, bottom: 0.5, left: 0.5, right: 0.5 },
			borderColor: "#e5e7eb",
			padding: 6,
		},
	});
	doc.moveDown(0.5);
}

function renderSection(
	doc: InstanceType<typeof PDFDocument>,
	section: DocumentSection,
	isFirst: boolean,
): void {
	if (!isFirst) {
		doc.moveDown(0.5);
		doc
			.moveTo(doc.page.margins.left, doc.y)
			.lineTo(doc.page.width - doc.page.margins.right, doc.y)
			.strokeColor("#e5e7eb")
			.lineWidth(0.5)
			.stroke();
		doc.moveDown(0.5);
	}

	for (const node of section.content) {
		switch (node.type) {
			case "heading":
				doc
					.font(FONT_BOLD)
					.fontSize(headingSize(node.level ?? 2))
					.fillColor(COLOR_HEADING)
					.text(node.value)
					.moveDown(0.3);
				break;
			case "paragraph":
				doc.font(FONT_REGULAR).fontSize(SIZE_BODY);
				renderInlineNodes(doc, node.children);
				doc.moveDown(0.3);
				break;
			case "list":
				doc.fontSize(SIZE_BODY);
				for (let i = 0; i < node.items.length; i++) {
					renderListItem(doc, node.items[i]!, 0, node.ordered ?? false, i);
				}
				doc.moveDown(0.3);
				break;
			case "table":
				renderTable(doc, node);
				break;
			case "unknown":
				// forward-compat: unrecognized node renders as nothing (ADR 0001)
				break;
		}
	}
}

export function renderPDF(document: Document): Promise<Buffer> {
	return new Promise<Buffer>((resolve, reject) => {
		const pdf = new PDFDocument({ margin: 50, size: "A4" });
		const chunks: Buffer[] = [];
		pdf.on("data", (chunk: Buffer) => chunks.push(chunk));
		pdf.on("end", () => resolve(Buffer.concat(chunks)));
		pdf.on("error", reject);

		for (let i = 0; i < document.sections.length; i++) {
			renderSection(pdf, document.sections[i]!, i === 0);
		}

		pdf.end();
	});
}
