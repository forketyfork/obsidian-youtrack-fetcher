import YouTrackPlugin from "../main";
import { App, PluginManifest } from "obsidian";

describe("YouTrackPlugin", () => {
	let plugin: YouTrackPlugin;

	beforeEach(async () => {
		plugin = new YouTrackPlugin({} as App, {} as PluginManifest);
		await plugin.onload();
	});

	test("plugin loads with default settings", async () => {
		await plugin.loadSettings();

		expect(plugin.settings).toBeDefined();
		expect(plugin.settings.youtrackUrl).toBe("https://youtrack.jetbrains.com");
		expect(plugin.settings.apiToken).toBe("");
		expect(plugin.settings.useApiToken).toBe(false);
		expect(plugin.settings.notesFolder).toBe("YouTrack");
		expect(plugin.settings.templatePath).toBe("");
	});
});
