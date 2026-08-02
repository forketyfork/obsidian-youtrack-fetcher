import { App, PluginSettingTab, Setting, SettingDefinitionItem } from "obsidian";
import type YouTrackPlugin from "./YouTrackPlugin";

export default class YouTrackSettingTab extends PluginSettingTab {
	plugin: YouTrackPlugin;

	constructor(app: App, plugin: YouTrackPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	getSettingDefinitions(): SettingDefinitionItem[] {
		return [
			{
				name: "YouTrack URL",
				desc: "URL of your YouTrack installation (e.g., https://youtrack.jetbrains.com)",
				control: {
					type: "text",
					key: "youtrackUrl",
					placeholder: "https://youtrack.jetbrains.com",
				},
			},
			{
				name: "Notes folder",
				desc: "Folder to store YouTrack issue notes (leave empty for vault root)",
				control: {
					type: "folder",
					key: "notesFolder",
					placeholder: "YouTrack",
					includeRoot: true,
				},
			},
			{
				name: "Note template",
				desc:
					"Path to a template file in your vault. Use ${id}, ${title}, ${url} and any issue fields as " +
					"placeholders (leave empty for default template). You can also use arbitrarily nested fields, " +
					"e.g. ${project.team.name}. See " +
					"https://www.jetbrains.com/help/youtrack/devportal/api-entity-Issue.html for available fields.",
				control: {
					type: "file",
					key: "templatePath",
					placeholder: "Template path",
				},
			},
			{
				name: "Use API token authentication",
				desc: "Enable to use a permanent API token for authentication",
				control: {
					type: "toggle",
					key: "useApiToken",
				},
			},
			{
				name: "API token",
				desc:
					"Permanent API token for YouTrack authentication. See " +
					"https://www.jetbrains.com/help/youtrack/server/manage-permanent-token.html for how to create one.",
				visible: () => this.plugin.settings.useApiToken,
				render: (setting: Setting) => {
					setting.addText(text => {
						text.inputEl.type = "password";
						text
							.setPlaceholder("Enter your API token")
							.setValue(this.plugin.settings.apiToken)
							.onChange(value => {
								this.plugin.settings.apiToken = value;
								void this.plugin.saveSettings();
							});
					});
				},
			},
		];
	}

	setControlValue(key: string, value: unknown): void | Promise<void> {
		const settings = this.plugin.settings as unknown as Record<string, unknown>;
		settings[key] = key === "youtrackUrl" && typeof value === "string" ? value.replace(/\/$/, "") : value;
		return this.plugin.saveSettings();
	}
}
