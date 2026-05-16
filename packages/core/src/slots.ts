import type {
	BoldNode,
	Document,
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
} from "./documents";

/**
 * The canonical slot contract (PS-15 §2.4).
 *
 * One slot per renderable `Node["type"]` — the same keying as the frozen
 * `Visitor<R>` (ADR 0001: "a branch in a visitor map = a missing node type").
 * Every framework renderer (React/Vue/Svelte) derives its typed component map
 * from this single definition; there is no per-framework slot list to drift.
 *
 * Each slot name maps to the node it receives as `node`. `Root` wraps the
 * whole document and receives the `Document` itself. There are intentionally
 * no structural-only slots (the old `TableHeader`/`TableBody`/`TableHead`
 * names): `<thead>`/`<tbody>` are a rendering detail owned by the default
 * `Table`/`TableHeaderRow` components, not nodes in the AST.
 */
export type SlotNodes = {
	Root: Document;
	Section: DocumentSection;
	Heading: HeadingNode;
	Paragraph: ParagraphNode;
	List: ListNode;
	ListItem: ListItemNode;
	Table: TableNode;
	TableHeaderRow: TableHeaderRowNode;
	TableHeaderCell: TableHeaderCellNode;
	TableRow: TableRowNode;
	TableCell: TableCellNode;
	Text: TextNode;
	Bold: BoldNode;
	Italic: ItalicNode;
	Link: LinkNode;
	Unknown: UnknownNode;
};

/** Every canonical slot name. Equivalent to a PascalCase view of `Node["type"]`. */
export type SlotName = keyof SlotNodes;

/**
 * Slots whose default rendering wraps rendered child nodes. Each framework
 * intersects its own children primitive onto these (React `ReactNode`, Svelte
 * `Snippet`, Vue default slot); leaf slots carry their content on `node` only.
 */
export type ContainerSlotName =
	| "Root"
	| "Section"
	| "Paragraph"
	| "List"
	| "ListItem"
	| "Table"
	| "TableHeaderRow"
	| "TableHeaderCell"
	| "TableRow"
	| "TableCell";

/** Runtime form of {@link ContainerSlotName}. */
export const CONTAINER_SLOTS = [
	"Root",
	"Section",
	"Paragraph",
	"List",
	"ListItem",
	"Table",
	"TableHeaderRow",
	"TableHeaderCell",
	"TableRow",
	"TableCell",
] as const satisfies readonly ContainerSlotName[];

/** Runtime list of every canonical slot name (drift-guard fixture). */
export const SLOT_NAMES = [
	"Root",
	"Section",
	"Heading",
	"Paragraph",
	"List",
	"ListItem",
	"Table",
	"TableHeaderRow",
	"TableHeaderCell",
	"TableRow",
	"TableCell",
	"Text",
	"Bold",
	"Italic",
	"Link",
	"Unknown",
] as const satisfies readonly SlotName[];

// Compile-time exhaustiveness: every `SlotName` must appear in `SLOT_NAMES`,
// so the runtime fixture can never silently fall behind the type.
type _SlotNamesExhaustive = SlotName extends (typeof SLOT_NAMES)[number] ? true : never;
const _slotNamesExhaustive: _SlotNamesExhaustive = true;
void _slotNamesExhaustive;
