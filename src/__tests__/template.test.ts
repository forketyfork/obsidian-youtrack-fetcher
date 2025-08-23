import YouTrackPlugin from "../YouTrackPlugin";
import { App, PluginManifest } from "obsidian";

describe("YouTrackPlugin Template Rendering", () => {
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

	describe("renderTemplate", () => {
		test("should render template with all issue fields", () => {
			plugin.settings = {
				youtrackUrl: "",
				apiToken: "",
				useApiToken: false,
				notesFolder: "",
				templatePath: "",
				queryHistory: [],
			};

			// Sample YouTrack issue data
			const issueData = {
				updated: 1747897912849,
				created: 1747022140643,
				description: "Description of the issue",
				idReadable: "ABC-123",
				summary: "Summary of the issue",
				resolved: 1747821038297,
				$type: "Issue",
			};

			// Create a template that uses all fields
			const template = `# \${id}: \${title}

## Issue Details
- Created: \${created}
- Updated: \${updated}
- Resolved: \${resolved}

## Description
\${description}

## YouTrack ID: [\${id}](\${url})
`;

			const fields = Object.keys(plugin.parseFieldMapFromTemplate(template));

			// Render the template
			const result = plugin.renderTemplate(
				template,
				"ABC-123",
				"https://youtrack.jetbrains.com/issue/ABC-123",
				issueData,
				fields
			);

			// Expected result
			const expected = `# ABC-123: Summary of the issue

## Issue Details
- Created: 5/12/2025, 3:55:40 AM
- Updated: 5/22/2025, 7:11:52 AM
- Resolved: 5/21/2025, 9:50:38 AM

## Description
Description of the issue

## YouTrack ID: [ABC-123](https://youtrack.jetbrains.com/issue/ABC-123)
`;

			expect(result).toEqual(expected);
		});

		test("should support summary field in template", () => {
			plugin.settings = {
				youtrackUrl: "",
				apiToken: "",
				useApiToken: false,
				notesFolder: "",
				templatePath: "",
				queryHistory: [],
			};

			const issueData = {
				summary: "Test Summary",
				description: "Test Description",
			};

			const template = `# \${summary}

Description: \${description}`;

			const fields = Object.keys(plugin.parseFieldMapFromTemplate(template));

			const result = plugin.renderTemplate(
				template,
				"TEST-123",
				"https://youtrack.jetbrains.com/issue/TEST-123",
				issueData,
				fields
			);

			const expected = `# Test Summary

Description: Test Description`;

			expect(result).toEqual(expected);
		});

		test("should render template with nested fields", () => {
			plugin.settings = {
				youtrackUrl: "https://youtrack.jetbrains.com",
				apiToken: "",
				useApiToken: false,
				notesFolder: "",
				templatePath: "",
				queryHistory: [],
			};

			const issueData = {
				reporter: { fullName: "Alice Smith", email: "alice@example.com" },
				assignee: { login: "bob", fullName: "Bob Jones" },
				description: "Nested field test",
			};

			const template = "Reporter: ${reporter.fullName}\nAssignee: ${assignee.login}\nEmail: ${reporter.email}";

			const fields = Object.keys(plugin.parseFieldMapFromTemplate(template));

			const result = plugin.renderTemplate(
				template,
				"ISSUE-1",
				"https://youtrack.jetbrains.com/issue/ISSUE-1",
				issueData,
				fields
			);

			// Now that nested field replacement is implemented, check for the actual value
			expect(result).toContain("Alice Smith");
			// Optionally, check for other nested values
			expect(result).toContain("bob");
			expect(result).toContain("alice@example.com");
		});

		test("should render template with deeply nested fields", () => {
			plugin.settings = {
				youtrackUrl: "https://youtrack.jetbrains.com",
				apiToken: "",
				useApiToken: false,
				notesFolder: "",
				templatePath: "",
				queryHistory: [],
			};

			const issueData = {
				reporter: { manager: { fullName: "Jane Leader" } },
				description: "Deep nested field test",
			};

			const template = "Manager: ${reporter.manager.fullName}";

			const fields = Object.keys(plugin.parseFieldMapFromTemplate(template));

			const result = plugin.renderTemplate(
				template,
				"ISSUE-2",
				"https://youtrack.jetbrains.com/issue/ISSUE-2",
				issueData,
				fields
			);

			expect(result).toContain("Jane Leader");
		});

		// Test: missing field should be replaced with empty string
		test("should replace missing fields with empty string", () => {
			plugin.settings = {
				youtrackUrl: "",
				apiToken: "",
				useApiToken: false,
				notesFolder: "",
				templatePath: "",
				queryHistory: [],
			};

			const template = "ID: ${id}\nResolved: ${resolved}\nSummary: ${summary}\nTitle: ${title}";
			const issueId = "TEST-1";
			const issueUrl = "https://youtrack.example.com/issue/TEST-1";
			const issueData = { summary: "Test summary" };
			const fields = ["resolved", "summary"];

			const result = plugin.renderTemplate(template, issueId, issueUrl, issueData, fields);
			expect(result).toContain("ID: TEST-1");
			expect(result).toContain("Resolved: "); // should be empty
			expect(result).toContain("Summary: Test summary");
			expect(result).toContain("Title: Test summary"); // title is mapped from summary
		});
	});
});
