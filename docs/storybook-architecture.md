# Storybook Architecture Guide

How Storybook is configured in this project and how the pieces connect.

For related topics, see the other docs in this folder:

- [Writing Stories](./writing-stories.md) -- How to write good stories, anatomy of a story file, play functions
- [Addons and Tooling](./addons-and-tooling.md) -- Installed addons, MCP addon for AI, CI testing
- [FAQ](./faq.md) -- Common questions about data mocking, layout, viewports, autodocs, and more
- [Troubleshooting](./troubleshooting.md) -- Solutions for common issues

---

## High-Level Overview

```
.storybook/
  main.ts        --- What to load (stories, addons, framework)
  preview.ts     --- How to render (global styles, decorators, parameters)
  theme.ts       --- How the Storybook UI itself looks (branding)

src/
  tokens/design-tokens.css   --- Shared design language (CSS custom properties)
  components/
    atoms/Button/
      Button.tsx             --- The component
      Button.module.css      --- Scoped styles consuming design tokens
      Button.stories.tsx     --- Stories that document and test the component
```

The three `.storybook/` files configure Storybook itself. Every component then has a co-located `.stories.tsx` file that Storybook discovers automatically.

---

## Two Entry Points: The App vs Storybook

This project has two ways to run, and they serve different purposes:

| | `npm run dev` | `npm run storybook` |
|---|---|---|
| **What it runs** | The React application (Vite) | The Storybook component explorer |
| **URL** | http://localhost:5173 | http://localhost:6006 |
| **What you see** | Login page -> Dashboard (with routing) | Every component in isolation with docs |
| **Who it's for** | End users, stakeholders reviewing the product | Developers, designers, QA reviewing components |
| **Shared code** | Same components, same CSS Modules, same design tokens | Same components, same CSS Modules, same design tokens |

Both use the same Vite build pipeline, the same TypeScript config, and the same component source files. The difference is context: the app wires components into pages with routing and state, while Storybook renders each component independently with controls and documentation.

---

## Atomic Design: Why This Folder Structure?

Components are organized into four levels following [atomic design](https://bradfrost.com/blog/post/atomic-web-design/) principles:

```
src/components/
  atoms/        -> Smallest building blocks (Button, Input, Badge, Avatar, Toggle)
  molecules/    -> Combine atoms into patterns (Card, Alert, Tooltip, SearchBar)
  organisms/    -> Complex sections from atoms + molecules (Navbar, Sidebar, DataTable, Form)
  pages/        -> Full screens composed from all levels (LoginPage, Dashboard)
```

**Why this matters for Storybook:**

- The `title` in each story meta mirrors this hierarchy (`'Atoms/Button'`, `'Molecules/Card'`, etc.), so the Storybook sidebar mirrors the code structure.
- During a demo, you can walk the sidebar top-to-bottom: start with a single Button, show how it composes into a Card, then into a Navbar, and finally into a full Dashboard. The composition is visible at every level.
- It establishes a shared vocabulary between design and engineering: when a designer says "atom," everyone knows what scope that means.

**Composition in practice:**

| Component | Composes |
|-----------|----------|
| Alert | Its own markup (icon + text + dismiss button) |
| SearchBar | Its own markup (icon + input + clear button) |
| Form | `Input` (atom) + `Button` (atom) |
| Navbar | `Avatar` (atom) + nav links |
| Dashboard | `Navbar` (organism) + `Sidebar` (organism) + `Card` (molecule) + `DataTable` (organism) + `SearchBar` (molecule) + `Badge` (atom) |

---

## `.storybook/main.ts` -- The Entry Point

`main.ts` tells Storybook **what** to load and **how** to build.

```typescript
// .storybook/main.ts
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],   // 1. Where to find stories
  addons: [                                      // 2. Which addons to enable
    '@storybook/addon-essentials',               //    Controls, Actions, Viewport, Docs
    '@storybook/addon-a11y',                     //    Accessibility auditing
    '@storybook/addon-interactions',             //    Interaction testing panel
    '@storybook/addon-links',                    //    Cross-linking between stories
  ],
  framework: {                                   // 3. Build system
    name: '@storybook/react-vite',               //    Uses Vite (shared with the app)
  },
  typescript: {
    reactDocgen: 'react-docgen-typescript',      // 4. Prop table generation
  },
}
```

Key decisions:

| Setting | What it does |
|---------|-------------|
| `stories` glob | Recursively finds every `*.stories.ts(x)` file under `src/`. Adding a new story file is all you need -- no manual registration. |
| `@storybook/react-vite` | Reuses the project's Vite config so aliases, CSS Modules, and plugins work identically in Storybook and the app. |
| `react-docgen-typescript` | Parses TypeScript interfaces (e.g. `ButtonProps`) to auto-generate the Controls table in the docs. |
| Addons | Each addon adds a panel tab. `addon-essentials` bundles Controls, Actions, Viewport, Backgrounds, and Docs. |

---

## `.storybook/preview.ts` -- Global Rendering Config

`preview.ts` controls **how** every story renders. It runs in the preview iframe, not the Storybook manager.

```typescript
// .storybook/preview.ts
import '../src/tokens/design-tokens.css'   // 1. Design tokens available everywhere
import '../src/index.css'                   // 2. App-level resets
import theme from './theme'                 // 3. Branded docs pages

const preview: Preview = {
  parameters: {
    docs: { theme },                        // Custom theme for Docs pages
    controls: {
      matchers: {
        color: /(background|color)$/i,      // Auto-use color picker for color props
        date: /Date$/i,                     // Auto-use date picker for date props
      },
    },
    layout: 'centered',                     // Default layout for all stories
  },
  tags: ['autodocs'],                       // Generate a Docs page for every component
}
```

Key decisions:

| Setting | What it does |
|---------|-------------|
| CSS imports | By importing `design-tokens.css` here, every story can use tokens like `var(--color-primary-500)` without per-story imports. |
| `layout: 'centered'` | Centers the component in the canvas by default. Individual stories can override this (e.g. `layout: 'fullscreen'` for page stories). |
| `tags: ['autodocs']` | Generates a **Docs** page for every component automatically. The Docs page shows the prop table, all stories, and code snippets. |
| `controls.matchers` | Tells Storybook to render a color picker for any prop whose name ends in "color" or "background", and a date picker for props ending in "Date". |

---

## `.storybook/theme.ts` -- UI Branding

`theme.ts` customizes Storybook's **own** chrome (sidebar, toolbar, panels) -- not the component preview.

```typescript
// .storybook/theme.ts
import { create } from '@storybook/theming'

export default create({
  base: 'light',
  brandTitle: 'Design System',          // Text in the top-left corner
  brandUrl: '/',
  colorPrimary: '#6366f1',              // Indigo -- matches our design tokens
  colorSecondary: '#6366f1',
  appBg: '#f8fafc',                     // Sidebar background (neutral-50)
  appContentBg: '#ffffff',              // Canvas background
  appBorderColor: '#e2e8f0',            // Neutral-200
  barSelectedColor: '#6366f1',          // Active tab indicator
  // ...
})
```

The theme is imported in `preview.ts` to style the Docs pages, and could also be used in a `manager.ts` file to style the sidebar/toolbar if needed.

---

## Design Tokens -- The Shared Language

`src/tokens/design-tokens.css` defines all visual decisions as CSS custom properties on `:root`:

```css
:root {
  /* Colors: full scale per intent */
  --color-primary-500: #6366f1;
  --color-danger-500:  #ef4444;
  --color-neutral-200: #e2e8f0;

  /* Typography */
  --text-sm: 0.875rem;
  --font-semibold: 600;

  /* Spacing */
  --space-4: 1rem;

  /* Radius, shadows, transitions... */
}
```

Components consume these tokens in their CSS Modules:

```css
/* Button.module.css */
.button {
  font-family: var(--font-sans);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}
.primary {
  background-color: var(--color-primary-500);
  color: var(--color-white);
}
```

Because `preview.ts` imports the tokens globally, every Storybook story sees them. Changing a token value in one place updates every component.

---

## Sidebar Hierarchy

The `title` in each meta determines the Storybook sidebar tree:

```
Atoms/          <- group
  Avatar        <- component (from title: 'Atoms/Avatar')
  Badge
  Button
  Input
  Toggle
Molecules/
  Alert
  Card
  SearchBar
  Tooltip
Organisms/
  DataTable
  Form
  Navbar
  Sidebar
Pages/
  Dashboard
  LoginPage
```

This follows **atomic design** -- the same hierarchy used in the `src/components/` folder structure, making the mapping between code and Storybook navigation obvious.

---

## How Parameters Override

Parameters cascade. A value set in `preview.ts` applies globally, but a story can override it:

```
preview.ts          ->  layout: 'centered'       (global default)
  Navbar meta       ->  layout: 'fullscreen'      (overrides for all Navbar stories)
    Navbar/Mobile   ->  viewport: 'mobile1'        (adds viewport for this one story)
```

The most specific value wins. This lets you set sensible defaults once and only override where needed.

---

## Data Flow Diagram

```
+----------------+     discovers     +-----------------------+
|  main.ts       | ----------------> |  *.stories.tsx files   |
|  (config)      |                   |  (per component)       |
+-------+--------+                   +-----------+-----------+
        |                                        |
        | loads addons                          | exports meta + stories
        v                                        v
+----------------+                   +-----------------------+
|  Addons        |                   |  preview.ts           |
|  Controls      |<------------------|  (global styles,      |
|  Actions       |  applies global   |   decorators,         |
|  A11y          |  parameters to    |   parameters)         |
|  Viewport      |  every story      +-----------+-----------+
|  Interactions  |                               |
+----------------+                               | imports
                                                 v
                                    +-----------------------+
                                    |  design-tokens.css    |
                                    |  index.css            |
                                    +-----------------------+
```

---

## Adding a New Component

1. Create the component folder under the appropriate level:
   ```
   src/components/atoms/Chip/
     Chip.tsx
     Chip.module.css
     Chip.stories.tsx
   ```

2. Write the story file following the pattern (see [Writing Stories](./writing-stories.md) for details):
   ```typescript
   const meta: Meta<typeof Chip> = {
     title: 'Atoms/Chip',       // sidebar placement
     component: Chip,
   }
   export default meta
   type Story = StoryObj<typeof Chip>

   export const Default: Story = {
     args: { label: 'Tag' },
   }
   ```

3. That's it. Storybook's `stories` glob in `main.ts` picks it up automatically. No registration needed.
