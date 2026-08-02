import { App, AbstractInputSuggest, TFolder } from "obsidian";
import { setNativeInputValue } from "./reactControlledInput";

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
		setNativeInputValue(this.inputEl, file.path);
		this.inputEl.dispatchEvent(new Event("input", { bubbles: true }));
		this.close();
	}
}
