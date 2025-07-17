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

		const inputContainer = contentEl.createDiv({ cls: "youtrack-input-container" });
		const input = new TextComponent(inputContainer)
			.setPlaceholder("Issue URL or ID (e.g., ABC-123)")
			.setValue(this.issueId || "")
			.onChange(value => {
				this.issueId = value;
				if (this.statusEl) {
					this.statusEl.setText("");
				}
			});
		input.inputEl.addClass("youtrack-input");

		this.statusEl = contentEl.createEl("p", { cls: "youtrack-status" });

		this.loadingIndicator = contentEl.createEl("div", {
			cls: "youtrack-loading",
			text: "Fetching issue...",
		});

		setTimeout(() => {
			input.inputEl.focus();
			input.inputEl.select();
		}, 0);

		const buttonsContainer = contentEl.createDiv({
			cls: "youtrack-modal-button-container",
		});

		buttonsContainer.createEl("button", { text: "Cancel" }).addEventListener("click", () => {
			this.close();
		});

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
				const file = this.plugin.app.vault.getAbstractFileByPath(normalizedPath);

				if (!file) {
					this.statusEl.setText(
						`Template file not found: ${normalizedPath}. Please check the template path in settings.`
					);
					this.statusEl.addClass("error-message");
					return;
				}
			}

			this.loadingIndicator.classList.add("visible");
			this.statusEl.setText("");

			try {
				await this.plugin.importIssue(parsedId);
				this.close();
			} catch (error) {
				this.loadingIndicator.classList.remove("visible");

				const errorMessage = error instanceof Error ? error.message : String(error);
				this.statusEl.setText(`Error: ${errorMessage}`);
				this.statusEl.addClass("error-message");
			}
		};

		fetchButton.addEventListener("click", () => {
			fetchIssue().catch(console.error);
		});

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
