import React, { useEffect, useRef, useState } from "react";
import { App, Modal, normalizePath, TFile } from "obsidian";
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
		inputRef.current?.focus();
		inputRef.current?.select();
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
			const file = plugin.app.vault.getAbstractFileByPath(normalizedPath);

			if (!file || !(file instanceof TFile)) {
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

	const handleKeyDown = (event: React.KeyboardEvent) => {
		if (event.key === "Enter" && !isLoading) {
			fetchIssue().catch(console.error);
		}
	};

	return (
		<>
			<h2>Fetch YouTrack issue</h2>

			<div className="youtrack-fetcher-input-container">
				<input
					ref={inputRef}
					type="text"
					className="youtrack-fetcher-input"
					placeholder="Issue URL or ID (e.g., ABC-123)"
					value={issueId}
					onChange={e => {
						setIssueId(e.target.value);
						clearStatus();
					}}
					onKeyDown={handleKeyDown}
				/>
			</div>

			{status && (
				<p className={`youtrack-fetcher-status ${isError ? "youtrack-fetcher-error-message" : ""}`}>{status}</p>
			)}

			<div className={`youtrack-fetcher-loading ${isLoading ? "visible" : ""}`}>Fetching issue...</div>

			<div className="youtrack-fetcher-modal-button-container">
				<button onClick={onClose}>Cancel</button>
				<button className="mod-cta" onClick={() => void fetchIssue().catch(console.error)} disabled={isLoading}>
					Fetch issue
				</button>
			</div>
		</>
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
