import type { OpenPolicyConfig } from "@openpolicy/core";
import type { Category, OpenCookiesConfig } from "@opencookies/core";

export type ToOpenCookiesConfigOptions = Omit<OpenCookiesConfig, "categories">;

export function toOpenCookiesConfig(
	policy: OpenPolicyConfig,
	options?: ToOpenCookiesConfigOptions,
): OpenCookiesConfig {
	const used: Record<string, boolean> = policy.cookies?.used ?? {};
	const categories: Category[] = Object.keys(used)
		.filter((key) => used[key])
		.map((key) => ({
			key,
			label: key.charAt(0).toUpperCase() + key.slice(1),
			locked: key === "essential",
		}));
	const policyVersion = options?.policyVersion ?? policy.cookieVersion;
	return { ...options, ...(policyVersion ? { policyVersion } : {}), categories };
}
