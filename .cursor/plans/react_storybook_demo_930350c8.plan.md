---
name: React Storybook Demo
overview: Build a modern React + Vite + TypeScript project with Storybook 8, featuring a design token system and components across all atomic design levels (atoms, molecules, organisms, pages) with rich stories that demonstrate Storybook's value for design-driven development.
todos:
  - id: bootstrap
    content: Scaffold Vite + React + TypeScript project and initialize Storybook 8 with addons
    status: completed
  - id: tokens
    content: Create design tokens CSS file with colors, typography, spacing, radii, shadows
    status: completed
  - id: storybook-config
    content: Configure .storybook/main.ts, preview.ts with global styles, decorators, and custom theme
    status: completed
  - id: atoms
    content: Build 5 atom components (Button, Input, Badge, Avatar, Toggle) with stories
    status: completed
  - id: molecules
    content: Build 4 molecule components (Card, Alert, Tooltip, SearchBar) with stories
    status: completed
  - id: organisms
    content: Build 4 organism components (Navbar, Sidebar, DataTable, Form) with stories
    status: completed
  - id: pages
    content: Build 2 page compositions (LoginPage, Dashboard) with stories
    status: completed
  - id: verify
    content: Verify Storybook runs cleanly and all stories render correctly
    status: completed
isProject: false
---

# React Storybook Demo

## Tech Stack

- **Vite** + **React 18** + **TypeScript**
- **Storybook 8** with addons: Controls, Actions, Viewport, A11y, Docs, Interactions
- **CSS Modules** for styling (zero extra dependencies, simple for a demo)
- Design tokens via CSS custom properties

## Project Structure

```
react-storybook/
├── .storybook/
│   ├── main.ts              # Storybook config (Vite builder)
│   ├── preview.ts            # Global decorators, parameters
│   └── theme.ts              # Custom Storybook theme (branded)
├── src/
│   ├── tokens/
│   │   └── design-tokens.css # Colors, spacing, typography, radii, shadows
│   ├── components/
│   │   ├── atoms/
│   │   │   ├── Button/       # Button.tsx, Button.module.css, Button.stories.tsx
│   │   │   ├── Input/        # Input.tsx, Input.module.css, Input.stories.tsx
│   │   │   ├── Badge/        # Badge.tsx, Badge.module.css, Badge.stories.tsx
│   │   │   ├── Avatar/       # Avatar.tsx, Avatar.module.css, Avatar.stories.tsx
│   │   │   └── Toggle/       # Toggle.tsx, Toggle.module.css, Toggle.stories.tsx
│   │   ├── molecules/
│   │   │   ├── Card/         # Card.tsx, Card.module.css, Card.stories.tsx
│   │   │   ├── Alert/        # Alert.tsx, Alert.module.css, Alert.stories.tsx
│   │   │   ├── Tooltip/      # Tooltip.tsx, Tooltip.module.css, Tooltip.stories.tsx
│   │   │   └── SearchBar/    # SearchBar.tsx, SearchBar.module.css, SearchBar.stories.tsx
│   │   ├── organisms/
│   │   │   ├── Navbar/       # Navbar.tsx, Navbar.module.css, Navbar.stories.tsx
│   │   │   ├── Sidebar/      # Sidebar.tsx, Sidebar.module.css, Sidebar.stories.tsx
│   │   │   ├── DataTable/    # DataTable.tsx, DataTable.module.css, DataTable.stories.tsx
│   │   │   └── Form/         # Form.tsx, Form.module.css, Form.stories.tsx
│   │   └── pages/
│   │       ├── LoginPage/    # LoginPage.tsx, LoginPage.module.css, LoginPage.stories.tsx
│   │       └── Dashboard/    # Dashboard.tsx, Dashboard.module.css, Dashboard.stories.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .gitignore
```

## Phase 1: Project Bootstrap

1. Scaffold a Vite + React + TypeScript project using `npm create vite@latest`
2. Install Storybook 8 via `npx storybook@latest init`
3. Install addons: `@storybook/addon-a11y`, `@storybook/addon-interactions`, `@storybook/test`
4. Remove the default example stories that Storybook generates
5. Create a custom Storybook theme in `.storybook/theme.ts` to brand the demo

## Phase 2: Design Tokens

Create `src/tokens/design-tokens.css` with CSS custom properties:

- **Colors**: primary, secondary, success, warning, danger, neutral scale (50-900)
- **Typography**: font families, sizes (xs through 3xl), weights, line heights
- **Spacing**: scale from 4px to 64px
- **Border radius**: sm, md, lg, full
- **Shadows**: sm, md, lg

Import tokens globally in `.storybook/preview.ts` so all stories have access.

## Phase 3: Atoms

Each atom gets a component + story file demonstrating key Storybook features:


| Component  | Story Highlights                                                                                                                              |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Button** | Variants (primary/secondary/outline/ghost/danger), sizes (sm/md/lg), disabled state, loading state, icon support. **Controls** for all props. |
| **Input**  | Types (text/email/password), validation states, placeholder, disabled. Demonstrates **argTypes** with select controls.                        |
| **Badge**  | Color variants, sizes, dot indicator. Shows how **args composition** works.                                                                   |
| **Avatar** | Image/initials fallback, sizes, status indicator.                                                                                             |
| **Toggle** | On/off states, disabled, labels. Demonstrates **Actions** addon for event tracking.                                                           |


## Phase 4: Molecules


| Component     | Story Highlights                                                                                                           |
| ------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Card**      | Image card, stat card, profile card. Shows **decorators** for layout context.                                              |
| **Alert**     | Info/success/warning/error variants, dismissible. Demonstrates **play functions** for interaction testing (click dismiss). |
| **Tooltip**   | Placement options (top/right/bottom/left). Shows **viewport** testing.                                                     |
| **SearchBar** | Debounced input, clear button. Demonstrates **Actions** and controlled state stories.                                      |


## Phase 5: Organisms


| Component     | Story Highlights                                                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Navbar**    | Logo, nav links, responsive. Shows **viewport addon** for mobile/tablet/desktop.                                                           |
| **Sidebar**   | Collapsible, active states, nested items. Demonstrates **args-based state management**.                                                    |
| **DataTable** | Sortable columns, row selection, pagination. Demonstrates **complex args** and **interaction tests** with play functions.                  |
| **Form**      | Multi-field, validation, submit. Demonstrates **play functions** for filling out and submitting the form, and **actions** for form events. |


## Phase 6: Page Compositions


| Page          | Story Highlights                                                                                                              |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **LoginPage** | Composed from atoms + molecules. Shows **play function** walking through the full login flow. Mobile and desktop viewports.   |
| **Dashboard** | Composed from Navbar, Sidebar, Cards, DataTable. Shows how component stories build up to full pages. Multiple layout stories. |


## Key Demo Talking Points (built into the stories)

Each of these Storybook advantages will be demonstrable during the team showcase:

1. **Design-to-code fidelity** -- Design tokens drive all components; changing a token updates everything
2. **Interactive documentation** -- Auto-generated docs via `autodocs` tag on every story
3. **Controls panel** -- Live prop manipulation on every component
4. **Accessibility auditing** -- A11y addon flags issues in real-time (will intentionally include one fixable a11y issue to demonstrate)
5. **Interaction testing** -- Play functions on Alert, Form, LoginPage, DataTable simulate real user flows
6. **Responsive design** -- Viewport addon on Navbar and page stories
7. **Component isolation** -- Each component is developed and tested independently
8. **Composition** -- Pages clearly composed from smaller building blocks, visible in the story hierarchy

## Running the Demo

- `npm run dev` -- Run the React app
- `npm run storybook` -- Launch Storybook on port 6006

