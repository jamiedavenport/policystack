import { createFileRoute } from "@tanstack/react-router";
import { LocalizedPolicy } from "@/components/LocalizedPolicy";

export const Route = createFileRoute("/de")({ component: RouteComponent });

function RouteComponent() {
	return (
		<LocalizedPolicy
			locale="de"
			flag="🇩🇪"
			title="Beispiel auf Deutsch"
			tagline={
				<>
					Dasselbe <code className="font-mono text-xs">defineConfig()</code> wie der Rest der Demo,
					aber die Komponenten erhalten <code className="font-mono text-xs">locale="de"</code>.
					PolicyStack übersetzt die Überschriften, Tabellenkopfzeilen und DSGVO-Texte; die von Ihnen
					bereitgestellten Inhalte (Zwecke, Aufbewahrungsfristen usw.) werden unverändert
					übernommen.
				</>
			}
		/>
	);
}
