import { collecting } from "@policystack/sdk";

/**
 * Placeholder ORM call sites that exist purely so `@policystack/vite`
 * has something to discover during this example's build. Replace with real
 * `db.insert(...)` code in a production app — `collecting()` returns its
 * `value` argument unchanged, so it's safe to drop in at any write site.
 */
export function fakeCreateUser(name: string, email: string) {
	return collecting(
		"Account Information",
		{ name, email },
		{
			name: "Name",
			email: "Email",
		},
	);
}

export function fakeRecordPageView(path: string, userAgent: string) {
	return collecting(
		"Usage Data",
		{ path, userAgent },
		{
			path: "Pages visited",
			userAgent: "Browser type",
		},
	);
}
