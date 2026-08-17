import { App, Modal, normalizePath, TFile } from "obsidian";
import type YouTrackPlugin from "./YouTrackPlugin";

export default class YouTrackIssueModal extends Modal {
	private readonly plugin: YouTrackPlugin;
	private inputEl!: HTMLInputElement;
	private statusEl!: HTMLParagraphElement;
	private loadingEl!: HTMLDivElement;
	private fetchButtonEl!: HTMLButtonElement;

	constructor(app: App, plugin: YouTrackPlugin) {
		super(app);
		this.plugin = plugin;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.createEl("h2", { text: "Fetch YouTrack issue" });

		const inputContainer = contentEl.createDiv({ cls: "youtrack-fetcher-input-container" });
		this.inputEl = inputContainer.createEl("input", {
			type: "text",
			cls: "youtrack-fetcher-input",
			placeholder: "Issue URL or ID (e.g., ABC-123)",
		});
		this.inputEl.addEventListener("input", this.inputHandler);
		this.inputEl.addEventListener("keydown", this.keyDownHandler);

		this.statusEl = contentEl.createEl("p", { cls: "youtrack-fetcher-status" });
		this.loadingEl = contentEl.createDiv({
			text: "Fetching issue...",
			cls: "youtrack-fetcher-loading",
		});

		const buttonContainer = contentEl.createDiv({ cls: "youtrack-fetcher-modal-button-container" });
		const cancelButton = buttonContainer.createEl("button", { text: "Cancel" });
		cancelButton.addEventListener("click", this.cancelHandler);

		this.fetchButtonEl = buttonContainer.createEl("button", {
			text: "Fetch issue",
			cls: "mod-cta",
		});
		this.fetchButtonEl.addEventListener("click", this.fetchHandler);

		this.inputEl.focus();
		this.inputEl.select();
	}

	onClose() {
		this.inputEl?.removeEventListener("input", this.inputHandler);
		this.inputEl?.removeEventListener("keydown", this.keyDownHandler);
		this.fetchButtonEl?.removeEventListener("click", this.fetchHandler);

		const cancelButton = this.contentEl.querySelector(".youtrack-fetcher-modal-button-container button");
		cancelButton?.removeEventListener("click", this.cancelHandler);
		this.contentEl.empty();
	}

	private readonly inputHandler = () => {
		this.clearStatus();
	};

	private readonly keyDownHandler = (event: KeyboardEvent) => {
		if (event.key === "Enter" && !this.fetchButtonEl.disabled) {
			void this.fetchIssue();
		}
	};

	private readonly cancelHandler = () => {
		this.close();
	};

	private readonly fetchHandler = () => {
		void this.fetchIssue();
	};

	private clearStatus() {
		this.statusEl.setText("");
		this.statusEl.removeClass("youtrack-fetcher-error-message");
	}

	private showError(message: string) {
		this.statusEl.setText(message);
		this.statusEl.addClass("youtrack-fetcher-error-message");
		this.setLoading(false);
	}

	private setLoading(isLoading: boolean) {
		this.fetchButtonEl.disabled = isLoading;
		this.loadingEl.classList.toggle("visible", isLoading);
	}

	private async fetchIssue() {
		const issueInput = this.inputEl.value;
		if (!issueInput) {
			this.showError("Please enter an issue ID or URL");
			return;
		}

		const issueId = this.plugin.parseIssueId(issueInput);
		if (!issueId) {
			this.showError("Invalid issue ID or URL (must match your YouTrack URL)");
			return;
		}

		try {
			if (this.plugin.settings.templatePath) {
				const normalizedPath = normalizePath(this.plugin.settings.templatePath);
				const file = this.plugin.app.vault.getAbstractFileByPath(normalizedPath);

				if (!file || !(file instanceof TFile)) {
					this.showError(`Template file not found: ${normalizedPath}. Please check the template path in settings.`);
					return;
				}
			}

			this.setLoading(true);
			this.clearStatus();
			await this.plugin.importIssue(issueId);
			this.close();
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			this.showError(`Error: ${errorMessage}`);
		}
	}
}
