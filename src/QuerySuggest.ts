import { AbstractInputSuggest } from "obsidian";
import type YouTrackPlugin from "./YouTrackPlugin";

export class QuerySuggest extends AbstractInputSuggest<string> {
	private myInputEl: HTMLInputElement;
	constructor(
		private plugin: YouTrackPlugin,
		inputEl: HTMLInputElement
	) {
		super(plugin.app, inputEl);
		this.myInputEl = inputEl;
	}

	getSuggestions(inputStr: string): string[] {
		const lowerCaseInputStr = inputStr.toLowerCase();
		return this.plugin.settings.queryHistory.filter(query => query.toLowerCase().includes(lowerCaseInputStr));
	}

	renderSuggestion(suggestion: string, el: HTMLElement): void {
		el.setText(suggestion);
	}

	selectSuggestion(suggestion: string): void {
		this.setValue(suggestion);
		this.myInputEl.dispatchEvent(new Event("input"));
		this.close();
	}
}
