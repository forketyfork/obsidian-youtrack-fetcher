import YouTrackPlugin from "../main";

describe("YouTrackPlugin Utils", () => {
	let plugin: YouTrackPlugin;

	beforeEach(() => {
		plugin = new YouTrackPlugin({} as any, {} as any);
	});

	describe("parseFieldListFromSettings", () => {
		test("should handle empty fields string", () => {
			plugin.settings = {
				youtrackUrl: "",
				apiToken: "",
				useApiToken: false,
				notesFolder: "",
				templatePath: "",
				fields: "",
			};

			const result = plugin.parseFieldListFromSettings();

			expect(result).toEqual([]);
		});

		test("should remove whitespace from fields", () => {
			plugin.settings = {
				youtrackUrl: "",
				apiToken: "",
				useApiToken: false,
				notesFolder: "",
				templatePath: "",
				fields: "summary, description,  created  ,updated",
			};

			const result = plugin.parseFieldListFromSettings();

			expect(result).toEqual(["summary", "description", "created", "updated"]);
		});

		test("should filter out empty fields", () => {
			plugin.settings = {
				youtrackUrl: "",
				apiToken: "",
				useApiToken: false,
				notesFolder: "",
				templatePath: "",
				fields: "summary,,description, ,created",
			};

			const result = plugin.parseFieldListFromSettings();

			expect(result).toEqual(["summary", "description", "created"]);
		});
	});

	describe("formatTimestamp", () => {
		test("should format valid timestamp number", () => {
			const timestamp = 1672531200000; // Jan 1, 2023
			const result = plugin.formatTimestamp(timestamp);

			expect(result).toBe("1/1/2023, 1:00:00 AM");
		});

		test("should format valid timestamp string", () => {
			const timestamp = "2023-01-01T12:00:00.000Z";
			const result = plugin.formatTimestamp(timestamp);

			expect(result).toBe("1/1/2023, 1:00:00 PM");
		});

		test("should return original value for invalid timestamp", () => {
			const invalidTimestamp = "not-a-date";
			const result = plugin.formatTimestamp(invalidTimestamp);

			expect(result).toBe("not-a-date");
		});
	});
});
