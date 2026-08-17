import { App, PluginManifest } from "obsidian";
import YouTrackIssueModal from "../YouTrackIssueModal";
import YouTrackPlugin from "../YouTrackPlugin";

jest.mock("obsidian", () => {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Jest's runtime mock has no static module type
	const obsidianMock = jest.requireActual("../__mocks__/obsidian");
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return -- Return the mock with Jest's runtime-provided shape
	return { ...obsidianMock };
});

interface ModalElements {
	input: HTMLInputElement;
	status: HTMLParagraphElement;
	loading: HTMLDivElement;
	fetchButton: HTMLButtonElement;
}

async function createModal(): Promise<{
	app: App;
	plugin: YouTrackPlugin;
	modal: YouTrackIssueModal;
	elements: ModalElements;
}> {
	const app = new App();
	const plugin = new YouTrackPlugin(app, {} as PluginManifest);
	await plugin.loadSettings();
	const modal = new YouTrackIssueModal(app, plugin);
	modal.onOpen();

	const input = modal.contentEl.querySelector<HTMLInputElement>(".youtrack-fetcher-input");
	const status = modal.contentEl.querySelector<HTMLParagraphElement>(".youtrack-fetcher-status");
	const loading = modal.contentEl.querySelector<HTMLDivElement>(".youtrack-fetcher-loading");
	const fetchButton = Array.from(modal.contentEl.querySelectorAll<HTMLButtonElement>("button")).find(
		button => button.textContent === "Fetch issue"
	);
	if (!input || !status || !loading || !fetchButton) {
		throw new Error("Issue modal did not render its expected controls");
	}

	return { app, plugin, modal, elements: { input, status, loading, fetchButton } };
}

function enterIssue(input: HTMLInputElement, value: string) {
	input.value = value;
	input.dispatchEvent(new Event("input", { bubbles: true }));
}

async function flushPromises() {
	await Promise.resolve();
	await Promise.resolve();
}

describe("YouTrackIssueModal", () => {
	test("shows validation errors without starting an import", async () => {
		const { plugin, elements } = await createModal();
		const importIssue = jest.spyOn(plugin, "importIssue");

		elements.fetchButton.click();

		expect(importIssue).not.toHaveBeenCalled();
		expect(elements.status.textContent).toBe("Please enter an issue ID or URL");
		expect(elements.status.classList.contains("youtrack-fetcher-error-message")).toBe(true);
		expect(elements.fetchButton.disabled).toBe(false);
	});

	test("disables repeated submission while importing and closes after success", async () => {
		const { plugin, modal, elements } = await createModal();
		let completeImport!: () => void;
		const importIssue = jest.spyOn(plugin, "importIssue").mockImplementation(
			() =>
				new Promise<void>(resolve => {
					completeImport = resolve;
				})
		);
		const close = jest.spyOn(modal, "close");
		enterIssue(elements.input, "ABC-123");

		elements.fetchButton.click();

		expect(importIssue).toHaveBeenCalledWith("ABC-123");
		expect(elements.fetchButton.disabled).toBe(true);
		expect(elements.loading.classList.contains("visible")).toBe(true);

		completeImport();
		await flushPromises();

		expect(close).toHaveBeenCalledTimes(1);
	});

	test("reports a missing configured template before importing", async () => {
		const { app, plugin, elements } = await createModal();
		plugin.settings.templatePath = "Templates/issue.md";
		jest.spyOn(app.vault, "getAbstractFileByPath").mockReturnValue(null);
		const importIssue = jest.spyOn(plugin, "importIssue");
		enterIssue(elements.input, "ABC-123");

		elements.fetchButton.click();
		await flushPromises();

		expect(importIssue).not.toHaveBeenCalled();
		expect(elements.status.textContent).toBe(
			"Template file not found: Templates/issue.md. Please check the template path in settings."
		);
	});

	test("restores the controls and displays import errors", async () => {
		const { plugin, elements } = await createModal();
		jest.spyOn(plugin, "importIssue").mockRejectedValue(new Error("Network unavailable"));
		enterIssue(elements.input, "ABC-123");

		elements.fetchButton.click();
		await flushPromises();

		expect(elements.status.textContent).toBe("Error: Network unavailable");
		expect(elements.status.classList.contains("youtrack-fetcher-error-message")).toBe(true);
		expect(elements.fetchButton.disabled).toBe(false);
		expect(elements.loading.classList.contains("visible")).toBe(false);
	});
});
