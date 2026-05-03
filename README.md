# React Storybook Design System

An Nx-managed monorepo containing a React 18 + TypeScript design system with Storybook 8. It includes a shell application with client-side routing (Login and Dashboard pages) and a component library organized by atomic design principles.

## Tech Stack

- **React 18** + **TypeScript**
- **Nx** for monorepo orchestration, caching, and task dependencies
- **Vite** for dev server and builds
- **React Router** for client-side navigation
- **Storybook 8** with Controls, Actions, Viewport, A11y, Docs, and Interactions addons
- **CSS Modules** with design tokens via CSS custom properties
- **pnpm** as the package manager

## Getting Started

```bash
# Install dependencies
pnpm install

# Run the shell app
pnpm dev

# Launch Storybook (component library)
pnpm storybook
```

The shell app opens at **http://localhost:5173** and Storybook at **http://localhost:6006**.

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start the shell app via Vite (`:5173`) |
| `pnpm build` | Type-check and production build the shell app |
| `pnpm preview` | Preview the shell app production build |
| `pnpm storybook` | Launch Storybook on `:6006` |
| `pnpm build-storybook` | Build a static Storybook site |
| `pnpm test` | Run tests across all projects |
| `pnpm lint` | Lint all projects |
| `pnpm graph` | Visualize the Nx project dependency graph |
| `pnpm nx dev shell` | Start the shell app (explicit Nx target) |
| `pnpm nx build shell` | Build the shell app (explicit Nx target) |
| `pnpm nx run-many --target=build --all` | Build all projects |
| `pnpm nx affected --target=test` | Test only projects affected by recent changes |

## Project Structure

```
apps/
  shell/                     # Vite application (login → dashboard)
    src/
      App.tsx                # Routes and entry point
      main.tsx               # React DOM mount
      index.css              # Global resets

libs/
  shared/
    ui/                      # @csv/ui — all UI components
      src/
        components/
          atoms/             # Button, Input, Badge, Avatar, Toggle
          molecules/         # Card, Alert, Tooltip, SearchBar
          organisms/         # Navbar, Sidebar, DataTable, Form
          pages/             # LoginPage, Dashboard
        index.ts             # Public API barrel export
    tokens/                  # @csv/tokens — design tokens
      src/
        design-tokens.css    # CSS custom properties
    schema-forms/            # @csv/schema-forms — schema-driven forms (planned)
      src/
        index.ts

.storybook/                  # Storybook configuration
  main.ts                    # Stories glob, addons, framework
  preview.ts                 # Global CSS, decorators, parameters
  theme.ts                   # Storybook UI branding

docs/                        # Architecture and usage guides
```

### Import Aliases

| Alias | Resolves to |
|-------|-------------|
| `@csv/ui` | `libs/shared/ui/src` |
| `@csv/tokens` | `libs/shared/tokens/src` |
| `@csv/schema-forms` | `libs/shared/schema-forms/src` |

## The Shell App

Running `pnpm dev` launches a working application with two routes:

- **`/login`** -- A split-screen login page. Enter any email and password (fields just can't be empty) and click **Sign in** to navigate to the dashboard.
- **`/dashboard`** -- A full dashboard with navbar, collapsible sidebar, stat cards, search bar, and a sortable data table.

All other routes redirect to `/login`.

## Component Library (`@csv/ui`)

Components follow **atomic design** principles and live under `libs/shared/ui/src/components/`.

### Atoms
Small, self-contained UI primitives.

- **Button** -- Variants (primary, secondary, outline, ghost, danger), sizes, loading state
- **Input** -- Text/email/password types, validation states, helper text
- **Badge** -- Color variants, sizes, dot indicator
- **Avatar** -- Image with initials fallback, status indicator
- **Toggle** -- Switch control with label and size options

### Molecules
Compositions of atoms that form distinct UI patterns.

- **Card** -- Image card, stat card, profile card
- **Alert** -- Info/success/warning/error with dismiss interaction
- **Tooltip** -- Placement options (top, bottom, left, right)
- **SearchBar** -- Search input with clear button

### Organisms
Complex UI sections composed of atoms and molecules.

- **Navbar** -- Brand, navigation links, avatar, responsive menu
- **Sidebar** -- Collapsible navigation with sections and icons
- **DataTable** -- Sortable columns, row selection, pagination
- **Form** -- Dynamic fields, validation, half-width layout support

### Pages
Full page compositions demonstrating how everything fits together.

- **LoginPage** -- Split-screen login with hero, form, and validation
- **Dashboard** -- Navbar + Sidebar + stat cards + data table

## Design Tokens (`@csv/tokens`)

All visual decisions (colors, typography, spacing, radii, shadows) are defined as CSS custom properties in `libs/shared/tokens/src/design-tokens.css` and imported globally into Storybook via `.storybook/preview.ts`.

## Storybook Features Demonstrated

- **Controls** -- Live prop manipulation on every component
- **Autodocs** -- Auto-generated documentation pages
- **Actions** -- Event tracking (clicks, form submissions, navigation)
- **Accessibility (A11y)** -- Real-time accessibility auditing
- **Interaction Testing** -- Play functions that simulate user flows on Alert, Form, LoginPage, and DataTable
- **Viewport** -- Responsive testing on Navbar and page-level stories

## Documentation

Detailed guides live in the `docs/` folder:

| Document | Description |
|----------|-------------|
| [Storybook Architecture](docs/storybook-architecture.md) | How the config files connect, design tokens, data flow, atomic design rationale |
| [Writing Stories](docs/writing-stories.md) | Anatomy of a story file, play functions, 8-point checklist for good stories |
| [Addons and Tooling](docs/addons-and-tooling.md) | Installed addons, Storybook MCP addon for AI agents, CI testing |
| [FAQ](docs/faq.md) | Data mocking, layout, viewports, autodocs, CSS Modules, design tokens |
| [Troubleshooting](docs/troubleshooting.md) | Common issues and solutions |
| [Schema-Driven UI Framework Plan](docs/schema-driven-ui-framework-plan.md) | Architecture for `@csv/schema-forms` |
| [V1 Execution Plan](docs/v1-execution-plan.md) | 5-day implementation plan for schema-forms v1 |