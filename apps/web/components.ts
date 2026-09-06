import { defineComponents } from "blume";
import OpenPanel from "./components/OpenPanel.astro";

export default defineComponents({
	layout: { Footer: OpenPanel },
});
