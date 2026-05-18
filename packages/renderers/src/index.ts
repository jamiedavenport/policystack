import type {
	CompileOptions,
	OutputFormat,
	PolicyStackConfig,
	PolicyType,
} from "@policystack/core";
import { compileCookiePolicy, compilePrivacyPolicy } from "@policystack/core";

export { renderHTML } from "./html";
export { renderMarkdown } from "./markdown";
export { renderPDF } from "./pdf";

function filenameFor(type: PolicyType, ext: string): string {
	switch (type) {
		case "privacy":
			return `privacy-policy.${ext}`;
		case "cookie":
			return `cookie-policy.${ext}`;
	}
}

export async function compilePolicy(
	config: PolicyStackConfig,
	type: PolicyType,
	options?: CompileOptions,
): Promise<{ format: OutputFormat; filename: string; content: string | Buffer }[]> {
	const doc = type === "privacy" ? compilePrivacyPolicy(config) : compileCookiePolicy(config);
	if (!doc) {
		throw new Error(
			`PolicyStack: this config does not emit a ${type} policy — check the fields/\`policies\` that gate ${type} emission.`,
		);
	}
	const formats = options?.formats ?? ["markdown"];
	return Promise.all(
		formats.map(async (format) => {
			switch (format) {
				case "markdown": {
					const { renderMarkdown } = await import("./markdown");
					return {
						format,
						filename: filenameFor(type, "md"),
						content: renderMarkdown(doc),
					};
				}
				case "html": {
					const { renderHTML } = await import("./html");
					return {
						format,
						filename: filenameFor(type, "html"),
						content: renderHTML(doc),
					};
				}
				case "pdf": {
					const { renderPDF } = await import("./pdf");
					return {
						format,
						filename: filenameFor(type, "pdf"),
						content: await renderPDF(doc),
					};
				}
			}
		}),
	);
}
