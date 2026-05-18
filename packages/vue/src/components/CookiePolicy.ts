import type { CookiePolicyConfig, PolicyStackConfig } from "@policystack/core";
import { type CSSProperties, defineComponent, h, type PropType } from "vue";
import { usePolicyDocument } from "../composables/usePolicyDocument";
import { DefaultRoot } from "../defaults";
import { renderDocument } from "../render";
import type { PolicyComponents } from "../types";

export const CookiePolicy = defineComponent({
	name: "CookiePolicy",
	props: {
		config: {
			type: Object as PropType<PolicyStackConfig | CookiePolicyConfig>,
			required: false,
		},
		components: {
			type: Object as PropType<PolicyComponents>,
			required: false,
		},
		style: {
			type: Object as PropType<CSSProperties>,
			required: false,
		},
	},
	setup(props) {
		const doc = usePolicyDocument("cookie", () => props.config);
		return () => {
			const d = doc.value;
			if (!d) return null;
			const Root = props.components?.Root ?? DefaultRoot;
			return h(
				Root,
				{ node: d, style: props.style },
				{ default: () => renderDocument(d, props.components) ?? undefined },
			);
		};
	},
});
