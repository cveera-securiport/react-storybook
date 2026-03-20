# Storybook Architecture Guide

How Storybook is configured in this project, how the pieces connect, and the patterns used in stories.

---

## High-Level Overview

```
.storybook/
  main.ts        ─── What to load (stories, addons, framework)
  preview.ts     ─── How to render (global styles, decorators, parameters)
  theme.ts       ─── How the Storybook UI itself looks (branding)

src/
  tokens/design-tokens.css   ─── Shared design language (CSS custom properties)
  components/
    atoms/Button/
      Button.tsx             ─── The component
      Button.module.css      ─── Scoped styles consuming design tokens
      Button.stories.tsx     ─── Stories that document and test the component
```

The three `.storybook/` files configure Storybook itself. Every component then has a co-located `.stories.tsx` file that Storybook discovers automatically.

---

## `.storybook/main.ts` — The Entry Point

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
| `stories` glob | Recursively finds every `*.stories.ts(x)` file under `src/`. Adding a new story file is all you need — no manual registration. |
| `@storybook/react-vite` | Reuses the project's Vite config so aliases, CSS Modules, and plugins work identically in Storybook and the app. |
| `react-docgen-typescript` | Parses TypeScript interfaces (e.g. `ButtonProps`) to auto-generate the Controls table in the docs. |
| Addons | Each addon adds a panel tab. `addon-essentials` bundles Controls, Actions, Viewport, Backgrounds, and Docs. |

---

## `.storybook/preview.ts` — Global Rendering Config

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

## `.storybook/theme.ts` — UI Branding

`theme.ts` customizes Storybook's **own** chrome (sidebar, toolbar, panels) — not the component preview.

```typescript
// .storybook/theme.ts
import { create } from '@storybook/theming'

export default create({
  base: 'light',
  brandTitle: 'Design System',          // Text in the top-left corner
  brandUrl: '/',
  colorPrimary: '#6366f1',              // Indigo — matches our design tokens
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

## Design Tokens — The Shared Language

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

## Anatomy of a Story File

Every component has a co-located `*.stories.tsx` file. Here's the pattern, annotated:

```typescript
// Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './Button'

// 1. META — describes the component to Storybook
const meta: Meta<typeof Button> = {
  title: 'Atoms/Button',               // Sidebar hierarchy: "Atoms > Button"
  component: Button,                    // Links to the component for prop extraction
  argTypes: {                           // Configures the Controls panel
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'danger'],
    },
    onClick: { action: 'clicked' },     // Logs events in the Actions panel
  },
}
export default meta

type Story = StoryObj<typeof Button>

// 2. STORIES — each export is one story
export const Default: Story = {
  args: { children: 'Button' },         // Default props for this story
}

export const Variants: Story = {
  render: () => (                        // Custom render to show multiple at once
    <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
    </div>
  ),
}
```

### Key concepts

| Concept | Purpose |
|---------|---------|
| `title` | Determines the sidebar position. Slashes create nesting: `'Atoms/Button'` puts Button under the Atoms group. |
| `component` | Tells Storybook which component to extract props from for the Controls table and Docs page. |
| `args` | Default prop values for a story. Users can change them live via the Controls panel. |
| `argTypes` | Customizes how Controls renders each prop (select dropdown, boolean toggle, color picker, etc.). |
| `action` | Logs function-prop calls (like `onClick`) in the Actions panel so you can verify events fire. |
| `render` | Optional custom render function. Use it when a single args object isn't enough (e.g. showing multiple variants side by side). |
| `parameters` | Per-story config. Common: `layout: 'fullscreen'` for pages, `viewport: { defaultViewport: 'mobile1' }` for responsive stories. |
| `decorators` | Wrapper functions that add context around a story (e.g. a max-width container, theme provider, or router). |

---

## Interaction Testing with Play Functions

Stories can include a `play` function that simulates user interactions. These run automatically when the story loads and show results in the **Interactions** panel.

```typescript
// Alert.stories.tsx — Dismissible story
import { within, userEvent, expect } from '@storybook/test'

export const Dismissible: Story = {
  args: {
    variant: 'warning',
    title: 'Heads up',
    message: 'This alert can be dismissed.',
    dismissible: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Assert the dismiss button exists
    const dismissButton = canvas.getByRole('button', { name: /dismiss/i })
    await expect(dismissButton).toBeInTheDocument()

    // Click it
    await userEvent.click(dismissButton)

    // Assert the alert is gone
    await expect(canvas.queryByRole('alert')).not.toBeInTheDocument()
  },
}
```

Play functions use the same Testing Library queries (`getByRole`, `getByLabelText`) and Jest-style assertions (`expect`) that you'd use in unit tests. The difference is they run inside Storybook's canvas, so you can see each step visually.

---

## Sidebar Hierarchy

The `title` in each meta determines the Storybook sidebar tree:

```
Atoms/          ← group
  Avatar        ← component (from title: 'Atoms/Avatar')
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

This follows **atomic design** — the same hierarchy used in the `src/components/` folder structure, making the mapping between code and Storybook navigation obvious.

---

## How Parameters Override

Parameters cascade. A value set in `preview.ts` applies globally, but a story can override it:

```
preview.ts          →  layout: 'centered'       (global default)
  Navbar meta       →  layout: 'fullscreen'      (overrides for all Navbar stories)
    Navbar/Mobile   →  viewport: 'mobile1'        (adds viewport for this one story)
```

The most specific value wins. This lets you set sensible defaults once and only override where needed.

---

## Data Flow Diagram

```
┌──────────────┐     discovers     ┌─────────────────────┐
│  main.ts     │ ────────────────► │  *.stories.tsx files │
│  (config)    │                   │  (per component)     │
└──────┬───────┘                   └──────────┬──────────┘
       │                                      │
       │ loads addons                         │ exports meta + stories
       ▼                                      ▼
┌──────────────┐                   ┌─────────────────────┐
│  Addons      │                   │  preview.ts         │
│  Controls    │◄──────────────────│  (global styles,    │
│  Actions     │  applies global   │   decorators,       │
│  A11y        │  parameters to    │   parameters)       │
│  Viewport    │  every story      └──────────┬──────────┘
│  Interactions│                              │
└──────────────┘                              │ imports
                                              ▼
                                   ┌─────────────────────┐
                                   │  design-tokens.css  │
                                   │  index.css          │
                                   └─────────────────────┘
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

2. Write the story file following the pattern:
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
