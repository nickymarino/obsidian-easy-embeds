import { UITheme } from "src/main";
import { Settings } from "src/settings";

export default interface Embedder {
	canAddEmbed(url: string): boolean;
	addEmbed(
		parent: HTMLElement,
		url: string,
		uiTheme?: UITheme,
		settings?: Settings
	): void;
}
