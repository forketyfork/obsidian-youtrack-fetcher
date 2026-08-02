// Obsidian's Electron runtime patches `createEl`/`createDiv` onto the global scope;
// jsdom has no such patch, so tests get a minimal version covering only the bare
// tag-name calls our test suite makes (no `DomElementInfo` options support).
global.createEl = tag => document.createElement(tag);
global.createDiv = () => document.createElement("div");
