import YouTrackPlugin from "../main";

describe("YouTrackPlugin", () => {
	let plugin: YouTrackPlugin;

	beforeEach(() => {
		plugin = new YouTrackPlugin({} as any, {} as any);
	});

	test("plugin loads with default settings", async () => {
		await plugin.loadSettings();

		expect(plugin.settings).toBeDefined();
		expect(plugin.settings.youtrackUrl).toBe("https://youtrack.jetbrains.com");
		expect(plugin.settings.apiToken).toBe("");
		expect(plugin.settings.useApiToken).toBe(false);
		expect(plugin.settings.notesFolder).toBe("YouTrack");
		expect(plugin.settings.templatePath).toBe("");
		expect(plugin.settings.fields).toBe("summary,description");
	});
});
