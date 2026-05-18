#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { allDocs } from "../.content-collections/generated/index.js";

const ROOT = path.resolve(import.meta.dirname, "..");
const STAGE = path.join(ROOT, ".pagefind-stage");

// Different nitro presets emit static assets to different directories. Copy
// the index to every known target that actually exists after `vite build`,
// so the index ships regardless of which preset Vercel/Netlify/etc. selected.
const STATIC_DIR_CANDIDATES = [
	".output/public", // nitro node-server (and default local preview)
	".vercel/output/static", // nitro vercel preset
	".netlify/static", // nitro netlify preset
	".netlify/v1/static",
];

fs.rmSync(STAGE, { recursive: true, force: true });
fs.mkdirSync(STAGE, { recursive: true });

for (const doc of allDocs) {
	// Pagefind sets each result's URL from the file's path relative to the
	// indexed site (and it strips a trailing `index.html`). Mirror our real
	// route structure as directories so the indexed URL matches the live URL.
	// /docs              -> docs/index.html
	// /docs/policy   -> docs/policy/index.html
	// /docs/policy/cli/policies/quick-start
	//                    -> docs/policy/policies/quick-start/index.html
	const dir = doc.slug === "index" ? "docs" : `docs/${doc.slug}`;
	const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(doc.title)} — PolicyStack docs</title>
</head>
<body>
<main data-pagefind-body>
<span hidden data-pagefind-meta="title:${esc(doc.title)}"></span>
<h1>${esc(doc.title)}</h1>
${doc.description ? `<p data-pagefind-meta="description">${esc(doc.description)}</p>` : ""}
<div>${markdownToText(doc.content)}</div>
</main>
</body>
</html>`;
	const fullDir = path.join(STAGE, dir);
	fs.mkdirSync(fullDir, { recursive: true });
	fs.writeFileSync(path.join(fullDir, "index.html"), html, "utf8");
}

execSync(`pnpm exec pagefind --site "${STAGE}"`, { stdio: "inherit", cwd: ROOT });

const generated = path.join(STAGE, "pagefind");
if (!fs.existsSync(generated)) {
	console.error("[pagefind] expected output not found at", generated);
	process.exit(1);
}

let copied = 0;
for (const candidate of STATIC_DIR_CANDIDATES) {
	const baseDir = path.join(ROOT, candidate);
	if (!fs.existsSync(baseDir)) continue;
	const target = path.join(baseDir, "pagefind");
	fs.rmSync(target, { recursive: true, force: true });
	fs.cpSync(generated, target, { recursive: true });
	console.log(`[pagefind] index copied to ${path.relative(ROOT, target)}`);
	copied++;
}
fs.rmSync(STAGE, { recursive: true, force: true });

if (!copied) {
	console.error(
		`[pagefind] no known static output directory found. Looked for: ${STATIC_DIR_CANDIDATES.join(", ")}`,
	);
	process.exit(1);
}

function esc(s = "") {
	return String(s).replace(
		/[&<>"']/g,
		(c) =>
			({
				"&": "&amp;",
				"<": "&lt;",
				">": "&gt;",
				'"': "&quot;",
				"'": "&#39;",
			})[c],
	);
}

function markdownToText(md = "") {
	return md
		.replace(/```[\s\S]*?```/g, " ")
		.replace(/`([^`]+)`/g, "$1")
		.replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
		.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
		.replace(/^[#>*-]+\s*/gm, "")
		.split("\n\n")
		.map((p) => `<p>${esc(p.replace(/\n/g, " ").trim())}</p>`)
		.join("\n");
}
