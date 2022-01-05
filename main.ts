import { App, Plugin, MarkdownPostProcessorContext, PluginManifest, MarkdownView, Notice } from 'obsidian';
import TwitterEmbedder from 'twitter';
import { Settings, TwitterEmbedSettingTab, DEFAULT_SETTINGS } from 'settings'
import { logging } from 'logging'
import DropboxEmbedder from 'dropbox';


logging.configure({ minLevels: { '': 'debug' } }).registerConsoleLogger()
const logger = logging.getLogger('obsidian-twitter-embeds.main')

export type UITheme = 'light' | 'dark'


const AUTO_EMBED_RAW_URLS = true
const AUTO_EMBED_LINKS = true




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


		this.registerMarkdownPostProcessor((el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
			logger.info('called!')
			const lin2 = el.querySelectorAll('a.external-link') as NodeListOf<HTMLAnchorElement>
			lin2.forEach(linkEl => {
				logger.debug('link ' + linkEl.href)
				if (linkEl.href.contains('dropbox.com')) {
					logger.debug('has dropbox')

					console.log(window.Dropbox)
					console.log(window.Dropbox.appKey)
					const cont = el.createDiv()
					cont.setAttribute('style', 'height: 300px')
					setTimeout(() => {
						logger.debug('doing the timeout')
						window.Dropbox.embed({ link: linkEl.href }, cont)
					}, 1000)

				}
			})
		})

		this.registerMarkdownPostProcessor((el: HTMLElement, ctx: MarkdownPostProcessorContext) => {


			const uiTheme: UITheme = document.body.classList.contains('theme-dark') ? 'dark' : 'light'

			const addTweet = (status, options) => {
				window.twttr.ready(() => {
					window.twttr.widgets.createTweet(
						status,
						el,
						options
					)
				})
			}

			const links = el.querySelectorAll('a.external-link') as NodeListOf<HTMLAnchorElement>
			links.forEach(linkEl => {
				if ((linkEl.innerText.length > 0) && (!AUTO_EMBED_LINKS)) {
					return
				}
				if ((linkEl.innerText.length === 0) && (!AUTO_EMBED_RAW_URLS)) {
					return
				}

				logger.debug('found ahref: ' + linkEl)
				const status = this.twitter.parseStatusIDFromUrl(linkEl.href)
				const options = this.twitter.overrideOptions(this.settings, {}, uiTheme)
				addTweet(status, options)
			})

			logger.info('rendering post process')
			this.twitter.render()
		});

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
