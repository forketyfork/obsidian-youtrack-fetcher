import YouTrackPlugin from "../main";
import { App, PluginManifest, requestUrl } from "obsidian";

jest.mock("obsidian", () => {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Jest's runtime mock has no static module type
	const obsidianMock = jest.requireActual("../__mocks__/obsidian");
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return -- Return the mock with Jest's runtime-provided shape
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

	describe("getIssuesCount", () => {
		it("should return issue count on successful API call", async () => {
			(requestUrl as jest.Mock).mockResolvedValue({
				status: 200,
				json: Promise.resolve({ count: 42 }),
			});

			const result = await plugin.getIssuesCount("test query");
			expect(result).toBe(42);
			expect(requestUrl).toHaveBeenCalledWith(
				expect.objectContaining({
					url: "https://youtrack.jetbrains.com/api/issuesGetter/count?fields=count",
					method: "POST",
					body: JSON.stringify({ query: "test query" }),
				})
			);
		});

		it("should throw an error on API failure", async () => {
			(requestUrl as jest.Mock).mockResolvedValue({
				status: 500,
				text: "Internal Server Error",
			});

			await expect(plugin.getIssuesCount("test query")).rejects.toThrow(
				"Error getting issues count: Internal Server Error (500)"
			);
		});

		it("should poll while YouTrack returns -1 and resolve when the count is ready", async () => {
			plugin.issuesCountPollDelayMs = 0;
			(requestUrl as jest.Mock).mockReset();
			(requestUrl as jest.Mock)
				.mockResolvedValueOnce({ status: 200, json: Promise.resolve({ count: -1 }) })
				.mockResolvedValueOnce({ status: 200, json: Promise.resolve({ count: -1 }) })
				.mockResolvedValueOnce({ status: 200, json: Promise.resolve({ count: 137 }) });

			const result = await plugin.getIssuesCount("fresh filter");

			expect(result).toBe(137);
			expect(requestUrl).toHaveBeenCalledTimes(3);
		});

		it("should fail with a timeout error if the count stays -1", async () => {
			plugin.issuesCountPollDelayMs = 0;
			plugin.issuesCountPollMaxAttempts = 4;
			(requestUrl as jest.Mock).mockReset();
			(requestUrl as jest.Mock).mockResolvedValue({
				status: 200,
				json: Promise.resolve({ count: -1 }),
			});

			await expect(plugin.getIssuesCount("stuck filter")).rejects.toThrow(
				"Timed out waiting for YouTrack to compute the issue count"
			);
			expect(requestUrl).toHaveBeenCalledTimes(4);
		});
	});
});
