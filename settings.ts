import TwitterEmbedPlugin from "main";
import { PluginSettingTab, App, Setting } from "obsidian";

export interface TwitterEmbedSettings {
	mySetting: string
}


export const DEFAULT_SETTINGS: TwitterEmbedSettings = {
	mySetting: 'default'
}

export class TwitterEmbedSettingTab extends PluginSettingTab {
	plugin: TwitterEmbedPlugin

	constructor(app: App, plugin: TwitterEmbedPlugin) {
		super(app, plugin)
		this.plugin = plugin
	}

	display(): void {
		const {containerEl} = this

		containerEl.empty();

		containerEl.createEl('h2', {text: 'settings!'})

		new Setting(containerEl)
			.setName('setting 1')
			.setDesc('my desc')
			.addText(text => text
				.setPlaceholder('placehodler')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					console.log('secret: ' + value)
					this.plugin.settings.mySetting = value
					await this.plugin.saveSettings()
				})
			)
	}
}