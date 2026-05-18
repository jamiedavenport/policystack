import { createServerFn } from "@tanstack/react-start";

export type StarKey = "consent" | "policy";

const REPOS: Record<StarKey, string> = {
	consent: "jamiedavenport/policystack",
	policy: "jamiedavenport/policystack",
};

async function request(repo: string, withAuth: boolean): Promise<Response> {
	const headers: Record<string, string> = {
		accept: "application/vnd.github+json",
		"user-agent": "policystack.dev",
	};
	if (withAuth && process.env.GITHUB_TOKEN) {
		headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
	}
	return fetch(`https://api.github.com/repos/${repo}`, { headers });
}

async function fetchOne(repo: string): Promise<number | null> {
	try {
		let res = await request(repo, true);
		if ((res.status === 401 || res.status === 403) && process.env.GITHUB_TOKEN) {
			res = await request(repo, false);
		}
		if (!res.ok) return null;
		const json = (await res.json()) as { stargazers_count?: number };
		return typeof json.stargazers_count === "number" ? json.stargazers_count : null;
	} catch {
		return null;
	}
}

export const getStars = createServerFn({ method: "GET" }).handler(
	async (): Promise<Record<StarKey, number | null>> => {
		const entries = await Promise.all(
			(Object.entries(REPOS) as Array<[StarKey, string]>).map(
				async ([key, repo]) => [key, await fetchOne(repo)] as const,
			),
		);
		return Object.fromEntries(entries) as Record<StarKey, number | null>;
	},
);
