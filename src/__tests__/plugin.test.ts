import YouTrackPlugin from "../main";
import { App, PluginManifest, requestUrl } from "obsidian";

jest.mock("obsidian", () => {
	const obsidianMock = jest.requireActual("../__mocks__/obsidian");
	return {
		...obsidianMock,
		requestUrl: jest.fn(),
	};
});

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

	describe("searchIssues", () => {
		it("should return issues on successful API call", async () => {
			const mockIssues = [{ idReadable: "TEST-1", summary: "Test issue" }];
			(requestUrl as jest.Mock).mockResolvedValue({
				status: 200,
				json: Promise.resolve(mockIssues),
			});

			const result = await plugin.searchIssues("test query", 10, 0);
			expect(result).toEqual(mockIssues);
			expect(requestUrl).toHaveBeenCalledWith(
				expect.objectContaining({
					url: "https://youtrack.jetbrains.com/api/issues?query=test%20query&fields=idReadable,summary,customFields(name,value(name))&$top=10&$skip=0",
				})
			);
		});

		it("should throw an error on API failure", async () => {
			(requestUrl as jest.Mock).mockResolvedValue({
				status: 500,
				text: "Internal Server Error",
			});

			await expect(plugin.searchIssues("test query", 10, 0)).rejects.toThrow(
				"Error searching issues: Internal Server Error (500)"
			);
		});
	});
});
