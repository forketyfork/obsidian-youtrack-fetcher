# YouTrack Fetcher

[![Build status](https://github.com/forketyfork/obsidian-youtrack-fetcher/actions/workflows/build.yml/badge.svg)](https://github.com/forketyfork/obsidian-youtrack-fetcher/actions/workflows/build.yml)
[![Latest Release](https://img.shields.io/github/v/release/forketyfork/obsidian-youtrack-fetcher)](https://github.com/forketyfork/obsidian-youtrack-fetcher/releases/latest)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/language-TypeScript-blue.svg)](https://www.typescriptlang.org/)

This Obsidian plugin allows you to quickly fetch YouTrack issues and create notes from them in your Obsidian vault.

## Features

- Fetch YouTrack issues by ID or URL and create structured notes
- Easy access via keyboard shortcut
- API token authentication support
- Configurable folder for storing issue notes
- Configurable note template
- Use `${field}` placeholders in templates to insert values from fetched fields
- Fields to fetch are parsed from your template automatically
- You can specify arbitrarily nested fields, e.g., `${project.team.name}`
- Search for issues using YouTrack query language and import them from a paginated list

## Installation

### From Obsidian Community Plugins

1. Open Obsidian
2. Go to Settings > Community plugins
3. Disable Safe mode if necessary
4. Click Browse and search for "YouTrack Fetcher"
5. Install the plugin
6. Enable the plugin after installation

### Manual Installation

1. Download the latest release from the GitHub repository
2. Extract the ZIP file into your Obsidian vault's `.obsidian/plugins/` folder
3. Enable the plugin in Obsidian settings

## Usage

1. Set up your YouTrack instance URL in plugin settings
2. Configure API token if required for your YouTrack instance
   ![plugin settings](images/settings.png "Plugin Settings")
3. Use the keyboard shortcut or click the clipboard icon in the ribbon
   ![fetch issue window](images/modal.png "Fetch Issue Window")
4. Enter the issue ID or paste the full issue URL
5. Click "Fetch Issue" to create a note based on the issue data
   ![fetched issue](images/fetched.png "Fetched Issue")

Alternatively, you can use the "Search YouTrack issues" command to open a search modal. Here you can enter a YouTrack query to search for issues. The results are paginated, and you can import any issue from the list.

[TODO: Add screenshot of the search modal]

## Note Format

The plugin creates notes with the following format. As an alternative, specify your own template in the plugin settings. You can use arbitrarily nested fields, e.g., `${project.team.name}`.

```markdown
# ${id}: ${title}

URL: ${url}

## Description

${description}
```

Any field referenced in the template can be used as a placeholder with `${field}`. You can also use arbitrarily nested fields, e.g., `${project.team.name}`.

The issue `summary` can also be used as a `${title}` placeholder.

**See the [YouTrack API Issue entity documentation](https://www.jetbrains.com/help/youtrack/devportal/api-entity-Issue.html) for a list of available fields.**

## Requirements

- Obsidian v0.15.0 or higher
- Access to a YouTrack instance (cloud or self-hosted)

## Troubleshooting

- If you have trouble authenticating, make sure your API token has proper permissions
- For self-hosted instances, check that the REST API is accessible

## Development

### Using Nix and Just (Recommended)

This project includes a Nix flake and direnv configuration for reproducible development environments, along with Just commands for common tasks.

#### Prerequisites

- [Nix](https://nixos.org/download.html) with flakes enabled
- [direnv](https://direnv.net/) (optional but recommended)

#### Setup

1. Clone the repository and enter the directory
2. If using direnv, run `direnv allow` to automatically load the development environment
3. If not using direnv, run `nix develop` to enter the development shell

#### Available Commands

```shell
# List all available commands
just

# Clean build artifacts
just clean

# Install dependencies
just install

# Full production build (includes tests, type checking, and formatting)
just build

# Development build with watch mode
just watch

# Run tests
just test

# Run linter
just lint
```

### Using Yarn Directly

Run the development build with change watch:

```shell
yarn dev:watch
```

Run the TypeScript type check:

```shell
yarn typecheck
```

Run the linter:

```shell
yarn lint
```

Run the tests:

```shell
yarn test
```

Run the tests in watch mode:

```shell
yarn test:watch
```

Generate a coverage report:

```shell
yarn coverage
```

Run the production build (includes tests, type checking, and formatting):

```shell
yarn build
```

Bump the version in `package.json` and `manifest.json`, push the `main` branch,
and publish a new tag:

```shell
yarn release
```

## License

This plugin is licensed under the MIT License.
