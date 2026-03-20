# React Storybook Demo

A design-system demo built with React, TypeScript, and Storybook 8. It includes a working React application with client-side routing (Login and Dashboard pages) and a full Storybook component library showcasing every level of atomic design.

## Tech Stack

- **React 18** + **TypeScript**
- **Vite** for dev server and builds
- **React Router** for client-side navigation
- **Storybook 8** with Controls, Actions, Viewport, A11y, Docs, and Interactions addons
- **CSS Modules** with design tokens via CSS custom properties

## Getting Started

```bash
# Install dependencies
npm install

# Run the React app
npm run dev

# Launch Storybook (component library)
npm run storybook
```

The React app opens at **http://localhost:5173** and Storybook at **http://localhost:6006**.

## The React App

Running `npm run dev` launches a working application with two routes:

- **`/login`** -- A split-screen login page. Enter any email and password (fields just can't be empty) and click **Sign in** to navigate to the dashboard.
- **`/dashboard`** -- A full dashboard with navbar, collapsible sidebar, stat cards, search bar, and a sortable data table.

All other routes redirect to `/login`.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the React app (login → dashboard) |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build |
| `npm run storybook` | Launch Storybook on port 6006 |
| `npm run build-storybook` | Build a static Storybook site |

## Component Library

The project follows **atomic design** principles. All components live under `src/components/`:

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

## Design Tokens

All visual decisions (colors, typography, spacing, radii, shadows) are defined as CSS custom properties in `src/tokens/design-tokens.css` and imported globally into Storybook via `.storybook/preview.ts`.

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