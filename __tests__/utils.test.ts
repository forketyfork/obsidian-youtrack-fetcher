import YouTrackPlugin from "../main";

describe("YouTrackPlugin Utils", () => {
	let plugin: YouTrackPlugin;

	beforeEach(() => {
		plugin = new YouTrackPlugin({} as any, {} as any);
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
		beforeEach(() => {
			plugin.settings = {
				youtrackUrl: "https://example.com",
				apiToken: "",
				useApiToken: false,
				notesFolder: "",
				templatePath: "",
			};
		});

		test("returns input when id provided", () => {
			const id = plugin.parseIssueId("ABC-1");
			expect(id).toBe("ABC-1");
		});

		test("parses id from matching url", () => {
			const id = plugin.parseIssueId("https://example.com/issue/ABC-2");
			expect(id).toBe("ABC-2");
		});

		test("throws for mismatched url", () => {
			expect(() => plugin.parseIssueId("https://other.com/issue/ABC-3")).toThrow();
		});
	});
});
