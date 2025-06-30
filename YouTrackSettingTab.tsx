import React, { useState, useEffect } from "react";
import { App, PluginSettingTab } from "obsidian";
import { createRoot, Root } from "react-dom/client";
import type YouTrackPlugin from "./YouTrackPlugin";

interface YouTrackSettingsProps {
	plugin: YouTrackPlugin;
}

const YouTrackSettingsComponent: React.FC<YouTrackSettingsProps> = ({ plugin }) => {
	const [youtrackUrl, setYoutrackUrl] = useState(plugin.settings.youtrackUrl);
	const [notesFolder, setNotesFolder] = useState(plugin.settings.notesFolder);
	const [templatePath, setTemplatePath] = useState(plugin.settings.templatePath);
	const [useApiToken, setUseApiToken] = useState(plugin.settings.useApiToken);
	const [apiToken, setApiToken] = useState(plugin.settings.apiToken);

	const saveSettings = async () => {
		await plugin.saveSettings();
	};

	const handleYoutrackUrlChange = async (value: string) => {
		// Remove trailing slash if present
		const cleanedValue = value.replace(/\/$/, "");
		setYoutrackUrl(cleanedValue);
		plugin.settings.youtrackUrl = cleanedValue;
		await saveSettings();
	};

	const handleNotesFolderChange = async (value: string) => {
		setNotesFolder(value);
		plugin.settings.notesFolder = value;
		await saveSettings();
	};

	const handleTemplatePathChange = async (value: string) => {
		setTemplatePath(value);
		plugin.settings.templatePath = value;
		await saveSettings();
	};

	const handleUseApiTokenChange = async (value: boolean) => {
		setUseApiToken(value);
		plugin.settings.useApiToken = value;
		await saveSettings();
	};

	const handleApiTokenChange = async (value: string) => {
		setApiToken(value);
		plugin.settings.apiToken = value;
		await saveSettings();
	};

	const openHelpUrl = (url: string) => {
		window.open(url, "_blank");
	};

	return (
		<div className="youtrack-settings">
			<div className="setting-item">
				<div className="setting-item-info">
					<div className="setting-item-name">YouTrack URL</div>
					<div className="setting-item-description">
						URL of your YouTrack installation (e.g., https://youtrack.jetbrains.com)
					</div>
				</div>
				<div className="setting-item-control">
					<input
						type="text"
						value={youtrackUrl}
						onChange={e => handleYoutrackUrlChange(e.target.value)}
						placeholder="https://youtrack.jetbrains.com"
					/>
				</div>
			</div>

			<div className="setting-item">
				<div className="setting-item-info">
					<div className="setting-item-name">Notes folder</div>
					<div className="setting-item-description">
						Folder to store YouTrack issue notes (leave empty for vault root)
					</div>
				</div>
				<div className="setting-item-control">
					<input
						type="text"
						value={notesFolder}
						onChange={e => handleNotesFolderChange(e.target.value)}
						placeholder="YouTrack"
					/>
				</div>
			</div>

			<div className="setting-item">
				<div className="setting-item-info">
					<div className="setting-item-name">Note template</div>
					<div className="setting-item-description">
						Path to a template file in your vault. Use $&#123;id&#125;, $&#123;title&#125;, $&#123;url&#125; and any
						issue fields as placeholders (leave empty for default template). You can also use arbitrarily nested fields,
						e.g., $&#123;project.team.name&#125;.
					</div>
				</div>
				<div className="setting-item-control">
					<input
						type="text"
						value={templatePath}
						onChange={e => handleTemplatePathChange(e.target.value)}
						placeholder="Template path"
					/>
					<button
						className="clickable-icon"
						onClick={() => openHelpUrl("https://www.jetbrains.com/help/youtrack/devportal/api-entity-Issue.html")}
						title="Help"
					>
						?
					</button>
				</div>
			</div>

			<div className="setting-item">
				<div className="setting-item-info">
					<div className="setting-item-name">Use API token authentication</div>
					<div className="setting-item-description">Enable to use a permanent API token for authentication</div>
				</div>
				<div className="setting-item-control">
					<div className="checkbox-container">
						<input type="checkbox" checked={useApiToken} onChange={e => handleUseApiTokenChange(e.target.checked)} />
					</div>
				</div>
			</div>

			{useApiToken && (
				<div className="setting-item">
					<div className="setting-item-info">
						<div className="setting-item-name">API token</div>
						<div className="setting-item-description">Permanent API token for YouTrack authentication</div>
					</div>
					<div className="setting-item-control">
						<input
							type="password"
							value={apiToken}
							onChange={e => handleApiTokenChange(e.target.value)}
							placeholder="Enter your API token"
						/>
						<button
							className="clickable-icon"
							onClick={() => openHelpUrl("https://www.jetbrains.com/help/youtrack/server/manage-permanent-token.html")}
							title="Help"
						>
							?
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

export default class YouTrackSettingTab extends PluginSettingTab {
	plugin: YouTrackPlugin;
	private root: Root | null = null;

	constructor(app: App, plugin: YouTrackPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		this.root = createRoot(containerEl);
		this.root.render(<YouTrackSettingsComponent plugin={this.plugin} />);
	}

	hide(): void {
		if (this.root) {
			this.root.unmount();
			this.root = null;
		}
	}
}
