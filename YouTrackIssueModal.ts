import { App, Modal, TextComponent, normalizePath } from "obsidian";
import type YouTrackPlugin from "./YouTrackPlugin";
export default class YouTrackIssueModal extends Modal {
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
		const inputContainer = contentEl.createDiv({ cls: "youtrack-input-container" });
		const input = new TextComponent(inputContainer)
			.setPlaceholder("Issue URL or ID (e.g., ABC-123)")
			.setValue(this.issueId || "")
			.onChange(value => {
				this.issueId = value;
				// Clear any previous error messages
				if (this.statusEl) {
					this.statusEl.setText("");
				}
			});
		input.inputEl.addClass("youtrack-input");

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
				this.statusEl.setText("Please enter an issue ID or URL");
				this.statusEl.addClass("error-message");
				return;
			}

			const parsedId = this.plugin.parseIssueId(this.issueId);
			if (!parsedId) {
				this.statusEl.setText("Invalid issue ID or URL (must match your YouTrack URL)");
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
				const response: unknown = await this.plugin.fetchIssueData(parsedId);
				if (typeof response === "object" && response !== null) {
					const issueData = response as Record<string, unknown>;
					await this.plugin.createIssueNote(parsedId, issueData);
				} else {
					throw new Error("Invalid response format from YouTrack API");
				}
				this.close();
			} catch (error) {
				// Hide loading indicator
				this.loadingIndicator.classList.remove("visible");

				// Show error message
				const errorMessage = error instanceof Error ? error.message : String(error);
				this.statusEl.setText(`Error: ${errorMessage}`);
				this.statusEl.addClass("error-message");
			}
		};

		fetchButton.addEventListener("click", () => {
			fetchIssue().catch(console.error);
		});

		// Handle Enter key press
		input.inputEl.addEventListener("keypress", event => {
			if (event.key === "Enter") {
				fetchIssue().catch(console.error);
			}
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
