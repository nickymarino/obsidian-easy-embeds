import { App, Plugin, MarkdownPostProcessorContext, PluginManifest, MarkdownView, Notice } from 'obsidian';
import TwitterEmbedder from 'twitter';
import { Settings, TwitterEmbedSettingTab, DEFAULT_SETTINGS } from 'settings'
import { logging } from 'logging'
import DropboxEmbedder from 'dropbox';
import { buildEmbedderExtension } from 'live-editor-extension';


logging.configure({ minLevels: { '': 'debug' } }).registerConsoleLogger()
const logger = logging.getLogger('main')

export type UITheme = 'light' | 'dark'


export default class TwitterEmbedPlugin extends Plugin {

	twitter: TwitterEmbedder
	dropbox: DropboxEmbedder
	settings: Settings

	constructor(app: App, manifest: PluginManifest) {
		super(app, manifest);

		this.twitter = new TwitterEmbedder()
		this.dropbox = new DropboxEmbedder()
	}

	async onload() {
		logger.info('Welcome to obsidian-twitter-embeds plugin!')

		await this.loadSettings()

		this.twitter.load()
		this.dropbox.load(this.settings.dropbox.appKey)

		this.registerEditorExtension(buildEmbedderExtension())

		this.registerMarkdownPostProcessor((el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
			const uiTheme: UITheme = document.body.classList.contains('theme-dark') ? 'dark' : 'light'
			logger.info('called!')
			const lin2 = el.querySelectorAll('img') as NodeListOf<HTMLImageElement>
			lin2.forEach(img => {
				if (this.dropbox.canCreateEmbed(img)) {
					const link = img.src
					const embedContainer = img.parentNode.createDiv({title: img.alt})
					this.dropbox.addEmbed(embedContainer, link)
					img.parentNode.replaceChild(embedContainer, img)
				}

				if (this.twitter.canCreateEmbed(img)) {
					const url = img.src
					const options = this.twitter.overrideOptions(this.settings, {}, uiTheme)
					const embedContainer = img.parentNode.createDiv()
					// TODO: figure out whether to fix the img not getting replaced by twitter, or be ok
					// with twitter and dropbox getting handled differently
					// this.twitter.addEmbed(embedContainer, url, options)
					//
					// personally, I recommend moving the img to an ahref, then adding the tweet below the ahref
					img.parentNode.removeChild(img)
					this.twitter.addEmbed(embedContainer, url, options)
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
