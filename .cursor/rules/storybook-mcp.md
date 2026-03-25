---
description: Guidelines for working with UI components and Storybook in this project
globs: ["src/components/**/*", ".storybook/**/*", "**/*.stories.tsx"]
---

# Storybook & Component Guidelines

## Storybook MCP

When the Storybook MCP server is configured, use its tools before making changes to UI components:

- Use `list-all-documentation` to discover available components.
- Use `get-documentation` to check exact props before using any component. Never guess at property names.
- Use `get-storybook-story-instructions` before writing new stories.
- Use `run-story-tests` to validate changes.

## Component Structure

Every component lives in `src/components/{atoms,molecules,organisms,pages}/ComponentName/` with three files:

- `ComponentName.tsx` -- The component with an exported props interface.
- `ComponentName.module.css` -- Scoped styles using design tokens from `src/tokens/design-tokens.css`.
- `ComponentName.stories.tsx` -- Stories in CSF3 format.

## Story Conventions

- Use `Meta<typeof Component>` and `StoryObj` from `@storybook/react`.
- Set `title` to match the folder hierarchy: `'Atoms/Button'`, `'Molecules/Card'`, etc.
- Always include a `Default` story with realistic production-like props.
- Use `args` for stories editable in Controls. Use `render` for side-by-side showcases.
- Add `argTypes` with `control: 'select'` for enum-like props and `action` for callbacks.
- Use play functions from `@storybook/test` for interaction stories (dismiss, submit, sort).
- Use `parameters: { layout: 'fullscreen' }` for page-level stories.

## Design Tokens

All colors, typography, spacing, radii, and shadows are defined as CSS custom properties in `src/tokens/design-tokens.css`. Always use `var(--token-name)` in CSS Modules rather than hardcoded values.
