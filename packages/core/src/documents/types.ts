import type { JurisdictionId } from "../jurisdiction-id";
import type { LegalBasis } from "../types";

/**
 * A stable validator/compliance issue code.
 *
 * Placeholder: narrowed to the validator `IssueCode` union by the §2.1
 * validator-consolidation ticket. Narrowing a `string` alias to a union is a
 * non-breaking change for *producers* of the AST (see ADR 0001).
 */
export type IssueCode = string;

/**
 * A typed, machine-readable trace of *why* a node exists — the compliance
 * differentiator the hosted diff/audit layer keys off. This is a first-class
 * field, not a free-string side-channel: `code` is stable and machine-keyable,
 * `citation` carries the verbatim legal article text for render/audit display.
 */
export type ComplianceReason = {
	code: IssueCode;
	jurisdiction?: JurisdictionId | readonly JurisdictionId[];
	lawfulBasis?: LegalBasis;
	citation?: string; // verbatim legal article text — display only
};

export type NodeContext = {
	reason?: ComplianceReason;
};

// Inline nodes
export type TextNode = { type: "text"; value: string; context?: NodeContext };
export type BoldNode = { type: "bold"; value: string; context?: NodeContext };
export type ItalicNode = {
	type: "italic";
	value: string;
	context?: NodeContext;
};
export type LinkNode = {
	type: "link";
	href: string;
	value: string;
	context?: NodeContext;
};
export type InlineNode = TextNode | BoldNode | ItalicNode | LinkNode;

// Block nodes
export type HeadingNode = {
	type: "heading";
	level?: 1 | 2 | 3 | 4 | 5 | 6; // defaults to 2 if omitted
	value: string;
	context?: NodeContext;
};
export type ParagraphNode = {
	type: "paragraph";
	children: InlineNode[];
	context?: NodeContext;
};
export type ListItemNode = {
	type: "listItem";
	children: (InlineNode | ListNode)[];
	context?: NodeContext;
};
export type ListNode = {
	type: "list";
	ordered?: boolean; // defaults to false (unordered)
	items: ListItemNode[];
	context?: NodeContext;
};
export type TableCellNode = {
	type: "tableCell";
	children: InlineNode[];
	context?: NodeContext;
};
// Header cells/rows are distinct discriminated variants — not a structural
// `header: boolean` flag — so every renderer's visitor is total and exhaustively
// type-checked with no internal header/body branch (ADR 0001, taxonomy).
export type TableHeaderCellNode = {
	type: "tableHeaderCell";
	children: InlineNode[];
	context?: NodeContext;
};
export type TableRowNode = {
	type: "tableRow";
	cells: TableCellNode[];
	context?: NodeContext;
};
export type TableHeaderRowNode = {
	type: "tableHeaderRow";
	cells: TableHeaderCellNode[];
	context?: NodeContext;
};
export type TableNode = {
	type: "table";
	header: TableHeaderRowNode;
	rows: TableRowNode[];
	context?: NodeContext;
};

/**
 * Forward-compat escape hatch. A reader on an older `astVersion` that meets a
 * node `type` it does not recognize represents it as an `UnknownNode`; every
 * renderer renders it as a no-op. This is what lets the frozen `Node` union
 * gain block-level variants in a *minor* release without a major bump — semver
 * locks the union at 1.0, so the seam is designed in now (ADR 0001).
 */
export type UnknownNode = {
	type: "unknown";
	raw?: unknown;
	context?: NodeContext;
};

// Block-level content. `UnknownNode` is admitted here (not in the inline union):
// post-1.0 growth is at block granularity, and section content is where an
// older reader degrades an unrecognized node.
export type ContentNode = HeadingNode | ParagraphNode | ListNode | TableNode | UnknownNode;

// A single section of a document
export type DocumentSection = {
	type: "section";
	id: string;
	content: ContentNode[];
	context?: NodeContext;
};

export type PolicyType = "privacy" | "cookie";

/** Current Document AST schema version. Bump on any additive union change. */
export const AST_VERSION = 1;

// The top-level document. Privacy and cookie are always two separate roots
// discriminated by `policyType`; they are never merged (Decision 12, ADR 0001).
export type Document = {
	type: "document";
	astVersion: number;
	policyType: PolicyType;
	sections: DocumentSection[];
	context?: NodeContext;
};

// Every node in the document tree
export type Node =
	| Document
	| DocumentSection
	| ContentNode
	| ListItemNode
	| TableRowNode
	| TableHeaderRowNode
	| TableCellNode
	| TableHeaderCellNode
	| InlineNode;
