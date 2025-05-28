import { App, PluginSettingTab, Setting } from "obsidian";
import type YouTrackPlugin from "./YouTrackPlugin";
export default class YouTrackSettingTab extends PluginSettingTab {
	plugin: YouTrackPlugin;

	constructor(app: App, plugin: YouTrackPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("YouTrack URL")
			.setDesc("URL of your YouTrack installation (e.g., https://youtrack.jetbrains.com)")
			.addText(text =>
				text.setValue(this.plugin.settings.youtrackUrl).onChange(async value => {
					// Remove trailing slash if present
					this.plugin.settings.youtrackUrl = value.replace(/\/$/, "");
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("Notes folder")
			.setDesc("Folder to store YouTrack issue notes (leave empty for vault root)")
			.addText(text =>
				text
					.setPlaceholder("YouTrack")
					.setValue(this.plugin.settings.notesFolder)
					.onChange(async value => {
						this.plugin.settings.notesFolder = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Note template")
			.setDesc(
				"Path to a template file in your vault. Use ${id}, ${title}, ${url} and any issue fields as placeholders (leave empty for default template). You can also use arbitrarily nested fields, e.g., ${reporter.manager.fullName}."
			)
			.addText(text =>
				text
					.setPlaceholder("Template path")
					.setValue(this.plugin.settings.templatePath)
					.onChange(async value => {
						this.plugin.settings.templatePath = value;
						await this.plugin.saveSettings();
					})
			)
			.addExtraButton(button =>
				button.setIcon("help").onClick(() => {
					const helpUrl = "https://www.jetbrains.com/help/youtrack/devportal/api-entity-Issue.html";
					window.open(helpUrl, "_blank");
				})
			);

		new Setting(containerEl)
			.setName("Use API token authentication")
			.setDesc("Enable to use a permanent API token for authentication")
			.addToggle(toggle =>
				toggle.setValue(this.plugin.settings.useApiToken).onChange(async value => {
					this.plugin.settings.useApiToken = value;
					await this.plugin.saveSettings();
					this.display(); // Refresh to show/hide token field
				})
			);

		if (this.plugin.settings.useApiToken) {
			new Setting(containerEl)
				.setName("API token")
				.setDesc("Permanent API token for YouTrack authentication")
				.addText(text =>
					text
						.setPlaceholder("Enter your API token")
						.setValue(this.plugin.settings.apiToken)
						.onChange(async value => {
							this.plugin.settings.apiToken = value;
							await this.plugin.saveSettings();
						})
				)
				.addExtraButton(button =>
					button.setIcon("help").onClick(() => {
						// Open YouTrack help page in browser
						const helpUrl = "https://www.jetbrains.com/help/youtrack/server/manage-permanent-token.html";
						window.open(helpUrl, "_blank");
					})
				);
		}
	}
}
