import { Plugin, TFile, normalizePath, requestUrl } from "obsidian";
import _ from "lodash";
import YouTrackSettingTab from "./YouTrackSettingTab";
import YouTrackIssueModal from "./YouTrackIssueModal";
import YouTrackSearchModal from "./YouTrackSearchModal";
interface YouTrackPluginSettings {
	youtrackUrl: string;
	apiToken: string;
	useApiToken: boolean;
	notesFolder: string;
	templatePath: string;
	queryHistory: string[];
}

export interface YouTrackIssue {
	idReadable: string;
	summary: string;
	customFields: {
		name: string;
		value: {
			name: string;
		};
	}[];
}

const DEFAULT_SETTINGS: YouTrackPluginSettings = {
	youtrackUrl: "https://youtrack.jetbrains.com",
	apiToken: "",
	useApiToken: false,
	notesFolder: "YouTrack",
	templatePath: "",
	queryHistory: [],
};

const DEFAULT_TEMPLATE = "# ${id}: ${title}\n\nURL: ${url}\n\n## Description\n\n${description}\n";

const TIMESTAMP_FIELDS = new Set(["created", "updated", "resolved"]);

interface DateTimeFormatOptions {
	locale?: string;
	timeZone?: string;
}

export default class YouTrackPlugin extends Plugin {
	settings: YouTrackPluginSettings;
	dateTimeOptions: DateTimeFormatOptions = {
		locale: undefined, // Uses system locale by default
		timeZone: undefined, // Uses system time zone by default
	};

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new YouTrackSettingTab(this.app, this));

		this.addCommand({
			id: "fetch-youtrack-issue",
			name: "Fetch YouTrack issue",
			callback: () => {
				new YouTrackIssueModal(this.app, this).open();
			},
		});

		this.addRibbonIcon("clipboard-list", "Fetch YouTrack issue", () => {
			new YouTrackIssueModal(this.app, this).open();
		});

		this.addCommand({
			id: "search-youtrack-issues",
			name: "Search YouTrack issues",
			callback: () => {
				new YouTrackSearchModal(this.app, this).open();
			},
		});
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, (await this.loadData()) as Partial<YouTrackPluginSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async importIssue(issueId: string) {
		const template = (await this.readTemplateFile()) ?? DEFAULT_TEMPLATE;
		const fieldMap = this.parseFieldMapFromTemplate(template);

		const response: unknown = await this.fetchIssueData(issueId, fieldMap);
		if (typeof response === "object" && response !== null) {
			const issueData = response as Record<string, unknown>;
			await this.createIssueNote(issueId, issueData, template, Object.keys(fieldMap));
		} else {
			throw new Error("Invalid response format from YouTrack API");
		}
	}

	async readTemplateFile(): Promise<string | null> {
		if (!this.settings.templatePath) {
			return null;
		}

		try {
			const normalizedPath = normalizePath(this.settings.templatePath);
			const file = this.app.vault.getAbstractFileByPath(normalizedPath);

			if (!file || !(file instanceof TFile)) {
				console.error(`Template file not found: ${normalizedPath}`);
				return null;
			}

			return await this.app.vault.cachedRead(file);
		} catch (error) {
			console.error("Error reading template file:", error);
			return null;
		}
	}

	// Parse all fields (including nested) referenced in a template
	parseFieldMapFromTemplate(template: string): Record<string, Set<string>> {
		const fieldMap: Record<string, Set<string>> = {};
		const matches = template.matchAll(/\$\{([^}]+)\}/g);

		for (const match of matches) {
			let field = match[1].trim();
			if (!field || field === "id" || field === "url") continue;
			// Map title to summary
			if (field === "title") field = "summary";

			const [rootRaw, ...nestedRaw] = field.split(".");
			const root = rootRaw.trim();
			const nested = nestedRaw.map(f => f.trim()).filter(Boolean);
			if (!fieldMap[root]) fieldMap[root] = new Set();
			if (nested.length > 0) {
				fieldMap[root].add(nested.join("."));
			}
		}
		return fieldMap;
	}

	private buildNestedQuery(paths: Set<string>): string {
		const tree: Record<string, Set<string>> = {};

		for (const path of paths) {
			const [head, ...rest] = path.split(".");
			const key = head.trim();
			if (!tree[key]) {
				tree[key] = new Set();
			}
			if (rest.length > 0) {
				tree[key].add(rest.join("."));
			}
		}

		const parts: string[] = [];
		for (const [key, subPaths] of Object.entries(tree)) {
			if (subPaths.size === 0) {
				parts.push(key);
			} else {
				parts.push(`${key}(${this.buildNestedQuery(subPaths)})`);
			}
		}

		return parts.join(",");
	}

	// Generate YouTrack API fields query from field map with arbitrary nesting
	buildYouTrackFieldsQuery(fieldMap: Record<string, Set<string>>): string {
		const fields: string[] = [];
		for (const [root, nestedSet] of Object.entries(fieldMap)) {
			if (nestedSet.size === 0) {
				fields.push(root);
			} else {
				fields.push(`${root}(${this.buildNestedQuery(nestedSet)})`);
			}
		}
		return fields.join(",");
	}

	async fetchIssueData(issueId: string, fieldMap: Record<string, Set<string>>): Promise<unknown> {
		if (!this.settings.youtrackUrl) {
			throw new Error("YouTrack URL is not set in plugin settings");
		}

		const fieldsQuery = this.buildYouTrackFieldsQuery(fieldMap);

		const apiUrl = `${this.settings.youtrackUrl}/api/issues/${issueId}?fields=${fieldsQuery}`;

		const headers: Record<string, string> = {
			Accept: "application/json",
			"Content-Type": "application/json",
		};

		// Add authorization if API token is set
		if (this.settings.useApiToken && this.settings.apiToken) {
			headers["Authorization"] = `Bearer ${this.settings.apiToken}`;
		}

		try {
			const response = await requestUrl({
				url: apiUrl,
				method: "GET",
				headers,
			});

			if (response.status != 200) {
				throw new Error(`Error fetching issue: ${response.text} (${response.status})`);
			}

			return await response.json;
		} catch (error) {
			console.error("Error fetching YouTrack issue:", error);
			throw error;
		}
	}

	async searchIssues(query: string, top: number, skip: number): Promise<unknown> {
		if (!this.settings.youtrackUrl) {
			throw new Error("YouTrack URL is not set in plugin settings");
		}

		const fieldsQuery = "idReadable,summary,customFields(name,value(name))";
		const encodedQuery = encodeURIComponent(query);

		const apiUrl = `${this.settings.youtrackUrl}/api/issues?query=${encodedQuery}&fields=${fieldsQuery}&$top=${top}&$skip=${skip}`;

		const headers: Record<string, string> = {
			Accept: "application/json",
			"Content-Type": "application/json",
		};

		if (this.settings.useApiToken && this.settings.apiToken) {
			headers["Authorization"] = `Bearer ${this.settings.apiToken}`;
		}

		try {
			const response = await requestUrl({
				url: apiUrl,
				method: "GET",
				headers,
			});

			if (response.status !== 200) {
				throw new Error(`Error searching issues: ${response.text} (${response.status})`);
			}

			return await response.json;
		} catch (error) {
			console.error("Error searching YouTrack issues:", error);
			throw error;
		}
	}

	parseIssueId(input: string): string | null {
		const trimmed = input.trim();
		if (!trimmed) return null;

		let id = trimmed;

		if (/^https?:\/\//i.test(trimmed)) {
			try {
				const inputUrl = new URL(trimmed);
				const baseUrl = new URL(this.settings.youtrackUrl);
				const basePath = baseUrl.pathname.replace(/\/$/, "");
				const prefix = `${basePath}/issue/`;

				if (inputUrl.origin !== baseUrl.origin || !inputUrl.pathname.startsWith(prefix)) {
					return null;
				}

				id = inputUrl.pathname.substring(prefix.length).split("/")[0];
			} catch {
				return null;
			}
		}

		return /^[A-Za-z]+-\d+$/.test(id) ? id : null;
	}
	formatTimestamp(value: unknown): string {
		const date = typeof value === "number" ? new Date(value) : new Date(String(value));
		if (isNaN(date.getTime())) {
			return String(value);
		}

		const formatOptions = this.dateTimeOptions;
		return date.toLocaleString(formatOptions.locale, {
			timeZone: formatOptions.timeZone,
		});
	}

	renderTemplate(
		template: string,
		issueId: string,
		issueUrl: string,
		issueData: Record<string, unknown>,
		fields: string[]
	): string {
		const replacements: Record<string, string | object> = {
			id: issueId,
			url: issueUrl,
		};

		for (const field of fields) {
			const value = issueData[field];
			let formatted: string | object = "";
			if (value) {
				if (TIMESTAMP_FIELDS.has(field)) {
					formatted = this.formatTimestamp(value);
				} else {
					formatted = value;
				}
			}
			// Support both ${summary} and ${title} for backward compatibility
			if (field === "summary") {
				replacements["title"] = formatted;
				replacements["summary"] = formatted;
			} else {
				replacements[field] = formatted;
			}
		}

		// Use lodash template with ${...} syntax
		const compiled = _.template(template);
		return compiled(replacements);
	}

	async createIssueNote(issueId: string, issueData: Record<string, unknown>, template: string, fields: string[]) {
		const folderPath = this.settings.notesFolder ? this.settings.notesFolder : "";
		if (folderPath) {
			try {
				const folder = this.app.vault.getAbstractFileByPath(folderPath);
				if (!folder) {
					await this.app.vault.createFolder(folderPath);
				}
			} catch (error) {
				console.error("Error creating folder:", error);
				// Continue even if folder creation fails
			}
		}

		const fileName = `${folderPath ? folderPath + "/" : ""}${issueId}.md`;

		const issueUrl = `${this.settings.youtrackUrl}/issue/${issueId}`;

		const noteContent = this.renderTemplate(template, issueId, issueUrl, issueData, fields);

		try {
			const normalizedPath = normalizePath(fileName);
			await this.app.vault.create(normalizedPath, noteContent);

			const file = this.app.vault.getAbstractFileByPath(normalizedPath);
			if (file instanceof TFile) {
				await this.app.workspace.getLeaf().openFile(file);
			}
		} catch (error) {
			console.error("Error creating note:", error);
			throw error;
		}
	}
}
