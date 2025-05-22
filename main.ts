import {
	App,
	Plugin,
	PluginSettingTab,
	Setting,
	TFile,
	normalizePath,
	requestUrl,
	Modal,
	TextComponent,
} from "obsidian";

interface YouTrackPluginSettings {
	youtrackUrl: string;
	apiToken: string;
	useApiToken: boolean;
	notesFolder: string;
	templatePath: string;
	fields: string;
}

const DEFAULT_SETTINGS: YouTrackPluginSettings = {
	youtrackUrl: "https://youtrack.jetbrains.com",
	apiToken: "",
	useApiToken: false,
	notesFolder: "YouTrack",
	templatePath: "",
	fields: "summary,description",
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
		timeZone: undefined // Uses system time zone by default
	};

	async onload() {
		await this.loadSettings();

		// Add settings tab
		this.addSettingTab(new YouTrackSettingTab(this.app, this));

		// Add command to fetch YouTrack issue
		this.addCommand({
			id: "fetch-youtrack-issue",
			name: "Fetch YouTrack issue",
			callback: () => {
				// Open modal to input issue ID
				new YouTrackIssueModal(this.app, this).open();
			},
		});

		// Add ribbon icon
		this.addRibbonIcon("clipboard-list", "Fetch YouTrack issue", () => {
			new YouTrackIssueModal(this.app, this).open();
		});
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async readTemplateFile(): Promise<string | null> {
		if (!this.settings.templatePath) {
			return null;
		}

		try {
			const normalizedPath = normalizePath(this.settings.templatePath);
			const exists = await this.app.vault.adapter.exists(normalizedPath);

			if (!exists) {
				console.error(`Template file not found: ${normalizedPath}`);
				return null;
			}

			return await this.app.vault.adapter.read(normalizedPath);
		} catch (error) {
			console.error("Error reading template file:", error);
			return null;
		}
	}

	async fetchIssueData(issueId: string): Promise<any> {
		if (!this.settings.youtrackUrl) {
			throw new Error("YouTrack URL is not set in plugin settings");
		}

		// Construct the API URL
		const fieldList = this.parseFieldListFromSettings();

		const apiUrl = `${this.settings.youtrackUrl}/api/issues/${issueId}?fields=${fieldList.join(",")}`;

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

	// Helper function to parse field list
	parseFieldListFromSettings(): string[] {
		return this.settings.fields
			? this.settings.fields
					.split(",")
					.map(f => f.trim())
					// include only truthy (non-empty) values
					.filter(Boolean)
			: [];
	}

	formatTimestamp(value: unknown): string {
		const date = typeof value === "number" ? new Date(value) : new Date(String(value));
		if (isNaN(date.getTime())) {
			return String(value);
		}
		
		const formatOptions = this.dateTimeOptions;
		return date.toLocaleString(formatOptions.locale, {
			timeZone: formatOptions.timeZone
		});
	}

	renderTemplate(template: string, issueId: string, issueUrl: string, issueData: any): string {
		// Build replacement map
		const fieldList = this.parseFieldListFromSettings();

		// these fields are always replaced
		const replacements: Record<string, string> = {
			id: issueId,
			url: issueUrl,
		};

		// always add "title" field from "summary" for backward compatibility
		if (issueData.summary) {
			replacements.title = String(issueData.summary);
		}

		// replace other fields specified in settings
		for (const field of fieldList) {
			const value = issueData[field];
			if (value) {
				let formatted = String(value);
				if (TIMESTAMP_FIELDS.has(field)) {
					formatted = this.formatTimestamp(value);
				}
				replacements[field] = formatted;
			}
		}
		console.log("Replacements:", replacements);
		console.log("Template:", template);
		console.log("Issue Data:", issueData);
		return template.replace(/\$\{([^}]+)\}/g, (_match, key) => replacements[key] ?? "");
	}

	async createIssueNote(issueId: string, issueData: any) {
		// Create folder if it doesn't exist
		const folderPath = this.settings.notesFolder ? this.settings.notesFolder : "";
		if (folderPath) {
			try {
				const folderExists = await this.app.vault.adapter.exists(folderPath);
				if (!folderExists) {
					await this.app.vault.createFolder(folderPath);
				}
			} catch (error) {
				console.error("Error creating folder:", error);
				// Continue even if folder creation fails
			}
		}

		// Create file name from issue ID
		const fileName = `${folderPath ? folderPath + "/" : ""}${issueId}.md`;

		// Construct issue URL
		const issueUrl = `${this.settings.youtrackUrl}/issue/${issueId}`;

		// Try to read template file
		const template = (await this.readTemplateFile()) || DEFAULT_TEMPLATE;

		// Create note content
		const noteContent = this.renderTemplate(template, issueId, issueUrl, issueData);

		// Create file in Obsidian vault
		try {
			const normalizedPath = normalizePath(fileName);
			await this.app.vault.create(normalizedPath, noteContent);

			// Open the newly created file
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

class YouTrackIssueModal extends Modal {
	plugin: YouTrackPlugin;
	issueId: string;
	statusEl: HTMLElement;
	loadingIndicator: HTMLElement;

	constructor(app: App, plugin: YouTrackPlugin) {
		super(app);
		this.plugin = plugin;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl("h2", { text: "Fetch YouTrack issue" });

		// Create input field for issue ID
		const inputContainer = contentEl.createDiv();
		const input = new TextComponent(inputContainer)
			.setPlaceholder("Issue ID (e.g., ABC-123)")
			.setValue(this.issueId || "")
			.onChange(value => {
				this.issueId = value;
				// Clear any previous error messages
				if (this.statusEl) {
					this.statusEl.setText("");
				}
			});

		// Create status element for messages
		this.statusEl = contentEl.createEl("p", { cls: "youtrack-status" });

		// Create loading indicator (hidden by default)
		this.loadingIndicator = contentEl.createEl("div", {
			cls: "youtrack-loading",
			text: "Fetching issue...",
		});

		// Focus the input field and select all text
		setTimeout(() => {
			input.inputEl.focus();
			input.inputEl.select();
		}, 0);

		// Create buttons container
		const buttonsContainer = contentEl.createDiv({
			cls: "youtrack-modal-button-container",
		});

		// Add cancel button
		buttonsContainer.createEl("button", { text: "Cancel" }).addEventListener("click", () => {
			this.close();
		});

		// Add fetch button
		const fetchButton = buttonsContainer.createEl("button", {
			text: "Fetch issue",
			cls: "mod-cta",
		});

		const fetchIssue = async () => {
			if (!this.issueId) {
				this.statusEl.setText("Please enter an issue ID");
				this.statusEl.addClass("error-message");
				return;
			}

			if (this.plugin.settings.templatePath) {
				const normalizedPath = normalizePath(this.plugin.settings.templatePath);
				const exists = await this.plugin.app.vault.adapter.exists(normalizedPath);

				if (!exists) {
					this.statusEl.setText(
						`Template file not found: ${normalizedPath}. Please check the template path in settings.`
					);
					this.statusEl.addClass("error-message");
					return;
				}
			}

			// Show loading indicator
			this.loadingIndicator.classList.add("visible");
			this.statusEl.setText("");

			try {
				const issueData = await this.plugin.fetchIssueData(this.issueId);
				await this.plugin.createIssueNote(this.issueId, issueData);
				this.close();
			} catch (error) {
				// Hide loading indicator
				this.loadingIndicator.classList.remove("visible");

				// Show error message
				this.statusEl.setText(`Error: ${error.message}`);
				this.statusEl.addClass("error-message");
			}
		};

		fetchButton.addEventListener("click", fetchIssue);

		// Handle Enter key press
		input.inputEl.addEventListener("keypress", event => {
			if (event.key === "Enter") {
				fetchIssue();
			}
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class YouTrackSettingTab extends PluginSettingTab {
	plugin: YouTrackPlugin;

	constructor(app: App, plugin: YouTrackPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("YouTrack URL")
			.setDesc("URL of your YouTrack installation (e.g., https://youtrack.jetbrains.com)")
			.addText(text =>
				text.setValue(this.plugin.settings.youtrackUrl).onChange(async value => {
					// Remove trailing slash if present
					this.plugin.settings.youtrackUrl = value.replace(/\/$/, "");
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("Notes folder")
			.setDesc("Folder to store YouTrack issue notes (leave empty for vault root)")
			.addText(text =>
				text
					.setPlaceholder("YouTrack")
					.setValue(this.plugin.settings.notesFolder)
					.onChange(async value => {
						this.plugin.settings.notesFolder = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Note template")
			.setDesc(
				"Path to a template file in your vault. Use ${id}, ${title}, ${url} or any field from 'Issue fields' as placeholders (leave empty for default template)"
			)
			.addText(text =>
				text
					.setPlaceholder("Template path")
					.setValue(this.plugin.settings.templatePath)
					.onChange(async value => {
						this.plugin.settings.templatePath = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Issue fields")
			.setDesc("Comma-separated list of fields to fetch for each issue")
			.addText(text =>
				text
					.setPlaceholder("summary,description")
					.setValue(this.plugin.settings.fields)
					.onChange(async value => {
						this.plugin.settings.fields = value;
						await this.plugin.saveSettings();
					})
			)
			.addExtraButton(button =>
				button.setIcon("help").onClick(() => {
					// Open YouTrack help page in browser
					const helpUrl = "https://www.jetbrains.com/help/youtrack/devportal/api-entity-Issue.html";
					window.open(helpUrl, "_blank");
				})
			);

		new Setting(containerEl)
			.setName("Use API token authentication")
			.setDesc("Enable to use a permanent API token for authentication")
			.addToggle(toggle =>
				toggle.setValue(this.plugin.settings.useApiToken).onChange(async value => {
					this.plugin.settings.useApiToken = value;
					await this.plugin.saveSettings();
					this.display(); // Refresh to show/hide token field
				})
			);

		if (this.plugin.settings.useApiToken) {
			new Setting(containerEl)
				.setName("API token")
				.setDesc("Permanent API token for YouTrack authentication")
				.addText(text =>
					text
						.setPlaceholder("Enter your API token")
						.setValue(this.plugin.settings.apiToken)
						.onChange(async value => {
							this.plugin.settings.apiToken = value;
							await this.plugin.saveSettings();
						})
				)
				.addExtraButton(button =>
					button.setIcon("help").onClick(() => {
						// Open YouTrack help page in browser
						const helpUrl = "https://www.jetbrains.com/help/youtrack/server/manage-permanent-token.html";
						window.open(helpUrl, "_blank");
					})
				);
		}
	}
}
