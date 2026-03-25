# Agent Instructions

This project is a React 18 + TypeScript design-system demo with Storybook 8, Vite, and CSS Modules. It has two entry points: a working app (`npm run dev` on :5173) and a component library (`npm run storybook` on :6006).

## Storybook MCP -- Source of Truth

When Storybook is running, an MCP server is available at `http://localhost:6006/mcp`. **Always prefer MCP tools over guessing** when working on UI code.

### Required workflow

1. **Discover** -- call `list-all-documentation` to see every component and its story count.
2. **Read** -- call `get-documentation` for a specific component before using or modifying it. This returns the real prop interface, all documented variants, and example stories.
3. **Write stories** -- call `get-storybook-story-instructions` to get the project's current conventions before creating or editing a `*.stories.tsx` file.
4. **Validate** -- call `run-story-tests` after any change. It runs interaction tests *and* accessibility checks. Fix failures before finishing.
5. **Preview** -- call `preview-stories` to render a visual preview you can share in chat.

### Hard rules

- **CRITICAL: Never hallucinate component properties.** Before using ANY prop on a component, verify it exists via `get-documentation`. If a prop isn't documented, do not assume it exists -- ask the user.
- Never skip step 2 (Read) when composing existing components into new ones.
- Never skip step 4 (Validate) after writing or modifying stories.

## Project Structure

```
.storybook/
  main.ts            # What to load (stories glob, addons, framework)
  preview.ts         # How to render (global CSS, decorators, parameters)
  theme.ts           # Storybook UI branding

src/
  tokens/design-tokens.css   # CSS custom properties (colors, spacing, radii, shadows)
  index.css                  # App-level resets
  components/
    atoms/       # Button, Input, Badge, Avatar, Toggle
    molecules/   # Card, Alert, Tooltip, SearchBar
    organisms/   # Navbar, Sidebar, DataTable, Form
    pages/       # LoginPage, Dashboard
```

Each component is a folder with three co-located files:
- `Component.tsx` -- the component
- `Component.module.css` -- scoped styles consuming design tokens
- `Component.stories.tsx` -- Storybook stories

## Conventions

### Atomic design

Components are categorized by complexity: atoms → molecules → organisms → pages. Place new components at the right level and import only from the same level or below (pages can import organisms, organisms can import atoms/molecules, etc.).

### Styling

- All visual decisions live in `src/tokens/design-tokens.css` as CSS custom properties.
- Components use CSS Modules (`*.module.css`) that reference tokens via `var(--token-name)`.
- Never use inline styles for anything a token covers (colors, spacing, radii, shadows, typography).
- `preview.ts` imports the tokens globally so every story has access.

### Story format (CSF3)

```typescript
import type { Meta, StoryObj } from '@storybook/react'
import { ComponentName } from './ComponentName'

const meta: Meta<typeof ComponentName> = {
  title: 'Level/ComponentName',    // Must mirror folder: 'Atoms/Button', 'Organisms/Navbar'
  component: ComponentName,
  argTypes: { /* control overrides */ },
}
export default meta
type Story = StoryObj<typeof ComponentName>

export const Default: Story = { args: { /* realistic defaults */ } }
```

- `title` must match the folder hierarchy (`Atoms/`, `Molecules/`, `Organisms/`, `Pages/`).
- Every file must have a `Default` story showing the most common real-world state.
- Use `args` for stories controllable via Controls; use `render` for multi-component showcases.
- Use `parameters: { layout: 'fullscreen' }` for page-level stories.
- Add play functions (from `@storybook/test`) for any interactive behavior.

### Naming

- Story exports: PascalCase, named after what they show (`WithValidationErrors`, `Dismissible`, `Mobile`).
- Never name stories after implementation details (`TestCase3`, `WithOnDismissTrue`).

## Documentation

Detailed guides in `docs/`:

| File | Covers |
|------|--------|
| `storybook-architecture.md` | Config files, design tokens, data flow, atomic design rationale |
| `writing-stories.md` | Anatomy of a story, play functions, 8-point quality checklist |
| `addons-and-tooling.md` | Installed addons, MCP addon setup, CI testing with test-runner |
| `faq.md` | Data mocking, layout, viewports, autodocs, CSS Modules |
| `troubleshooting.md` | Common issues and fixes |

## Quick Reference

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start the React app (login → dashboard) on :5173 |
| `npm run storybook` | Launch Storybook on :6006 |
| `npm run build` | Type-check and production build |
| `npm run build-storybook` | Static Storybook export |
