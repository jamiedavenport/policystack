import type { Node } from "./types";

/**
 * The frozen tree-walk contract (§6). A `Visitor` is a **total** map keyed by
 * the `Node` discriminant: every variant — including the forward-compat
 * `unknown` arm — must be handled, so the walk is exhaustively type-checked
 * with no internal branching. This is the seam the six duplicated walkers
 * (md/html/pdf/react/vue/svelte) collapse onto in PS-12; PS-10 only freezes
 * the shape (ADR 0001).
 */
export type Visitor<R> = {
	[K in Node["type"]]: (node: Extract<Node, { type: K }>, visit: (child: Node) => R) => R;
};

/**
 * Reference implementation of the frozen contract: dispatch by discriminant,
 * threading a child-visit callback. The cast is the standard
 * correlated-union-access limitation (TS cannot relate `visitor[node.type]`
 * to the narrowed `node`); it is sound because `Visitor` is total by
 * construction.
 */
export function visit<R>(node: Node, visitor: Visitor<R>): R {
	const handle = visitor[node.type] as (n: Node, v: (child: Node) => R) => R;
	return handle(node, (child) => visit(child, visitor));
}
