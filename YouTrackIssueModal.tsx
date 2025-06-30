import React, { useState, useEffect, useRef } from "react";
import { App, Modal, normalizePath } from "obsidian";
import { createRoot, Root } from "react-dom/client";
import type YouTrackPlugin from "./YouTrackPlugin";

interface YouTrackIssueModalProps {
	plugin: YouTrackPlugin;
	onClose: () => void;
}

const YouTrackIssueModalComponent: React.FC<YouTrackIssueModalProps> = ({ plugin, onClose }) => {
	const [issueId, setIssueId] = useState("");
	const [status, setStatus] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isError, setIsError] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		// Focus and select input on mount
		if (inputRef.current) {
			inputRef.current.focus();
			inputRef.current.select();
		}
	}, []);

	const clearStatus = () => {
		setStatus("");
		setIsError(false);
	};

	const showError = (message: string) => {
		setStatus(message);
		setIsError(true);
		setIsLoading(false);
	};

	const fetchIssue = async () => {
		if (!issueId) {
			showError("Please enter an issue ID or URL");
			return;
		}

		const parsedId = plugin.parseIssueId(issueId);
		if (!parsedId) {
			showError("Invalid issue ID or URL (must match your YouTrack URL)");
			return;
		}

		if (plugin.settings.templatePath) {
			const normalizedPath = normalizePath(plugin.settings.templatePath);
			const exists = await plugin.app.vault.adapter.exists(normalizedPath);

			if (!exists) {
				showError(`Template file not found: ${normalizedPath}. Please check the template path in settings.`);
				return;
			}
		}

		setIsLoading(true);
		clearStatus();

		try {
			await plugin.importIssue(parsedId);
			onClose();
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			showError(`Error: ${errorMessage}`);
		}
	};

	const handleKeyPress = (event: React.KeyboardEvent) => {
		if (event.key === "Enter") {
			fetchIssue();
		}
	};

	return (
		<div className="youtrack-modal-content">
			<h2>Fetch YouTrack issue</h2>

			<div className="youtrack-input-container">
				<input
					ref={inputRef}
					type="text"
					className="youtrack-input"
					placeholder="Issue URL or ID (e.g., ABC-123)"
					value={issueId}
					onChange={e => {
						setIssueId(e.target.value);
						clearStatus();
					}}
					onKeyPress={handleKeyPress}
				/>
			</div>

			{status && <p className={`youtrack-status ${isError ? "error-message" : ""}`}>{status}</p>}

			{isLoading && <div className="youtrack-loading visible">Fetching issue...</div>}

			<div className="youtrack-modal-button-container">
				<button onClick={onClose}>Cancel</button>
				<button className="mod-cta" onClick={fetchIssue} disabled={isLoading}>
					Fetch issue
				</button>
			</div>
		</div>
	);
};

export default class YouTrackIssueModal extends Modal {
	plugin: YouTrackPlugin;
	private root: Root | null = null;

	constructor(app: App, plugin: YouTrackPlugin) {
		super(app);
		this.plugin = plugin;
	}

	onOpen() {
		const { contentEl } = this;
		this.root = createRoot(contentEl);

		this.root.render(<YouTrackIssueModalComponent plugin={this.plugin} onClose={() => this.close()} />);
	}

	onClose() {
		if (this.root) {
			this.root.unmount();
			this.root = null;
		}
		const { contentEl } = this;
		contentEl.empty();
	}
}
