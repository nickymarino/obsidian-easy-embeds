import { App, Plugin, MarkdownPostProcessorContext, PluginManifest, PluginSettingTab, Setting } from 'obsidian';
import TwitterEmbed from 'twitter';
import { TwitterEmbedSettings, TwitterEmbedSettingTab, DEFAULT_SETTINGS } from 'settings'



export default class TwitterEmbedPlugin extends Plugin {

	twitter: TwitterEmbed
	settings: TwitterEmbedSettings

	constructor(app: App, manifest: PluginManifest) {
		super(app, manifest);

		this.twitter = new TwitterEmbed()
	}

	async onload() {
		await this.loadSettings()

		this.twitter.load()

		this.registerMarkdownPostProcessor((el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
			this.twitter.render()
		});

		this.addSettingTab(new TwitterEmbedSettingTab(this.app, this))

	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
	}

	async saveSettings() {
		await this.saveData(this.settings)
	}

}
