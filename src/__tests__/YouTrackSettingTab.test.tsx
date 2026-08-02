import { act } from "react";
import { App } from "obsidian";
import YouTrackSettingTab from "../YouTrackSettingTab";
import type YouTrackPlugin from "../YouTrackPlugin";

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
});
