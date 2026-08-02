import { App, TFile } from "obsidian";
import { FileSuggest } from "../FileSuggest";

jest.mock("obsidian", () => {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const obsidianMock = jest.requireActual("../__mocks__/obsidian");
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	return { ...obsidianMock };
});

describe("FileSuggest", () => {
	test("selecting a suggestion notifies listeners on the input element", () => {
		const app = new App();
		const inputEl = document.createElement("input");
		const suggest = new FileSuggest(app, inputEl);
		const inputHandler = jest.fn();
		inputEl.addEventListener("input", inputHandler);

		const file = new TFile();
		file.path = "Templates/issue.md";
		suggest.selectSuggestion(file);

		expect(inputHandler).toHaveBeenCalledTimes(1);
	});
});
