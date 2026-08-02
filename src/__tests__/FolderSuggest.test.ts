import { App, TFolder } from "obsidian";
import { FolderSuggest } from "../FolderSuggest";

jest.mock("obsidian", () => {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- jest.requireActual has no type information
	const obsidianMock = jest.requireActual("../__mocks__/obsidian");
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return -- obsidianMock is untyped
	return { ...obsidianMock };
});

describe("FolderSuggest", () => {
	test("selecting a suggestion notifies listeners on the input element", () => {
		const app = new App();
		const inputEl = document.createElement("input");
		const suggest = new FolderSuggest(app, inputEl);
		const inputHandler = jest.fn();
		inputEl.addEventListener("input", inputHandler);

		const folder = new TFolder();
		folder.path = "YouTrack";
		suggest.selectSuggestion(folder);

		expect(inputHandler).toHaveBeenCalledTimes(1);
	});
});
