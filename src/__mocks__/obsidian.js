// Mock for Obsidian API
module.exports = {
	Plugin: class Plugin {
		constructor() {}
		loadData() {
			return Promise.resolve({});
		}
		saveData() {
			return Promise.resolve();
		}
		addSettingTab() {}
		addCommand() {}
		addRibbonIcon() {
			return {};
		}
	},
	PluginSettingTab: class PluginSettingTab {
		constructor() {}
	},
	Setting: class Setting {
		constructor() {
			return {
				setName: () => this,
				setDesc: () => this,
				addText: () => this,
				addToggle: () => this,
				addExtraButton: () => this,
			};
		}
	},
	Modal: class Modal {
		constructor() {}
		open() {}
		close() {}
	},
	App: class App {
		constructor() {
			this.vault = {
				adapter: {
					exists: () => Promise.resolve(true),
					read: () => Promise.resolve(""),
				},
				createFolder: () => Promise.resolve(),
				create: () => Promise.resolve(),
				getAbstractFileByPath: () => ({}),
			};
			this.workspace = {
				getLeaf: () => ({
					openFile: () => Promise.resolve(),
				}),
			};
		}
	},
	ToggleComponent: class ToggleComponent {
		constructor(containerEl) {
			this.value = false;
			this.changeCallback = null;
			this.toggleEl = document.createElement("div");
			this.toggleEl.className = "checkbox-container";
			this.checkboxEl = document.createElement("input");
			this.checkboxEl.type = "checkbox";
			this.toggleEl.appendChild(this.checkboxEl);
			this.toggleEl.addEventListener("click", () => this.onClick());
			containerEl.appendChild(this.toggleEl);
		}
		getValue() {
			return this.value;
		}
		setValue(value) {
			this.value = value;
			this.checkboxEl.checked = value;
			this.toggleEl.classList.toggle("is-enabled", value);
			return this;
		}
		setTooltip() {
			return this;
		}
		setDisabled() {
			return this;
		}
		onClick() {
			this.setValue(!this.value);
			if (this.changeCallback) this.changeCallback(this.value);
		}
		onChange(callback) {
			this.changeCallback = callback;
			return this;
		}
	},
	TextComponent: class TextComponent {
		constructor() {
			this.inputEl = {
				focus: () => {},
				select: () => {},
				addEventListener: () => {},
			};
			return {
				setPlaceholder: () => this,
				setValue: () => this,
				onChange: () => this,
				inputEl: this.inputEl,
			};
		}
	},
	TFile: class TFile {},
	TFolder: class TFolder {},
	AbstractInputSuggest: class AbstractInputSuggest {
		constructor() {}
		setValue() {}
		close() {}
	},
	normalizePath: path => path,
	requestUrl: () =>
		Promise.resolve({
			status: 200,
			json: {},
		}),
	Notice: class Notice {
		constructor(message) {
			this.message = message;
		}
	},
};
