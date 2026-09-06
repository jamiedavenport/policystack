import { cp, mkdir, readFile, readdir, writeFile, access } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Blume 1.5.3's `version` command copies the entire content root, including
// blog and marketing content. Snapshot only stable docs for this mixed site.
export async function snapshotVersion(root, id) {
	if (!/^v\d+(?:\.\d+)*$/.test(id)) throw new Error("Use a version ID such as v1 or v1.5");
	const versionsPath = resolve(root, "versions.json");
	const versions = JSON.parse(await readFile(versionsPath, "utf8"));
	if (versions.archived.some((version) => version.id === id))
		throw new Error(`Version ${id} is already archived`);
	const destination = resolve(root, "content", id);
	const exists = await access(destination).then(
		() => true,
		() => false,
	);
	if (exists) throw new Error(`Refusing to overwrite ${destination}`);
	await mkdir(destination, { recursive: true });
	await cp(resolve(root, "content/docs"), resolve(destination, "docs"), {
		recursive: true,
		filter: (source) => !source.endsWith("/roadmap.md"),
	});
	for (const file of await readdir(destination, { recursive: true })) {
		if (!/\.mdx?$/.test(file)) continue;
		const path = resolve(destination, file);
		const source = await readFile(path, "utf8");
		// Leave fenced examples and inline code byte-for-byte intact.
		const body = source
			.split(/(```[\s\S]*?```|`[^`]*`)/g)
			.map((part, i) =>
				i % 2
					? part
					: part.replace(
							/(\]\(|href=")\/docs(?=[/)#"])(?!\/roadmap(?:[.)#"]|$))/g,
							`$1/${id}/docs`,
						),
			)
			.join("");
		await writeFile(path, body);
	}
	await writeFile(
		resolve(destination, "index.md"),
		`---\ntitle: ${versions.current.label} documentation archive\ndescription: Frozen PolicyStack ${versions.current.label} documentation.\n---\n\nThese docs cover ${versions.current.label}. [Open the archived documentation](/${id}/docs).\n`,
	);
	versions.archived.unshift({ id, label: versions.current.label });
	await writeFile(versionsPath, JSON.stringify(versions, null, "\t") + "\n");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	await snapshotVersion(fileURLToPath(new URL("..", import.meta.url)), process.argv[2] ?? "");
}
