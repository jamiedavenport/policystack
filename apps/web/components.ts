import { defineComponents } from "blume";
import SiteFooter from "./components/SiteFooter.astro";

export default defineComponents({
	layout: { Footer: SiteFooter },
});
