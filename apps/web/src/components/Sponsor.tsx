import { HeartIcon } from "@phosphor-icons/react";
import { Highlight } from "./Highlight";

export function Sponsor({ index }: { index: string }) {
	return (
		<section className="border-b-2 border-black last:border-b-0">
			<div className="mx-auto max-w-6xl px-8 py-32 md:py-40">
				<div className="flex items-center gap-4 text-xs tracking-wide text-mute uppercase">
					<span className="text-ink">[{index}]</span>
					<span className="h-0.5 w-10 bg-black" aria-hidden="true" />
					<span>sponsor</span>
				</div>
				<div className="mt-16 grid gap-16 md:grid-cols-[1.2fr_1fr] md:items-end">
					<div>
						<h2 className="max-w-[24ch] text-3xl font-medium tracking-tight text-balance md:text-4xl">
							Keep the core <Highlight>free, forever.</Highlight>
						</h2>
						<p className="mt-8 max-w-[55ch] text-pretty text-mute">
							PolicyStack Consent and PolicyStack are Apache-2.0 and will stay that way — no
							relicensing, no features held back behind a cloud tier. Sponsorship pays for the time
							it takes to keep both repos maintained, audited, and worth depending on.
						</p>
					</div>
					<div className="md:ml-auto">
						<a
							href="https://github.com/sponsors/jamiedavenport"
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-2.5 border-2 border-black bg-black px-6 py-3.5 text-sm tracking-wide text-white uppercase hover:bg-white hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
						>
							<HeartIcon weight="fill" className="size-4 shrink-0" aria-hidden="true" />
							sponsor on github
						</a>
					</div>
				</div>
			</div>
		</section>
	);
}
