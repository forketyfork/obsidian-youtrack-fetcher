# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

- `yarn dev` - Development build with watch mode
- `yarn typecheck` — TypeScript typecheck
- `yarn format` - Format code with Prettier
- `yarn build` - Production build (includes typecheck and formatting)
- `yarn build:css` - Minify CSS
- `yarn version` - Bump version in manifest.json and versions.json

## Typescript & Linting

- Strict null checks required (strictNullChecks: true)
- No implicit any values (noImplicitAny: true)
- Run type check with `yarn typecheck`
- ESLint is configured with typescript-eslint plugin

## Code Style

- Avoid useless comments, use them to communicate obscure things and intentions which are not clear from the code rather than obvious details
- Use Obsidian API imports from a single import statement
- Use interfaces for type definitions
- Add explicit error handling with try/catch blocks
- Use async/await for asynchronous operations
- Error messages should be user-friendly
- Avoid unnecessary logging to the console, no debug messages, only errors
- Use consistent indentation (tabs) and spacing
- Class methods order: lifecycle methods first, then functionality
