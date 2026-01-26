import { App, Modal, Platform, setIcon, TextComponent, TFile, normalizePath } from "obsidian";
import type YouTrackPlugin from "./YouTrackPlugin";
import { YouTrackIssue } from "./types/YouTrackTypes";
import { QuerySuggest } from "./QuerySuggest";

export default class YouTrackSearchModal extends Modal {
	plugin: YouTrackPlugin;
	private query: string;
	private issues: YouTrackIssue[] = [];
	private page = 0;
	private readonly pageSize: number;
	private totalIssues = 0;
	private resultsEl: HTMLElement;
	private statusEl: HTMLElement;
	private searchButtonEl: HTMLButtonElement;
	private firstButtonEl: HTMLButtonElement;
	private prevButtonEl: HTMLButtonElement;
	private nextButtonEl: HTMLButtonElement;
	private lastButtonEl: HTMLButtonElement;
	private pageDisplayEl: HTMLSpanElement;

	// Event listeners for cleanup
	private keyPressHandler: (e: KeyboardEvent) => void;
	private searchClickHandler: () => void;
	private firstClickHandler: () => void;
	private prevClickHandler: () => void;
	private nextClickHandler: () => void;
	private lastClickHandler: () => void;

	constructor(app: App, plugin: YouTrackPlugin) {
		super(app);
		this.plugin = plugin;
		this.pageSize = Platform.isMobile ? 5 : 10;
	}

	onOpen() {
		this.modalEl.addClass("youtrack-fetcher-search-modal");
		const { contentEl } = this;
		contentEl.empty();
		contentEl.createEl("h2", { text: "Search YouTrack issues" });

		const searchContainer = contentEl.createDiv({ cls: "youtrack-fetcher-search-container" });
		const searchInput = new TextComponent(searchContainer)
			.setPlaceholder("Enter YouTrack query")
			.onChange(value => (this.query = value));
		searchInput.inputEl.addClass("youtrack-fetcher-input");
		new QuerySuggest(this.plugin, searchInput.inputEl);
		// Store event handlers for cleanup
		this.keyPressHandler = e => {
			if (e.key === "Enter") {
				void this.search(true);
			}
		};
		this.searchClickHandler = () => {
			void this.search(true);
		};

		searchInput.inputEl.addEventListener("keypress", this.keyPressHandler);

		this.searchButtonEl = searchContainer.createEl("button", {
			text: "Search",
			cls: "mod-cta youtrack-fetcher-search-button",
		});
		this.searchButtonEl.addEventListener("click", this.searchClickHandler);

		const helpButton = searchContainer.createEl("a", {
			cls: "youtrack-fetcher-help-button",
			href: "https://www.jetbrains.com/help/youtrack/server/sample-search-queries.html",
		});
		helpButton.setAttr("target", "_blank");
		setIcon(helpButton, "help-circle");

		const paginationContainer = contentEl.createDiv({ cls: "youtrack-fetcher-pagination-container hidden" });
		this.firstButtonEl = paginationContainer.createEl("button");
		setIcon(this.firstButtonEl, "chevrons-left");
		this.prevButtonEl = paginationContainer.createEl("button");
		setIcon(this.prevButtonEl, "chevron-left");

		this.pageDisplayEl = paginationContainer.createSpan({ cls: "youtrack-fetcher-page-display" });

		this.nextButtonEl = paginationContainer.createEl("button");
		setIcon(this.nextButtonEl, "chevron-right");
		this.lastButtonEl = paginationContainer.createEl("button");
		setIcon(this.lastButtonEl, "chevrons-right");

		this.firstButtonEl.addClass("youtrack-fetcher-first-button");
		this.prevButtonEl.addClass("youtrack-fetcher-prev-button");
		this.nextButtonEl.addClass("youtrack-fetcher-next-button");
		this.lastButtonEl.addClass("youtrack-fetcher-last-button");

		// Store event handlers for cleanup
		this.firstClickHandler = () => {
			void this.goToFirstPage();
		};
		this.prevClickHandler = () => {
			void this.changePage(-1);
		};
		this.nextClickHandler = () => {
			void this.changePage(1);
		};
		this.lastClickHandler = () => {
			void this.goToLastPage();
		};

		this.firstButtonEl.addEventListener("click", this.firstClickHandler);
		this.prevButtonEl.addEventListener("click", this.prevClickHandler);
		this.nextButtonEl.addEventListener("click", this.nextClickHandler);
		this.lastButtonEl.addEventListener("click", this.lastClickHandler);

		this.resultsEl = contentEl.createDiv({ cls: "youtrack-fetcher-results-container" });
		this.statusEl = contentEl.createEl("p", { cls: "youtrack-fetcher-status" });
	}

	private async search(isNewSearch = false) {
		if (!this.query) {
			this.statusEl.setText("Please enter a search query.");
			return;
		}

		if (isNewSearch) {
			this.page = 0;
			void this.addQueryToHistory(this.query);
		}

		this.searchButtonEl.disabled = true;
		this.searchButtonEl.classList.add("is-loading");
		this.resultsEl.empty();
		this.statusEl.setText("");

		// Always fetch total count for new searches
		if (isNewSearch) {
			this.statusEl.setText("Fetching total issues count...");
			try {
				this.totalIssues = await this.plugin.getIssuesCount(this.query);
				this.statusEl.setText("");
				// Show pagination container only after we have the total count
				const paginationContainer = this.contentEl.querySelector(".youtrack-fetcher-pagination-container");
				paginationContainer?.classList.remove("hidden");
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : String(error);
				this.statusEl.setText(`Error getting issues count: ${errorMessage}`);
				this.searchButtonEl.disabled = false;
				this.searchButtonEl.classList.remove("is-loading");
				return;
			}
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
			this.searchButtonEl.disabled = false;
			this.searchButtonEl.classList.remove("is-loading");
		}
	}

	private renderResults() {
		this.resultsEl.empty();

		if (this.issues.length === 0) {
			this.statusEl.setText("No issues found.");
			return;
		}

		const table = this.resultsEl.createEl("table", { cls: "youtrack-fetcher-results-table" });
		const thead = table.createEl("thead");
		const headerRow = thead.createEl("tr");
		headerRow.createEl("th", { text: "ID" });
		headerRow.createEl("th", { text: "Summary" });
		headerRow.createEl("th", { text: "Status" });
		headerRow.createEl("th", { text: "Action" });

		const tbody = table.createEl("tbody");
		for (const issue of this.issues) {
			const row = tbody.createEl("tr");

			const idCell = row.createEl("td");
			idCell.setAttr("data-youtrack-fetcher-label", "ID");
			const issueLink = idCell.createEl("a", {
				text: issue.idReadable,
				href: `${this.plugin.settings.youtrackUrl}/issue/${issue.idReadable}`,
			});
			issueLink.setAttr("target", "_blank");

			const summaryCell = row.createEl("td", { text: issue.summary });
			summaryCell.setAttr("data-youtrack-fetcher-label", "Summary");

			const stateField = issue.customFields.find(
				field => field.name.toLowerCase() === "state" || field.name.toLowerCase() === "status"
			);
			const statusCell = row.createEl("td", { text: stateField?.value?.name ?? "N/A" });
			statusCell.setAttr("data-youtrack-fetcher-label", "Status");

			const actionCell = row.createEl("td");
			actionCell.setAttr("data-youtrack-fetcher-label", "Action");

			const existingFile = this.getExistingFile(issue.idReadable);
			if (existingFile) {
				const actionLink = actionCell.createEl("a", { cls: "youtrack-fetcher-action-link" });
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
		const lastPage = Math.max(0, Math.ceil(this.totalIssues / this.pageSize) - 1);

		if (this.pageDisplayEl) {
			this.pageDisplayEl.setText(`${this.page + 1} of ${lastPage + 1}`);
		}

		if (this.firstButtonEl) this.firstButtonEl.disabled = this.page === 0;
		if (this.prevButtonEl) this.prevButtonEl.disabled = this.page === 0;
		if (this.nextButtonEl) this.nextButtonEl.disabled = this.page >= lastPage;
		if (this.lastButtonEl) this.lastButtonEl.disabled = this.page >= lastPage;
	}

	private async changePage(delta: number) {
		this.page += delta;
		await this.search(false);
	}

	private async goToFirstPage() {
		this.page = 0;
		await this.search(false);
	}

	private async goToLastPage() {
		this.page = Math.ceil(this.totalIssues / this.pageSize) - 1;
		await this.search(false);
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
		// Remove event listeners to prevent memory leaks
		const searchInput = this.contentEl.querySelector(".youtrack-fetcher-input") as HTMLInputElement;
		if (searchInput && this.keyPressHandler) {
			searchInput.removeEventListener("keypress", this.keyPressHandler);
		}

		if (this.searchButtonEl && this.searchClickHandler) {
			this.searchButtonEl.removeEventListener("click", this.searchClickHandler);
		}

		if (this.firstButtonEl && this.firstClickHandler) {
			this.firstButtonEl.removeEventListener("click", this.firstClickHandler);
		}
		if (this.prevButtonEl && this.prevClickHandler) {
			this.prevButtonEl.removeEventListener("click", this.prevClickHandler);
		}
		if (this.nextButtonEl && this.nextClickHandler) {
			this.nextButtonEl.removeEventListener("click", this.nextClickHandler);
		}
		if (this.lastButtonEl && this.lastClickHandler) {
			this.lastButtonEl.removeEventListener("click", this.lastClickHandler);
		}

		const { contentEl } = this;
		contentEl.empty();
	}

	private getExistingFile(issueId: string): TFile | null {
		const folderPath = this.plugin.settings.notesFolder || "";
		const fileName = normalizePath(`${folderPath ? `${folderPath}/` : ""}${issueId}.md`);
		const file = this.app.vault.getAbstractFileByPath(fileName);
		return file instanceof TFile ? file : null;
	}

	private async addQueryToHistory(query: string) {
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

		try {
			await this.plugin.saveSettings();
		} catch (error) {
			console.error("Failed to save query history:", error);
		}
	}
}
