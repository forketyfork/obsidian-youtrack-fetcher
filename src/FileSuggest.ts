import { App, AbstractInputSuggest, TFile } from "obsidian";

export class FileSuggest extends AbstractInputSuggest<TFile> {
	constructor(
		app: App,
		private inputEl: HTMLInputElement
	) {
		super(app, inputEl);
	}

	getSuggestions(inputStr: string): TFile[] {
		const abstractFiles = this.app.vault.getAllLoadedFiles();
		const files: TFile[] = [];
		const lowerCaseInputStr = inputStr.toLowerCase();

		abstractFiles.forEach(file => {
			if (file instanceof TFile && file.path.toLowerCase().contains(lowerCaseInputStr)) {
				files.push(file);
			}
		});

		return files;
	}

	renderSuggestion(file: TFile, el: HTMLElement): void {
		el.setText(file.path);
	}

	selectSuggestion(file: TFile): void {
		this.setValue(file.path);
		// setValue() only updates the input's DOM value; dispatch an input event so
		// listeners (e.g. a controlled React input's onChange) learn about the change.
		this.inputEl.dispatchEvent(new Event("input", { bubbles: true }));
		this.close();
	}
}
