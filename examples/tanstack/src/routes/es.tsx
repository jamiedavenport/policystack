import { createFileRoute } from "@tanstack/react-router";
import { LocalizedPolicy } from "@/components/LocalizedPolicy";

export const Route = createFileRoute("/es")({ component: RouteComponent });

function RouteComponent() {
	return (
		<LocalizedPolicy
			locale="es"
			flag="🇪🇸"
			title="Ejemplo en español"
			tagline={
				<>
					El mismo <code className="font-mono text-xs">defineConfig()</code> que el resto de la
					demo, pero los componentes reciben <code className="font-mono text-xs">locale="es"</code>.
					PolicyStack traduce los encabezados, las cabeceras de las tablas y los textos del RGPD; el
					contenido que usted aporta (finalidades, plazos de conservación, etc.) se muestra tal
					cual.
				</>
			}
		/>
	);
}
