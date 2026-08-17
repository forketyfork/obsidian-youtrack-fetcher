// Mock for Obsidian API

class ToggleComponent {
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
}

class TextComponent {
	constructor() {
		this.inputEl = {
			type: "text",
			value: "",
			placeholder: "",
			focus: () => {},
			select: () => {},
			addEventListener: () => {},
		};
		this.changeCallback = null;
	}
	setPlaceholder(placeholder) {
		this.inputEl.placeholder = placeholder;
		return this;
	}
	setValue(value) {
		this.inputEl.value = value;
		return this;
	}
	getValue() {
		return this.inputEl.value;
	}
	onChange(callback) {
		this.changeCallback = callback;
		return this;
	}
}

class Setting {
	constructor(containerEl) {
		this.containerEl = containerEl ?? document.createElement("div");
	}
	setName() {
		return this;
	}
	setDesc() {
		return this;
	}
	setHeading() {
		return this;
	}
	addText(cb) {
		this.textComponent = new TextComponent();
		cb(this.textComponent);
		return this;
	}
	addToggle(cb) {
		this.toggleComponent = new ToggleComponent(this.containerEl);
		cb(this.toggleComponent);
		return this;
	}
	addExtraButton() {
		return this;
	}
}

module.exports = {
	Plugin: class Plugin {
		constructor(app) {
			this.app = app;
		}
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
	Setting,
	Modal: class Modal {
		constructor(app) {
			this.app = app;
			this.containerEl = document.createElement("div");
			this.modalEl = this.containerEl.createDiv();
			this.titleEl = this.modalEl.createDiv();
			this.contentEl = this.modalEl.createDiv();
		}
		open() {
			this.onOpen?.();
		}
		close() {
			this.onClose?.();
		}
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
	ToggleComponent,
	TextComponent,
	TFile: class TFile {},
	TFolder: class TFolder {},
	AbstractInputSuggest: class AbstractInputSuggest {
		constructor(app, textInputEl) {
			this.textInputEl = textInputEl;
		}
		setValue(value) {
			this.textInputEl.value = value;
		}
		getValue() {
			return this.textInputEl.value;
		}
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
