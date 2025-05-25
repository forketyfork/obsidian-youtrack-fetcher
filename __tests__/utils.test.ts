import YouTrackPlugin from "../main";
import { App, PluginManifest } from "obsidian";

describe("YouTrackPlugin Utils", () => {
	let plugin: YouTrackPlugin;

	beforeEach(() => {
		plugin = new YouTrackPlugin({} as App, {} as PluginManifest);
		// Set fixed locale and time zone for stable tests
		plugin.dateTimeOptions = {
			locale: "en-US",
			timeZone: "UTC",
		};
	});

	describe("parseFieldListFromTemplate", () => {
		test("should return empty list for template without fields", () => {
			const template = "# ${id}\nURL: ${url}";
			const result = plugin.parseFieldListFromTemplate(template);
			expect(result).toEqual([]);
		});

		test("should collect unique fields", () => {
			const template = "${created} ${updated} ${created}";
			const result = plugin.parseFieldListFromTemplate(template);
			expect(result).toEqual(["created", "updated"]);
		});

		test("should map title to summary and ignore id and url", () => {
			const template = "# ${id}: ${title} (${url})";
			const result = plugin.parseFieldListFromTemplate(template);
			expect(result).toEqual(["summary"]);
		});
	});

	describe("formatTimestamp", () => {
		test("should format valid timestamp number", () => {
			const timestamp = 1672531200000; // Jan 1, 2023, 00:00:00 UTC
			const result = plugin.formatTimestamp(timestamp);

			expect(result).toBe("1/1/2023, 12:00:00 AM");
		});

		test("should format valid timestamp string", () => {
			const timestamp = "2023-01-01T12:00:00.000Z";
			const result = plugin.formatTimestamp(timestamp);

			expect(result).toBe("1/1/2023, 12:00:00 PM");
		});

		test("should return original value for invalid timestamp", () => {
			const invalidTimestamp = "not-a-date";
			const result = plugin.formatTimestamp(invalidTimestamp);

			expect(result).toBe("not-a-date");
		});
	});

	describe("parseIssueId", () => {
		beforeEach(async () => {
			await plugin.loadSettings();
			plugin.settings.youtrackUrl = "https://youtrack.jetbrains.com";
		});

		test("should return ID when input is plain ID", () => {
			expect(plugin.parseIssueId("ABC-1")).toBe("ABC-1");
		});

		test("should extract ID from matching URL", () => {
			const url = "https://youtrack.jetbrains.com/issue/ABC-1";
			expect(plugin.parseIssueId(url)).toBe("ABC-1");
		});

		test("should extract ID from URL with slug", () => {
			const url = "https://youtrack.jetbrains.com/issue/RDO-3506/Typescript-basic-pages";
			expect(plugin.parseIssueId(url)).toBe("RDO-3506");
		});

		test("should return null for mismatched URL", () => {
			const url = "https://other.com/issue/ABC-1";
			expect(plugin.parseIssueId(url)).toBeNull();
		});

		test("should return null for invalid ID format", () => {
			expect(plugin.parseIssueId("ABC123")).toBeNull();
		});
	});
});
