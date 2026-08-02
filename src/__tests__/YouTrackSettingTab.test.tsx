import { act } from "react";
import { App, TFolder } from "obsidian";
import YouTrackSettingTab from "../YouTrackSettingTab";
import type YouTrackPlugin from "../YouTrackPlugin";
import { FolderSuggest } from "../FolderSuggest";
import { setNativeInputValue } from "../reactControlledInput";

(window as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

jest.mock("obsidian", () => {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const obsidianMock = jest.requireActual("../__mocks__/obsidian");
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	return { ...obsidianMock };
});

function createPlugin(useApiToken: boolean): YouTrackPlugin {
	return {
		app: new App(),
		settings: {
			youtrackUrl: "https://example.com",
			notesFolder: "",
			templatePath: "",
			useApiToken,
			apiToken: "",
		},
		saveSettings: jest.fn().mockResolvedValue(undefined),
	} as unknown as YouTrackPlugin;
}

function createContainer(): HTMLElement {
	// eslint-disable-next-line obsidianmd/prefer-active-doc -- jsdom test environment has no `activeDocument`
	const el = document.createElement("div");
	// Obsidian augments HTMLElement with `.empty()`; the test DOM doesn't have it.
	(el as HTMLElement & { empty: () => void }).empty = () => {
		el.innerHTML = "";
	};
	return el;
}

describe("YouTrackSettingTab", () => {
	test("shows the toggle as on when useApiToken is persisted as true", () => {
		const plugin = createPlugin(true);
		const tab = new YouTrackSettingTab(plugin.app, plugin);
		tab.containerEl = createContainer();

		act(() => {
			tab.display();
		});

		const checkbox = tab.containerEl.querySelector<HTMLInputElement>('input[type="checkbox"]');
		const container = tab.containerEl.querySelector(".checkbox-container");

		expect(checkbox?.checked).toBe(true);
		expect(container?.classList.contains("is-enabled")).toBe(true);
	});

	test("shows the toggle as off when useApiToken is persisted as false", () => {
		const plugin = createPlugin(false);
		const tab = new YouTrackSettingTab(plugin.app, plugin);
		tab.containerEl = createContainer();

		act(() => {
			tab.display();
		});

		const checkbox = tab.containerEl.querySelector<HTMLInputElement>('input[type="checkbox"]');
		const container = tab.containerEl.querySelector(".checkbox-container");

		expect(checkbox?.checked).toBe(false);
		expect(container?.classList.contains("is-enabled")).toBe(false);
	});

	test("can be switched off after being switched on", async () => {
		const plugin = createPlugin(true);
		const tab = new YouTrackSettingTab(plugin.app, plugin);
		tab.containerEl = createContainer();

		act(() => {
			tab.display();
		});

		const container = tab.containerEl.querySelector(".checkbox-container");
		expect(container?.classList.contains("is-enabled")).toBe(true);

		act(() => {
			container?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		});

		expect(container?.classList.contains("is-enabled")).toBe(false);
		await Promise.resolve();
		expect(plugin.settings.useApiToken).toBe(false);
	});

	test("persists the full autocompleted folder path, not the typed prefix", async () => {
		const plugin = createPlugin(false);
		const tab = new YouTrackSettingTab(plugin.app, plugin);
		tab.containerEl = createContainer();

		act(() => {
			tab.display();
		});

		const notesFolderInput = tab.containerEl.querySelector<HTMLInputElement>('input[placeholder="YouTrack"]');
		if (!notesFolderInput) throw new Error("Notes folder input not found");

		act(() => {
			setNativeInputValue(notesFolderInput, "YouTr");
			notesFolderInput.dispatchEvent(new Event("input", { bubbles: true }));
		});
		await Promise.resolve();
		expect(plugin.settings.notesFolder).toBe("YouTr");

		const folder = new TFolder();
		folder.path = "YouTrack";
		const suggest = new FolderSuggest(plugin.app, notesFolderInput);

		act(() => {
			suggest.selectSuggestion(folder);
		});
		await Promise.resolve();

		expect(notesFolderInput.value).toBe("YouTrack");
		expect(plugin.settings.notesFolder).toBe("YouTrack");
	});
});
