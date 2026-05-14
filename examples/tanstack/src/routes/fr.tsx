import { createFileRoute } from "@tanstack/react-router";
import { LocalizedPolicy } from "@/components/LocalizedPolicy";

export const Route = createFileRoute("/fr")({ component: RouteComponent });

function RouteComponent() {
	return (
		<LocalizedPolicy
			locale="fr"
			flag="🇫🇷"
			title="Exemple en français"
			tagline={
				<>
					Même <code className="font-mono text-xs">defineConfig()</code> que le reste de la démo,
					mais les composants reçoivent <code className="font-mono text-xs">locale="fr"</code>.
					OpenPolicy traduit les intitulés, les en-têtes de tableaux et les textes RGPD ; les
					chaînes que vous fournissez (finalités, durées de conservation, etc.) sont rendues telles
					quelles.
				</>
			}
		/>
	);
}
