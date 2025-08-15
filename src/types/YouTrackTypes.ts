export interface YouTrackIssue {
	idReadable: string;
	summary: string;
	customFields: {
		name: string;
		value: {
			name: string;
		};
	}[];
}

export interface YouTrackPluginSettings {
	youtrackUrl: string;
	apiToken: string;
	useApiToken: boolean;
	notesFolder: string;
	templatePath: string;
	queryHistory: string[];
}
