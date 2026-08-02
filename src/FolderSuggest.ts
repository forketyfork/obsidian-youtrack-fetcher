import { App, AbstractInputSuggest, TFolder } from "obsidian";

export class FolderSuggest extends AbstractInputSuggest<TFolder> {
	constructor(
		app: App,
		private inputEl: HTMLInputElement
	) {
		super(app, inputEl);
	}

	getSuggestions(inputStr: string): TFolder[] {
		const abstractFiles = this.app.vault.getAllLoadedFiles();
		const folders: TFolder[] = [];
		const lowerCaseInputStr = inputStr.toLowerCase();

		abstractFiles.forEach(file => {
			if (file instanceof TFolder && file.path.toLowerCase().contains(lowerCaseInputStr)) {
				folders.push(file);
			}
		});

		return folders;
	}

	renderSuggestion(file: TFolder, el: HTMLElement): void {
		el.setText(file.path);
	}

	selectSuggestion(file: TFolder): void {
		this.setValue(file.path);
		// setValue() only updates the input's DOM value; dispatch an input event so
		// listeners (e.g. a controlled React input's onChange) learn about the change.
		this.inputEl.dispatchEvent(new Event("input", { bubbles: true }));
		this.close();
	}
}
