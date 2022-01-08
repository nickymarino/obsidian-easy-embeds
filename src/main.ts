import { App, Plugin, MarkdownPostProcessorContext, PluginManifest, MarkdownView } from 'obsidian';
import TwitterEmbedder from './twitter';
import { Settings, TwitterEmbedSettingTab, DEFAULT_SETTINGS } from './settings'
import DropboxEmbedder from './dropbox';
import { buildEmbedderExtension } from 'src/live-editor-extension';
import AppleMusicEmbedder from './apple-music';
import SpotifyEmbedder from './spotify';


export type UITheme = 'light' | 'dark'


export default class TwitterEmbedPlugin extends Plugin {

	twitter: TwitterEmbedder
	dropbox: DropboxEmbedder
	apple: AppleMusicEmbedder
	spotify: SpotifyEmbedder
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

		const liveEditorEmbedders = [
			this.twitter,
			this.dropbox,
			this.apple,
			this.spotify

		]
		this.registerEditorExtension(buildEmbedderExtension(liveEditorEmbedders))

		this.registerMarkdownPostProcessor((el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
			const uiTheme: UITheme = document.body.classList.contains('theme-dark') ? 'dark' : 'light'
			const lin2 = el.querySelectorAll('img') as NodeListOf<HTMLImageElement>
			lin2.forEach(img => {
				if (this.dropbox.canCreateEmbed(img)) {
					const link = img.src
					const embedContainer = img.parentNode.createDiv({title: img.alt})
					this.dropbox.addEmbed(embedContainer, link)
					img.parentNode.replaceChild(embedContainer, img)
				}

				if (this.twitter.canAddEmbed(img.src)) {
					const url = img.src
					const options = this.twitter.overrideOptions(this.settings, {}, uiTheme)
					const embedContainer = img.parentNode.createDiv()

					img.parentNode.removeChild(img)
					this.twitter.addEmbedToCodeBlock(embedContainer, url, options)
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

		this.registerEvent(this.app.workspace.on('css-change', () => {
			if (!(this.settings.theme === 'auto')) {
				return
			}

			const tweetIframes = document.querySelectorAll(".twitter-tweet.twitter-tweet-rendered iframe") as NodeListOf<HTMLIFrameElement>

			const currentTheme = document.body.classList.contains('theme-dark') ? 'dark' : 'light'

			tweetIframes.forEach((iframe) => {
				const findTheme = /theme=(dark|light)/
				const replaceTheme = `theme=${currentTheme}`
				iframe.src.replace(findTheme, replaceTheme)
			})
		}))
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
