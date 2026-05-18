import type { Hit, ParsedComment } from "./types";

const NEXT_LINE_RE = /policystack-ignore-next-line/;
const FILE_RE = /policystack-ignore-file/;

export function applySuppressions(hits: Hit[], comments: ParsedComment[]): Hit[] {
	if (hits.length === 0) return hits;
	if (isFileSuppressed(comments)) return [];
	const ignoredLines = new Set<number>();
	for (const c of comments) {
		if (NEXT_LINE_RE.test(c.value)) ignoredLines.add(c.line + 1);
	}
	if (ignoredLines.size === 0) return hits;
	return hits.filter((h) => !ignoredLines.has(h.line));
}

function isFileSuppressed(comments: ParsedComment[]): boolean {
	for (const c of comments) {
		if (c.line > 10) continue;
		if (FILE_RE.test(c.value)) return true;
	}
	return false;
}
