# ADR 0001 — Document AST shape, frozen for 1.0

- **Status:** Accepted
- **Date:** 2026-05-16
- **Ticket:** PS-10 (blocks PS-12, PS-15, PS-16)
- **Decision drivers:** v1 architecture plan §2.3, §4.2, §6; Decisions 8 & 12

## Context

PolicyStack compiles a privacy/cookie config into a hand-rolled document AST
(`Node`) that framework integrations walk and render. `Node` and the shared
`visit()` contract are on the **1.0 frozen surface** (§6): after the 1.0 tag,
any change to the union is a major version bump.

Keeping the hand-rolled AST (rather than adopting mdast/unified) is already
decided (Decision 8) — we _emit_ a closed legal document, we don't _parse_
arbitrary Markdown. What was **not** decided is the AST's exact shape. This ADR
is the one-shot pre-freeze review. It records six decisions and the breaking
node changes landed alongside it (`packages/core/src/documents/types.ts`).

## Decisions

### 1. Discriminant hygiene — _verified, no change_

Every variant already carries one consistently-named `type` string tag; there
are no structural-only variants. This is what makes the single `visit()` +
per-renderer visitor maps total and exhaustively type-checkable. Confirmed; no
change.

`bold` and `italic` are intentionally kept as separate variants even though
their shapes are identical. Collapsing them into one node with an internal
style field would reintroduce structural branching in every renderer — exactly
the anti-pattern the hygiene rule exists to prevent. The near-duplication is
the lesser cost.

### 2. Taxonomy — _table header split (breaking)_

Rule: _a branch in a visitor map = a missing node type._ Every renderer
(html/markdown/pdf + react/vue/svelte) had to thread a `kind`/`Comp` parameter
to render a `tableCell` as `<th>` vs `<td>` depending on whether it sat in the
header or the body. That internal branch is a missing node type.

Resolved by splitting the header into distinct discriminated variants:

- `TableHeaderCellNode` (`type: "tableHeaderCell"`)
- `TableHeaderRowNode` (`type: "tableHeaderRow"`)
- `TableNode.header` is now `TableHeaderRowNode` (was `TableRowNode`);
  `TableNode.rows` stays `TableRowNode[]`.

Header and body are now distinct typed paths in every renderer; the threaded
parameter is deleted. The framework slot maps gained a `TableHeaderRow` slot
and `TableHead` was retyped to `TableHeaderCellNode` (coordinated with PS-15's
`PolicyComponents` canonicalization — these slot names are intended to be the
canonical ones).

No node leans HTML: names stay legal/semantic and renderer-agnostic (the AST
also targets PDF and native component trees). `LinkNode.href` is semantic, not
an HTML attribute. Confirmed; no change there.

### 3. `context.reason` — _typed compliance trace (breaking)_

`NodeContext.reason` was a free string (`"Required by GDPR Article 13(1)(c)"`).
The hosted diff/audit layer keys off it, so it must be stable and
machine-readable, not a free-string side-channel. It is now:

```ts
type ComplianceReason = {
	code: IssueCode; // stable, machine-keyable
	jurisdiction?: JurisdictionId | readonly JurisdictionId[];
	lawfulBasis?: LegalBasis;
	citation?: string; // verbatim article text — display only
};
```

`citation` is retained deliberately: the literal article string carries
specificity `code` alone does not, and the audit layer still wants a
human-readable display string. It is display-only; machine consumers key off
`code`/`jurisdiction`/`lawfulBasis`.

`JurisdictionId` is landed now as the **frozen 11-member union** (§4.2.1:
`eea uk ch br ca us us-ca us-co us-ct us-va row`). It is intentionally distinct
from the existing config `Jurisdiction` type (`eu`/`uk`/…); the two coexist
until the §4.2.1 capability-table ticket migrates config onto it. Freezing
`reason` against the _final_ id type now is the whole point — a later rename
would be a breaking change to a frozen field.

`IssueCode` is a `string` placeholder, narrowed to the validator union by the
§2.1 validator-consolidation ticket. Narrowing a `string` alias to a union is
non-breaking for _producers_ of the AST; it is a tolerated pre-1.0 caveat
(documented here so it is a conscious choice, not an accident).

### 4. Serialization & forward-compat — _`astVersion` + `UnknownNode` (breaking)_

The AST was already JSON-round-trippable (plain objects, no cycles). Added:

- `Document.astVersion: number` (currently `AST_VERSION = 1`). Bumped on any
  additive union change so the hosted diff/`version` hash can gate on it.
- `UnknownNode` (`type: "unknown"`, optional `raw`), admitted into
  `ContentNode` (block granularity — post-1.0 growth is block-level; the inline
  union stays closed). A reader on an older `astVersion` that meets an
  unrecognized node `type` represents it as `UnknownNode`; every renderer
  renders it as a visible no-op.

This is the forward-compat seam: the frozen `Node` union can gain block-level
variants in a **minor** release without a major bump. Semver locks this at 1.0,
so it is designed in now, not retrofitted.

### 5. Consent-derived output — _composed from existing nodes, not new types_

The merge means some rendered text is consent-derived — the §4.2 posture
statement (`"EEA visitors: we ask consent before…"`). Decided **now**: this is
a normal `ParagraphNode` whose `context.reason` carries the typed posture
(`code` + `jurisdiction` + `lawfulBasis`), **not** a new node type. With the
typed `reason` (Decision 3) the posture is fully expressible without new
variants, so there is nothing to retrofit post-1.0 — which is the expensive
case this decision exists to avoid.

### 6. Two document roots — _affirmed, no change (Decision 12)_

Privacy and cookie remain two separate documents, discriminated by
`Document.policyType` (`"privacy" | "cookie"`). They are never merged into one
tree; the merge unifies the config/consent story, not the documents. The
`visit()` contract and renderers treat the two roots as distinct, never as a
merge target. Confirmed; no code change.

## The frozen `visit()` contract

`visit()` + `Visitor<R>` are landed as the frozen seam
(`packages/core/src/documents/visit.ts`): a **total** visitor map keyed by the
`Node` discriminant, with the `unknown` arm mandatory by construction. PS-10
ships the contract + one reference implementation only; collapsing the six
duplicated walkers onto it is **PS-12**.

## Consequences

- **Breaking (pre-1.0, expected):** table header nodes split; `reason` is now
  an object; `Document` gains `astVersion`; `Node` gains `unknown`. All
  renderers and hand-constructed test fixtures updated in this change.
- `IssueCode` will be narrowed by the §2.1 ticket — a non-breaking follow-up.
- Config `Jurisdiction` → `JurisdictionId` reconciliation is owned by the
  §4.2.1 ticket; the two coexist until then by design.
- Slot names (`TableHeaderRow`, retyped `TableHead`) are inputs to PS-15's
  `PolicyComponents` canonicalization.
- Acceptance: this ADR merged + `Node` at frozen shape — **met**.
