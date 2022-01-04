import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, MarkdownPostProcessorContext, MarkdownPostProcessor } from 'obsidian';


declare global {
	interface Window {
		twttr: any
	}
}


export default class TwitterEmbedsPlugin extends Plugin {

	async onload() {
		console.log("loading! hi :)")

		this.loadTwitterIfNotAlreadyLoaded()
		this.registerMarkdownPostProcessor(async (el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
			await this.renderTwitterWidgets()
		});

	}

	onunload() {

	}

	private loadTwitterIfNotAlreadyLoaded() {
		// https://developer.twitter.com/en/docs/twitter-for-websites/javascript-api/guides/set-up-twitter-for-websites
		window.twttr = (function (d, s, id) {
			var js, fjs = d.getElementsByTagName(s)[0],
				t = window.twttr || {};
			if (d.getElementById(id)) return t;
			js = d.createElement(s);
			js.id = id;
			js.src = "https://platform.twitter.com/widgets.js";
			fjs.parentNode.insertBefore(js, fjs);

			t._e = [];
			t.ready = function (f) {
				t._e.push(f);
			};

			console.log("hello, I'm loading the widget")

			return t;
		}(document, "script", "twitter-wjs"));
	}

	private renderTwitterWidgets() {
		window.twttr.widgets.load()
	}

}
