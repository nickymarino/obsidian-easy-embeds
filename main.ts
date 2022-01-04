import { App, Plugin, MarkdownPostProcessorContext, PluginManifest } from 'obsidian';
import TwitterEmbed from 'twitter';


export default class TwitterEmbedsPlugin extends Plugin {

	twitter: TwitterEmbed

	constructor(app: App, manifest: PluginManifest) {
		super(app, manifest);

		this.twitter = new TwitterEmbed()
	}

	async onload() {
		this.twitter.load()

		this.registerMarkdownPostProcessor((el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
			this.twitter.render()
		});

	}

	onunload() {

	}

}
