import { App, Modal, Platform, setIcon, TextComponent, TFile } from "obsidian";
import type YouTrackPlugin from "./YouTrackPlugin";
import { YouTrackIssue } from "./YouTrackPlugin";
import { QuerySuggest } from "./QuerySuggest";

export default class YouTrackSearchModal extends Modal {
	plugin: YouTrackPlugin;
	private query: string;
	private issues: YouTrackIssue[] = [];
	private page = 0;
	private readonly pageSize: number;
	private hasSearched = false;
	private resultsEl: HTMLElement;
	private statusEl: HTMLElement;
	private loadingIndicator: HTMLElement;

	constructor(app: App, plugin: YouTrackPlugin) {
		super(app);
		this.plugin = plugin;
		this.pageSize = Platform.isMobile ? 5 : 10;
	}

	onOpen() {
		this.modalEl.addClass("youtrack-search-modal");
		const { contentEl } = this;
		contentEl.empty();
		contentEl.createEl("h2", { text: "Search YouTrack issues" });

		const searchContainer = contentEl.createDiv({ cls: "youtrack-search-container" });
		const searchInput = new TextComponent(searchContainer)
			.setPlaceholder("Enter YouTrack query")
			.onChange(value => (this.query = value));
		searchInput.inputEl.addClass("youtrack-input");
		new QuerySuggest(this.plugin, searchInput.inputEl);
		searchInput.inputEl.addEventListener("keypress", e => {
			if (e.key === "Enter") {
				void this.search();
			}
		});

		const searchButton = searchContainer.createEl("button", {
			text: "Search",
			cls: "mod-cta",
		});
		searchButton.addEventListener("click", () => {
			void this.search();
		});

		const helpButton = searchContainer.createEl("a", {
			cls: "youtrack-help-button",
			href: "https://www.jetbrains.com/help/youtrack/server/sample-search-queries.html",
		});
		helpButton.setAttr("target", "_blank");
		setIcon(helpButton, "help-circle");

		this.loadingIndicator = contentEl.createEl("div", {
			cls: "youtrack-loading",
			text: "Searching...",
		});

		this.resultsEl = contentEl.createDiv({ cls: "youtrack-results-container" });
		this.statusEl = contentEl.createEl("p", { cls: "youtrack-status" });

		const paginationContainer = contentEl.createDiv({ cls: "youtrack-pagination-container hidden" });
		const prevButton = paginationContainer.createEl("button", { text: "Previous", cls: "youtrack-prev-button" });
		const nextButton = paginationContainer.createEl("button", { text: "Next", cls: "youtrack-next-button" });

		prevButton.addEventListener("click", () => {
			void this.changePage(-1);
		});
		nextButton.addEventListener("click", () => {
			void this.changePage(1);
		});
	}

	private async search() {
		if (!this.query) {
			this.statusEl.setText("Please enter a search query.");
			return;
		}

		this.addQueryToHistory(this.query);

		this.loadingIndicator.classList.add("visible");
		this.resultsEl.empty();
		this.statusEl.setText("");

		if (!this.hasSearched) {
			this.hasSearched = true;
			const paginationContainer = this.contentEl.querySelector(".youtrack-pagination-container");
			paginationContainer?.classList.remove("hidden");
		}

		try {
			const results = (await this.plugin.searchIssues(
				this.query,
				this.pageSize,
				this.page * this.pageSize
			)) as YouTrackIssue[];
			this.issues = results;
			this.renderResults();
			this.updatePaginationButtons();
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			this.statusEl.setText(`Error: ${errorMessage}`);
		} finally {
			this.loadingIndicator.classList.remove("visible");
		}
	}

	private renderResults() {
		this.resultsEl.empty();

		if (this.issues.length === 0) {
			this.statusEl.setText("No issues found.");
			return;
		}

		const table = this.resultsEl.createEl("table", { cls: "youtrack-results-table" });
		const thead = table.createEl("thead");
		const headerRow = thead.createEl("tr");
		headerRow.createEl("th", { text: "ID" });
		headerRow.createEl("th", { text: "Summary" });
		headerRow.createEl("th", { text: "Status" });
		headerRow.createEl("th", { text: "Action" });

		const tbody = table.createEl("tbody");
		for (const issue of this.issues) {
			const row = tbody.createEl("tr");

			const issueLink = row.createEl("td").createEl("a", {
				text: issue.idReadable,
				href: `${this.plugin.settings.youtrackUrl}/issue/${issue.idReadable}`,
			});
			issueLink.setAttr("target", "_blank");

			row.createEl("td", { text: issue.summary });

			const stateField = issue.customFields.find(
				field => field.name.toLowerCase() === "state" || field.name.toLowerCase() === "status"
			);
			row.createEl("td", { text: stateField?.value?.name ?? "N/A" });

			const actionCell = row.createEl("td");

			const existingFile = this.getExistingFile(issue.idReadable);
			if (existingFile) {
				const actionLink = actionCell.createEl("a", { cls: "youtrack-action-link" });
				setIcon(actionLink, "share");
				actionLink.addEventListener("click", () => {
					void this.app.workspace.getLeaf().openFile(existingFile);
					this.close();
				});
			} else {
				const actionButton = actionCell.createEl("button");
				setIcon(actionButton, "download");
				actionButton.addEventListener("click", () => {
					void this.importIssue(issue.idReadable);
				});
			}
		}

		this.updatePaginationButtons();
	}

	private updatePaginationButtons() {
		const prevButton = this.contentEl.querySelector(".youtrack-prev-button") as HTMLButtonElement;
		const nextButton = this.contentEl.querySelector(".youtrack-next-button") as HTMLButtonElement;

		if (prevButton) {
			prevButton.disabled = this.page === 0;
		}
		if (nextButton) {
			nextButton.disabled = this.issues.length < this.pageSize;
		}
	}

	private async changePage(delta: number) {
		this.page += delta;
		await this.search();
	}

	private async importIssue(issueId: string) {
		try {
			await this.plugin.importIssue(issueId);
			this.close();
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			this.statusEl.setText(`Error importing issue: ${errorMessage}`);
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}

	private getExistingFile(issueId: string): TFile | null {
		const folderPath = this.plugin.settings.notesFolder || "";
		const fileName = `${folderPath ? `${folderPath}/` : ""}${issueId}.md`;
		const file = this.app.vault.getAbstractFileByPath(fileName);
		return file instanceof TFile ? file : null;
	}

	private addQueryToHistory(query: string) {
		const { settings } = this.plugin;
		const history = settings.queryHistory || [];

		// Remove the query if it already exists to move it to the top
		const index = history.indexOf(query);
		if (index > -1) {
			history.splice(index, 1);
		}

		// Add the new query to the beginning of the history
		history.unshift(query);

		// Limit the history to the last 10 queries
		settings.queryHistory = history.slice(0, 10);

		void this.plugin.saveSettings();
	}
}
