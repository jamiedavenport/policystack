import { Directive, Input, TemplateRef, ViewContainerRef, effect, inject } from "@angular/core";
import type { ConsentExpr } from "@policystack/core/consent";
import { ConsentService } from "./consent.service";

@Directive({
	selector: "[ocConsent]",
	standalone: true,
})
export class ConsentGate {
	private readonly tpl = inject(TemplateRef<unknown>);
	private readonly vcr = inject(ViewContainerRef);
	private readonly consent = inject(ConsentService);

	private expr: ConsentExpr | null = null;
	private fallbackTpl: TemplateRef<unknown> | null = null;
	private rendered: "main" | "fallback" | null = null;

	@Input({ required: true })
	set ocConsent(value: ConsentExpr) {
		this.expr = value;
		this.render();
	}

	@Input()
	set ocConsentElse(tpl: TemplateRef<unknown> | null) {
		this.fallbackTpl = tpl;
		this.render();
	}

	constructor() {
		effect(() => {
			this.consent.decisions();
			this.render();
		});
	}

	private render(): void {
		const granted = this.expr === null ? false : this.consent.has(this.expr);
		const next = granted ? "main" : this.fallbackTpl ? "fallback" : null;
		if (next === this.rendered) return;
		this.vcr.clear();
		if (next === "main") this.vcr.createEmbeddedView(this.tpl);
		else if (next === "fallback" && this.fallbackTpl) this.vcr.createEmbeddedView(this.fallbackTpl);
		this.rendered = next;
	}
}
