import type { Document, InlineNode, ListItemNode, TableNode, Visitor } from "@policystack/core";
import { visit } from "@policystack/core";
import PDFDocument from "pdfkit";

type PDFKit = InstanceType<typeof PDFDocument>;

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

function inlineToText(nodes: InlineNode[]): string {
	return nodes.map((n) => n.value).join("");
}

// `Visitor<void>` built by a factory closing over the pdfkit instance — the
// shared core `visit()` replaces the hand-rolled section/content walk. Inline
// runs (`continued`), list bullet/depth recursion and the `pdf.table()` batch
// are positional and owned by their parent arm, so inline / listItem / table-row
// / table-cell arms are exhaustiveness-only no-ops (ADR 0001 unifying principle).
function buildPdfVisitor(pdf: PDFKit): Visitor<void> {
	const renderInlineNodes = (nodes: InlineNode[]): void => {
		for (let i = 0; i < nodes.length; i++) {
			const node = nodes[i];
			const continued = i < nodes.length - 1;
			switch (node!.type) {
				case "text":
					pdf.font(FONT_REGULAR).fillColor(COLOR_BODY).text(node!.value, { continued });
					break;
				case "bold":
					pdf.font(FONT_BOLD).fillColor(COLOR_HEADING).text(node!.value, { continued });
					break;
				case "italic":
					pdf.font(FONT_ITALIC).fillColor(COLOR_BODY).text(node!.value, { continued });
					break;
				case "link":
					pdf
						.font(FONT_REGULAR)
						.fillColor(COLOR_LINK)
						.text(node!.value, { continued, link: node!.href, underline: true });
					pdf.fillColor(COLOR_BODY);
					break;
			}
		}
	};

	const renderListItem = (
		item: ListItemNode,
		depth: number,
		ordered: boolean,
		index: number,
	): void => {
		const indent = pdf.page.margins.left + 10 + depth * 15;
		const bullet = ordered ? `${index + 1}.` : depth === 0 ? "•" : "◦";

		const inlineNodes = item.children.filter((c): c is InlineNode => c.type !== "list");
		const nested = item.children.find((c) => c.type === "list") ?? null;

		pdf
			.font(FONT_REGULAR)
			.fontSize(SIZE_BODY)
			.fillColor(COLOR_BODY)
			.text(`${bullet} `, { continued: true, indent });

		if (inlineNodes.length > 0) {
			renderInlineNodes(inlineNodes);
		} else {
			pdf.text("");
		}

		if (nested) {
			for (let i = 0; i < nested.items.length; i++) {
				renderListItem(nested.items[i]!, depth + 1, nested.ordered ?? false, i);
			}
		}
	};

	const renderTable = (node: TableNode): void => {
		const headerCells = node.header.cells.map((c) => ({
			text: inlineToText(c.children),
			type: "TH" as const,
			font: { src: FONT_BOLD },
			backgroundColor: "#f3f4f6",
			textColor: COLOR_HEADING,
		}));
		const bodyRows = node.rows.map((r) =>
			r.cells.map((c) => ({
				text: inlineToText(c.children),
				textColor: COLOR_BODY,
			})),
		);
		pdf.fontSize(SIZE_BODY).fillColor(COLOR_BODY);
		pdf.table({
			data: [headerCells, ...bodyRows],
			defaultStyle: {
				border: { top: 0.5, bottom: 0.5, left: 0.5, right: 0.5 },
				borderColor: "#e5e7eb",
				padding: 6,
			},
		});
		pdf.moveDown(0.5);
	};

	return {
		document: (node, v) => {
			for (let i = 0; i < node.sections.length; i++) {
				if (i > 0) {
					pdf.moveDown(0.5);
					pdf
						.moveTo(pdf.page.margins.left, pdf.y)
						.lineTo(pdf.page.width - pdf.page.margins.right, pdf.y)
						.strokeColor("#e5e7eb")
						.lineWidth(0.5)
						.stroke();
					pdf.moveDown(0.5);
				}
				v(node.sections[i]!);
			}
		},
		section: (node, v) => {
			for (const child of node.content) v(child);
		},
		heading: (node) => {
			pdf
				.font(FONT_BOLD)
				.fontSize(headingSize(node.level ?? 2))
				.fillColor(COLOR_HEADING)
				.text(node.value)
				.moveDown(0.3);
		},
		paragraph: (node) => {
			pdf.font(FONT_REGULAR).fontSize(SIZE_BODY);
			renderInlineNodes(node.children);
			pdf.moveDown(0.3);
		},
		list: (node) => {
			pdf.fontSize(SIZE_BODY);
			for (let i = 0; i < node.items.length; i++) {
				renderListItem(node.items[i]!, 0, node.ordered ?? false, i);
			}
			pdf.moveDown(0.3);
		},
		table: (node) => renderTable(node),
		// Owned by their parent arm — present only for exhaustiveness.
		listItem: () => {},
		tableHeaderRow: () => {},
		tableRow: () => {},
		tableHeaderCell: () => {},
		tableCell: () => {},
		text: () => {},
		bold: () => {},
		italic: () => {},
		link: () => {},
		// forward-compat: unrecognized node renders as nothing (ADR 0001)
		unknown: () => {},
	};
}

export function renderPDF(document: Document): Promise<Buffer> {
	return new Promise<Buffer>((resolve, reject) => {
		const pdf = new PDFDocument({ margin: 50, size: "A4" });
		const chunks: Buffer[] = [];
		pdf.on("data", (chunk: Buffer) => chunks.push(chunk));
		pdf.on("end", () => resolve(Buffer.concat(chunks)));
		pdf.on("error", reject);

		visit(document, buildPdfVisitor(pdf));

		pdf.end();
	});
}
