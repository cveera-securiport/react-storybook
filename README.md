# React Storybook Demo

A design-system demo built with React, TypeScript, and Storybook 8. It showcases how components at every level of atomic design (atoms, molecules, organisms, pages) can be developed, documented, and tested in isolation using Storybook.

## Tech Stack

- **React 18** + **TypeScript**
- **Vite** for dev server and builds
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

Storybook opens at **http://localhost:6006**.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the Vite dev server |
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