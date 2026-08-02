# React Migration

This document outlines the use of React in the YouTrack Obsidian Plugin UI.

## Where React is used

React is used for `YouTrackIssueModal.tsx`, the modal shown when fetching a YouTrack issue by ID or URL:

- Converted from a vanilla TypeScript modal to a React functional component
- Uses React hooks (`useState`, `useEffect`, `useRef`) for state management
- Improved user experience with proper focus management and loading states

The issue modal keeps its `youtrack-fetcher-` prefixed CSS classes, per this project's CSS conventions.

## Where React is not used

`YouTrackSettingTab.ts` uses Obsidian's declarative settings API (`getSettingDefinitions()`/`getControlValue()`/`setControlValue()`, available since Obsidian 1.13.0) instead of React or the classic imperative `Setting` API. Each field (YouTrack URL, notes folder, note template, API token toggle) is described as a plain data object; Obsidian renders the controls, including the native `folder`/`file` type-ahead pickers, and indexes them for the in-app settings search. The API token field has no native masked-input control, so it uses the declarative API's `render` escape hatch to fall back to the imperative `Setting`/`TextComponent` API for that one field.

## Build Configuration

- **esbuild.config.mjs**: JSX support via `jsx: "automatic"` and `jsxImportSource: "react"`, needed for `YouTrackIssueModal.tsx`
- **tsconfig.json**: React JSX compilation support, `.tsx` files included

## Technical Details

- `YouTrackIssueModal` is a React component wrapped in an Obsidian `Modal`, rendered with React 19's `createRoot` API and cleaned up via `unmount()` when the modal closes
- `react`/`react-dom` remain dependencies solely for the issue modal
