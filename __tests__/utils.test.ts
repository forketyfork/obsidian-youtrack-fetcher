import YouTrackPlugin from "../YouTrackPlugin";
import { App, PluginManifest } from "obsidian";

describe("YouTrackPlugin Utils", () => {
	let plugin: YouTrackPlugin;

	beforeEach(async () => {
		plugin = new YouTrackPlugin({} as App, {} as PluginManifest);
		// Set fixed locale and time zone for stable tests
		plugin.dateTimeOptions = {
			locale: "en-US",
			timeZone: "UTC",
		};
		await plugin.onload();
	});

	describe("parseFieldMapFromTemplate", () => {
		test("should return empty object for template without fields", () => {
			const template = "# ${id}\nURL: ${url}";
			const result = plugin.parseFieldMapFromTemplate(template);
			expect(result).toEqual({});
		});

		test("should collect unique fields", () => {
			const template = "${created} ${updated} ${created}";
			const result = plugin.parseFieldMapFromTemplate(template);
			expect(result).toEqual({ created: new Set(), updated: new Set() });
		});

		it("extracts simple fields", () => {
			const template = "ID: ${id}, Title: ${title}, URL: ${url}, Desc: ${description}";
			expect(Object.keys(plugin.parseFieldMapFromTemplate(template)).sort()).toEqual(["description", "summary"]);
		});

		it("extracts root of nested fields", () => {
			const template = "Reporter: ${reporter.fullName}, Assignee: ${assignee.login}";
			expect(Object.keys(plugin.parseFieldMapFromTemplate(template)).sort()).toEqual(["assignee", "reporter"]);
		});

		it("ignores id and url", () => {
			const template = "${id} ${url} ${created}";
			expect(plugin.parseFieldMapFromTemplate(template)).toEqual({ created: new Set() });
		});

		it("handles duplicate and whitespace", () => {
			const template = "${reporter.fullName} ${reporter .email} ${reporter}";
			expect(plugin.parseFieldMapFromTemplate(template)).toEqual({ reporter: new Set(["fullName", "email"]) });
		});

		it("maps title to summary", () => {
			const template = "${title} ${summary}";
			expect(Object.keys(plugin.parseFieldMapFromTemplate(template))).toEqual(["summary"]);
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

	describe("parseFieldMapFromTemplate & buildYouTrackFieldsQuery", () => {
		it("should handle simple and nested fields", () => {
			const template =
				"ID: ${id}, Title: ${title}, Desc: ${description}, Reporter: ${reporter.fullName}, Assignee: ${assignee.login}";
			const fieldMap = plugin.parseFieldMapFromTemplate(template);
			// Should group nested fields under their root
			expect(fieldMap).toEqual({
				description: new Set(),
				reporter: new Set(["fullName"]),
				assignee: new Set(["login"]),
				summary: new Set(),
			});
			const query = plugin.buildYouTrackFieldsQuery(fieldMap);
			// Order may vary, so check for all required parts
			expect(query).toContain("reporter(fullName)");
			expect(query).toContain("assignee(login)");
			expect(query).toContain("summary");
			expect(query).toContain("description");
		});

		it("should deduplicate nested fields and ignore id/url", () => {
			const template = "${id} ${url} ${reporter.fullName} ${reporter.email} ${reporter}";
			const fieldMap = plugin.parseFieldMapFromTemplate(template);
			expect(fieldMap).toEqual({
				reporter: new Set(["fullName", "email"]),
			});
			const query = plugin.buildYouTrackFieldsQuery(fieldMap);
			expect(query).toBe("reporter(fullName,email)");
		});

		it("should support multiple roots and no nested fields", () => {
			const template = "${created} ${updated} ${summary}";
			const fieldMap = plugin.parseFieldMapFromTemplate(template);
			expect(fieldMap).toEqual({
				created: new Set(),
				updated: new Set(),
				summary: new Set(),
			});
			const query = plugin.buildYouTrackFieldsQuery(fieldMap);
			expect(query).toContain("created");
			expect(query).toContain("updated");
			expect(query).toContain("summary");
		});
	});
});
