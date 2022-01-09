import { App, Plugin, MarkdownPostProcessorContext, PluginManifest, MarkdownView } from 'obsidian';
import TwitterEmbedder from './embeds/twitter';
import { Settings, TwitterEmbedSettingTab, DEFAULT_SETTINGS } from './settings'
import DropboxEmbedder from './embeds/dropbox';
import { buildEmbedderExtension } from 'src/live-editor-extension';
import AppleMusicEmbedder from './embeds/apple-music';
import SpotifyEmbedder from './embeds/spotify';
import YoutubeEmbedder from './embeds/youtube';


export type UITheme = 'light' | 'dark'


export default class TwitterEmbedPlugin extends Plugin {

	twitter: TwitterEmbedder
	dropbox: DropboxEmbedder
	apple: AppleMusicEmbedder
	spotify: SpotifyEmbedder
	youtube: YoutubeEmbedder

	settings: Settings

	constructor(app: App, manifest: PluginManifest) {
		super(app, manifest);

	}

	async onload() {
		await this.loadSettings()

		this.twitter = new TwitterEmbedder()
		this.dropbox = new DropboxEmbedder(this.settings.dropbox.appKey)
		this.apple = new AppleMusicEmbedder()
		this.spotify = new SpotifyEmbedder()
		this.youtube = new YoutubeEmbedder()

		const liveEditorEmbedders = [
			this.twitter,
			this.dropbox,
			this.apple,
			this.spotify,
			this.youtube
		]
		this.registerEditorExtension(buildEmbedderExtension(liveEditorEmbedders))

		this.registerMarkdownPostProcessor((el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
			const uiTheme: UITheme = document.body.classList.contains('theme-dark') ? 'dark' : 'light'

			el.querySelectorAll('a.external-link').forEach((anchor: HTMLAnchorElement) => {
				const link = anchor.href

				if (this.dropbox.canAddEmbed(link)) {
					const embedContainer = el.createDiv()
					embedContainer.setAttribute('class', 'easy-embed easy-embed-dropbox')
					this.dropbox.addEmbed(embedContainer, link)

				} else if (this.twitter.canAddEmbed(link)) {
					const embedContainer = el.createDiv()
					embedContainer.setAttribute('class', 'embed-container easy-embed-twitter')
					const options = this.twitter.overrideOptions(this.settings, {}, uiTheme)
					this.twitter.addEmbedToCodeBlock(embedContainer, link, options)
				}
			})
		})

		this.registerMarkdownCodeBlockProcessor('tweet', (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
			const uiTheme: UITheme = document.body.classList.contains('theme-dark') ? 'dark' : 'light'
			const result = this.twitter.parseCodeBlock(source, this.settings, uiTheme)

			if (result.parseSuccessful) {
				const { ...options } = result.options
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
				el.createEl('pre', { text: fullMessage })
			}
		})

		this.addSettingTab(new TwitterEmbedSettingTab(this.app, this))
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())

		const theme = this.app.workspace.containerEl.createEl('meta')
		theme.setAttribute('name', 'twitter:widgets:theme')
		theme.setAttribute('content', this.settings.theme)

		const csp = this.app.workspace.containerEl.createEl('meta')
		csp.setAttribute('name', 'twitter:widgets:csp')
		csp.setAttribute('content', this.settings.csp)
	}

	async saveSettings() {
		await this.saveData(this.settings)
		this.app.workspace.getActiveViewOfType(MarkdownView).previewMode?.rerender(true)
	}



}
