import { createFileRoute } from "@tanstack/react-router";
import { LocalizedPolicy } from "@/components/LocalizedPolicy";

export const Route = createFileRoute("/nl")({ component: RouteComponent });

function RouteComponent() {
	return (
		<LocalizedPolicy
			locale="nl"
			flag="🇳🇱"
			title="Voorbeeld in het Nederlands"
			tagline={
				<>
					Dezelfde <code className="font-mono text-xs">defineConfig()</code> als de rest van de
					demo, maar de componenten krijgen <code className="font-mono text-xs">locale="nl"</code>.
					OpenPolicy vertaalt de koppen, tabelheaders en AVG-teksten; de inhoud die u zelf aanlevert
					(doeleinden, bewaartermijnen, enz.) wordt onveranderd weergegeven.
				</>
			}
		/>
	);
}
