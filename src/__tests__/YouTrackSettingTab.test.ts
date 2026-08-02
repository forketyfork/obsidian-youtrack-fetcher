import {
	App,
	PluginManifest,
	Setting,
	SettingDefinitionControl,
	SettingDefinitionRender,
	SettingGroup,
	TextComponent,
} from "obsidian";
import YouTrackPlugin from "../main";
import YouTrackSettingTab from "../YouTrackSettingTab";

jest.mock("obsidian", () => {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Jest's runtime mock has no static module type
	const obsidianMock = jest.requireActual("../__mocks__/obsidian");
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return -- Return the mock with Jest's runtime-provided shape
	return { ...obsidianMock };
});

async function createTab(): Promise<{ plugin: YouTrackPlugin; tab: YouTrackSettingTab }> {
	const plugin = new YouTrackPlugin({} as App, {} as PluginManifest);
	await plugin.loadSettings();
	const tab = new YouTrackSettingTab(plugin.app, plugin);
	return { plugin, tab };
}

function findControl(tab: YouTrackSettingTab, key: string): SettingDefinitionControl {
	const definition = tab
		.getSettingDefinitions()
		.find((item): item is SettingDefinitionControl => "control" in item && item.control?.key === key);
	if (!definition) throw new Error(`No definition found for key "${key}"`);
	return definition;
}

function findApiTokenDefinition(tab: YouTrackSettingTab): SettingDefinitionRender {
	const definition = tab
		.getSettingDefinitions()
		.find((item): item is SettingDefinitionRender => "render" in item && item.name === "API token");
	if (!definition) throw new Error('No "API token" render definition found');
	return definition;
}

describe("YouTrackSettingTab", () => {
	test("declares controls for the plain settings fields", async () => {
		const { tab } = await createTab();

		expect(findControl(tab, "youtrackUrl").control).toMatchObject({
			type: "text",
			key: "youtrackUrl",
		});
		expect(findControl(tab, "notesFolder").control).toMatchObject({
			type: "folder",
			key: "notesFolder",
			includeRoot: true,
		});
		expect(findControl(tab, "templatePath").control).toMatchObject({
			type: "file",
			key: "templatePath",
		});
		expect(findControl(tab, "useApiToken").control).toMatchObject({
			type: "toggle",
			key: "useApiToken",
		});
	});

	test("trims a trailing slash from the YouTrack URL before persisting", async () => {
		const { plugin, tab } = await createTab();

		await tab.setControlValue("youtrackUrl", "https://example.com/");

		expect(plugin.settings.youtrackUrl).toBe("https://example.com");
	});

	test("persists other control values as-is", async () => {
		const { plugin, tab } = await createTab();

		await tab.setControlValue("notesFolder", "Archive");
		await tab.setControlValue("useApiToken", true);

		expect(plugin.settings.notesFolder).toBe("Archive");
		expect(plugin.settings.useApiToken).toBe(true);
	});

	test("calls saveSettings when a control value changes", async () => {
		const { plugin, tab } = await createTab();
		const saveSettingsSpy = jest.spyOn(plugin, "saveSettings");

		await tab.setControlValue("notesFolder", "Archive");

		expect(saveSettingsSpy).toHaveBeenCalled();
	});

	test("only shows the API token field when API token authentication is enabled", async () => {
		const { plugin, tab } = await createTab();
		const apiTokenDefinition = findApiTokenDefinition(tab);
		if (typeof apiTokenDefinition.visible !== "function") {
			throw new Error("Expected the API token definition to have a visible() predicate");
		}
		const visible = apiTokenDefinition.visible;

		plugin.settings.useApiToken = false;
		expect(visible()).toBe(false);

		plugin.settings.useApiToken = true;
		expect(visible()).toBe(true);
	});

	test("renders the API token field as a masked input and persists changes", async () => {
		const { plugin, tab } = await createTab();
		plugin.settings.apiToken = "secret-token";
		const apiTokenDefinition = findApiTokenDefinition(tab);

		const setting = new Setting(createDiv());
		apiTokenDefinition.render(setting, {} as unknown as SettingGroup);

		const text = (setting as unknown as { textComponent: TextComponent }).textComponent;
		expect(text.inputEl.type).toBe("password");
		expect(text.getValue()).toBe("secret-token");

		(text as unknown as { changeCallback: (value: string) => void }).changeCallback("new-token");

		expect(plugin.settings.apiToken).toBe("new-token");
	});
});
