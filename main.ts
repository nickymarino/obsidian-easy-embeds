import { App, Plugin, MarkdownPostProcessorContext, PluginManifest, PluginSettingTab, Setting, MarkdownView } from 'obsidian';
import TwitterEmbed from 'twitter';
import { Settings, TwitterEmbedSettingTab, DEFAULT_SETTINGS } from 'settings'


export type UITheme = 'light' | 'dark'


export default class TwitterEmbedPlugin extends Plugin {

	twitter: TwitterEmbed
	settings: Settings

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
			const uiTheme: UITheme = document.body.classList.contains('theme-dark') ? 'dark' : 'light'
			const result = this.twitter.parseCodeBlock(source, this.settings, uiTheme)

			if (result.parseSuccessful) {
				const { ...options } = result.options
				console.log('align: ' + options.align)
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
				const findTheme = /theme\=(dark|light)/
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
