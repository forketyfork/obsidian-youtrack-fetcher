# UI implementation

The plugin UI uses Obsidian's native components and DOM helpers. Keeping the UI on the host APIs avoids shipping a separate rendering runtime and keeps the production bundle small and compatible with Obsidian's plugin review checks.

## Modals

`YouTrackIssueModal` and `YouTrackSearchModal` extend Obsidian's `Modal` class. They create their controls with helpers such as `createEl()` and `createDiv()`, attach event listeners when opened, and remove their listeners and content when closed.

The issue modal preserves its input focus, validation, loading, and error states without a UI framework. Both modals use `youtrack-fetcher-` prefixed CSS classes.

## Settings

`YouTrackSettingTab` uses Obsidian's declarative settings API (`getSettingDefinitions()`, available since Obsidian 1.13.0). Each standard field is described as a data object so Obsidian can render and index it for settings search. The API token field uses the declarative API's `render` escape hatch because it needs a masked input.

## Review compatibility

The local CSS lint task uses Obsidian's official Stylelint configuration, which mirrors the CSS rules from the community review and detects unsupported browser features in authored styles. Obsidian's community plugin review still separately scans the generated `main.js` and `styles.css` release artifacts. The native implementation avoids the dynamic `<script>` creation and partially supported `clip-path` findings that prompted this migration without attempting to duplicate the complete community scanner locally.
