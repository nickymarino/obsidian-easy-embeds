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

		this.registerMarkdownCodeBlockProcessor('tweet', (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
			const result = this.twitter.parseCodeBlock(source)

			if (result.parseSuccessful) {
				const { ...options } = result.config
				window.twttr.ready(() => {
					window.twttr.widgets.createTweet(
						result.status,
						el,
						options
					)
				})
			} else {
				const header = "--- Twitter Embeds ERROR ---"
				const fullMessage = `${header}\n\n${result.errorMessage}`
				el.createEl('pre', {text: fullMessage})
			}
		})

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
