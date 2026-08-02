# React Migration

This document outlines the migration of the YouTrack Obsidian Plugin UI from vanilla TypeScript to React.

## Changes Made

### 1. Dependencies Added

- `react` and `react-dom` - Core React libraries
- `@types/react` and `@types/react-dom` - TypeScript definitions for React

### 2. Build Configuration Updated

- **esbuild.config.mjs**: Added JSX support with `jsx: "automatic"` and `jsxImportSource: "react"`
- **tsconfig.json**: Added React JSX compilation support and included `.tsx` files

### 3. Components Migrated

#### YouTrackIssueModal.tsx

- Converted from vanilla TypeScript modal to React functional component
- Uses React hooks (`useState`, `useEffect`, `useRef`) for state management
- Maintains the same functionality as the original modal
- Improved user experience with proper focus management and loading states

#### YouTrackSettingTab.tsx

- Converted from Obsidian's Setting API to React component
- Uses React state for real-time updates
- Maintains all original settings functionality
- Improved styling and user interface

### 4. Styling

- The settings tab reuses Obsidian's native CSS classes (`setting-item`, `checkbox-container`, `clickable-icon`, etc.) instead of introducing custom overrides, so it stays consistent with core styling and other plugins
- The issue modal keeps its `youtrack-fetcher-` prefixed classes, per this project's CSS conventions

### 5. Integration

- React components are rendered using React 19's `createRoot` API
- Proper cleanup with `unmount()` when components are destroyed
- Maintains compatibility with Obsidian's plugin architecture
- `FileSuggest`/`FolderSuggest` type-ahead inputs are wired up via refs in `useEffect`

## Features Preserved

All original functionality has been preserved:

- Fetching YouTrack issues by ID or URL
- Template-based note creation
- Settings management (URL, folder, template, API token)
- Error handling and validation
- Keyboard shortcuts (Enter to submit)

## Benefits of React Migration

1. **Better State Management**: React hooks provide cleaner state management
2. **Improved User Experience**: Better loading states, focus management, and interactions
3. **Enhanced Maintainability**: Component-based architecture is easier to maintain
4. **Modern Development**: Uses current web development best practices
5. **Better Styling**: More consistent and polished user interface

## Technical Details

- React components are wrapped in Obsidian Modal/PluginSettingTab classes
- Uses React 19's `createRoot` API for rendering
- TypeScript support maintained throughout
- All tests continue to pass
- Build process remains the same with additional JSX compilation

The migration maintains full backward compatibility while providing a more modern and maintainable codebase.
