import type { CompileOptions, OutputFormat, PolicyInput } from "@policystack/core";
import { compile } from "@policystack/core";

export { renderHTML } from "./html";
export { renderMarkdown } from "./markdown";
export { renderPDF } from "./pdf";

function filenameFor(type: PolicyInput["type"], ext: string): string {
	switch (type) {
		case "privacy":
			return `privacy-policy.${ext}`;
		case "cookie":
			return `cookie-policy.${ext}`;
	}
}

export async function compilePolicy(
	input: PolicyInput,
	options?: CompileOptions,
): Promise<{ format: OutputFormat; filename: string; content: string | Buffer }[]> {
	const doc = compile(input);
	const formats = options?.formats ?? ["markdown"];
	return Promise.all(
		formats.map(async (format) => {
			switch (format) {
				case "markdown": {
					const { renderMarkdown } = await import("./markdown");
					return {
						format,
						filename: filenameFor(input.type, "md"),
						content: renderMarkdown(doc),
					};
				}
				case "html": {
					const { renderHTML } = await import("./html");
					return {
						format,
						filename: filenameFor(input.type, "html"),
						content: renderHTML(doc),
					};
				}
				case "pdf": {
					const { renderPDF } = await import("./pdf");
					return {
						format,
						filename: filenameFor(input.type, "pdf"),
						content: await renderPDF(doc),
					};
				}
			}
		}),
	);
}
