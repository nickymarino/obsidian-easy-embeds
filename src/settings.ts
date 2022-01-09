import { PluginSettingTab, App, Setting } from "obsidian";
import TwitterEmbedPlugin from "./main";

export type Theme = "light" | "dark" | "auto";
export type ContentSecurityPolicy = "on" | "off";
export type Conversation = "all" | "none";
export type Cards = "visible" | "hidden";
export type Width = BigInteger | "auto";
export type Align = "left" | "center" | "right";

export interface DropboxSettings {
	appKey: string;
}

export interface Settings {
	theme: Theme;
	csp: ContentSecurityPolicy;
	conversation: Conversation;
	cards: Cards;
	width: Width;
	align: Align;
	dropbox: DropboxSettings;
}

export const DEFAULT_SETTINGS: Settings = {
	// width and align aren't editable as a setting, but it can be overridden
	theme: "light",
	csp: "on",
	conversation: "all",
	cards: "visible",
	width: "auto",
	align: "center",
	dropbox: { appKey: "" },
};

export class TwitterEmbedSettingTab extends PluginSettingTab {
	plugin: TwitterEmbedPlugin;

	constructor(app: App, plugin: TwitterEmbedPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		this.addTwitter();
		this.addDropbox();
	}

	private addTwitter() {
		const { containerEl: parent } = this;

		parent.createEl("h2", { text: "Twitter" });

		new Setting(parent)
			.setName("Default theme")
			.setDesc('Overridden by the "theme" key in individual tweets')
			.addDropdown((dropdown) => {
				dropdown.addOption("auto", "auto");
				dropdown.addOption("light", "light");
				dropdown.addOption("dark", "dark");
				dropdown.setValue(this.plugin.settings.theme);
				dropdown.onChange(async (value) => {
					this.plugin.settings.theme = value as Theme;
					await this.plugin.saveSettings();
				});
			});

		new Setting(parent)
			.setName("Hide parent tweet")
			.setDesc(
				'Overridden by the "conversation" key in individual tweets'
			)
			.addDropdown((dropdown) => {
				dropdown.addOption("all", "no");
				dropdown.addOption("none", "yes");
				dropdown.setValue(this.plugin.settings.conversation);
				dropdown.onChange(async (value) => {
					this.plugin.settings.conversation = value as Conversation;
					await this.plugin.saveSettings();
				});
			});

		new Setting(parent)
			.setName("Hide photos, videos, and link previews")
			.setDesc('Overridden by the "cards" key in individual tweets')
			.addDropdown((dropdown) => {
				dropdown.addOption("visible", "no");
				dropdown.addOption("hidden", "yes");
				dropdown.setValue(this.plugin.settings.cards);
				dropdown.onChange(async (value) => {
					this.plugin.settings.cards = value as Cards;
					await this.plugin.saveSettings();
				});
			});

		new Setting(parent)
			.setName("Hide Content Security Policy warnings")
			.setDesc(
				"If enabled, tweets that have Content Security Policy warnings are not embedded"
			)
			.addDropdown((dropdown) => {
				dropdown.addOption("on", "on");
				dropdown.addOption("off", "off");
				dropdown.setValue(this.plugin.settings.csp);
				dropdown.onChange(async (value) => {
					this.plugin.settings.csp = value as ContentSecurityPolicy;
					await this.plugin.saveSettings();
				});
			});

		const twitterInfo = parent.createEl("p");
		twitterInfo.setAttribute("class", "setting-item-description");
		twitterInfo.appendText("See the ");
		const link = twitterInfo.createEl("a");
		link.href =
			"https://developer.twitter.com/en/docs/twitter-for-websites/webpage-properties";
		link.text = "Twitter embed documentation";
		twitterInfo.appendText(" for more information on these settings.");
	}

	private addDropbox() {
		const { containerEl: parent } = this;

		parent.createEl("h2", { text: "Dropbox" });

		new Setting(parent)
			.setName("Dropbox App Key")
			.setDesc("Create an app key")
			.addText((text) =>
				text
					.setPlaceholder("app key")
					.setValue(this.plugin.settings.dropbox.appKey)
					.onChange(async (value) => {
						this.plugin.settings.dropbox.appKey = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
