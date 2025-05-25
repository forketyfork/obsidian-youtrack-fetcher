import YouTrackPlugin from "../main";
import { App, PluginManifest } from "obsidian";

describe("YouTrackPlugin Template Rendering", () => {
	let plugin: YouTrackPlugin;

	beforeEach(() => {
		plugin = new YouTrackPlugin({} as App, {} as PluginManifest);
		// Set fixed locale and time zone for stable tests
		plugin.dateTimeOptions = {
			locale: "en-US",
			timeZone: "UTC",
		};
	});

	describe("renderTemplate", () => {
		test("should render template with all issue fields", () => {
			plugin.settings = {
				youtrackUrl: "",
				apiToken: "",
				useApiToken: false,
				notesFolder: "",
				templatePath: "",
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

			// Render the template
			const result = plugin.renderTemplate(
				template,
				"ABC-123",
				"https://youtrack.jetbrains.com/issue/ABC-123",
				issueData
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
	});
});
