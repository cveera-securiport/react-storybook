# SKILL: Gold-Standard Enterprise Frontend Architecture

This skill defines a **staff+ level frontend architecture framework** for enterprise React applications. It is the single source of truth for architectural decisions, patterns, and tooling.

**Stack:** React 19 + TypeScript + Vite + Nx Monorepo + MUI v6 + Zustand + TanStack Query + TanStack Form + Zod + MSW + Storybook 8/9 + Playwright + Framer Motion + react-i18next + CSS Modules + Design Tokens

**When to invoke this skill:** Any time you are scaffolding a new frontend library, creating components, setting up state management, writing tests, configuring CI/CD, or making architectural decisions in a React monorepo.

---

## 0. Responsive Design

Mobile-first, token-driven, component-scoped.

### Breakpoint tokens

Define breakpoints as CSS custom properties in `libs/shared/tokens/design-tokens.css`:

```css
:root {
  --bp-sm: 640px;
  --bp-md: 768px;
  --bp-lg: 1024px;
  --bp-xl: 1280px;
}
```

Media queries in CSS Modules reference these values directly (CSS custom properties cannot be used in `@media` yet, so use the raw values with a comment referencing the token):

```css
/* Button.module.css */
.button {
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
}

/* --bp-md: 768px */
@media (min-width: 768px) {
  .button {
    padding: var(--space-3) var(--space-6);
    font-size: var(--text-base);
  }
}
```

### Fluid typography

Use `clamp()` for type that scales smoothly between breakpoints:

```css
.heading {
  font-size: clamp(var(--text-xl), 2vw + 1rem, var(--text-3xl));
  line-height: var(--leading-tight);
}
```

### Container queries

Use `@container` for component-level responsiveness that adapts to parent size, not viewport:

```css
.cardWrapper {
  container-type: inline-size;
}

.cardContent {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

@container (min-width: 480px) {
  .cardContent {
    flex-direction: row;
    gap: var(--space-6);
  }
}
```

### CSS logical properties

Use logical properties for internationalization support (LTR/RTL):

```css
.sidebar {
  padding-inline-start: var(--space-4);
  margin-block-end: var(--space-6);
  border-inline-end: 1px solid var(--color-neutral-200);
}
```

### Rules

- Mobile-first: write base styles for small screens, layer up with `min-width` queries.
- No hardcoded pixel values for layout dimensions -- use spacing tokens and relative units (`rem`, `%`, `vw`).
- Prefer `clamp()` over multiple breakpoint overrides for typography and spacing.
- Use container queries for reusable components that appear in different layout contexts.
- Test every component at mobile (375px), tablet (768px), and desktop (1280px).

---

## 1. Atomic Design

Components are categorized by complexity using the Atomic Design hierarchy.

### Folder structure

```
libs/ibc/ui/                    # Shared design system (scope:shared)
  atoms/        # Button, Input, Badge, Avatar, Toggle
  molecules/    # Card, Alert, Tooltip, SearchBar
  organisms/    # Navbar, Sidebar, DataTable, Form

libs/shell/ui/                  # Shell-specific components (scope:shell)
  organisms/    # ShellNavbar, ShellSidebar

libs/agent/ui/                  # Agent-specific components (scope:agent)
  organisms/    # AgentToolbar, AgentPanel

apps/shell/src/pages/           # Shell app pages (in the app, not libs)
  Dashboard, Settings

apps/agent/src/pages/           # Agent app pages
  Workspace
```

### Import direction (strictly enforced)

```
pages → organisms → molecules → atoms
         ↑ can import from same level or below
         ✗ never import upward
```

- **Atoms** import nothing from other component levels.
- **Molecules** may import atoms.
- **Organisms** may import atoms and molecules.
- **Pages** may import from any level.

In an Nx monorepo this is enforced via `@nx/enforce-module-boundaries` (see Section 3).

### Co-located file pattern

Every component is a folder with at minimum two files:

```
Button/
  Button.tsx            # Component implementation
  Button.stories.tsx    # Storybook stories (CSF3)
```

Add these as needed:
- `Button.module.css` -- Scoped styles consuming design tokens. **Not needed for MUI wrapper components** (Section 5) since styling flows through MUI's theme and `sx` prop. Use CSS Modules only for custom non-MUI components (layouts, page shells, bespoke UI).
- `Button.test.tsx` -- Vitest unit tests
- `Button.types.ts` -- Shared type definitions (when types are reused across files)

### Imports: direct paths, no barrel files

**Do not create barrel `index.ts` files** that re-export all components from a level. Barrel files cause:
- Failed tree-shaking -- bundlers pull in every re-exported module even when only one is used.
- Slower builds and test runs -- Vitest/Jest load all exports from the barrel regardless of what the test needs.
- Hidden circular dependencies between co-located components.
- Broken code splitting -- route-level splits pull in unrelated components through the barrel chain.

Instead, import components directly from their source file:

```ts
// Good: direct import
import { Button } from '@csv/ui/atoms/Button/Button'
import { Card } from '@csv/ui/molecules/Card/Card'

// Bad: barrel import pulls in everything
import { Button, Card } from '@csv/ui'
```

Configure each library's `package.json` `exports` field to expose granular entry points:

```json
{
  "exports": {
    "./atoms/Button": "./src/atoms/Button/Button.tsx",
    "./atoms/Input": "./src/atoms/Input/Input.tsx",
    "./molecules/Card": "./src/molecules/Card/Card.tsx",
    "./molecules/Alert": "./src/molecules/Alert/Alert.tsx"
  }
}
```

This gives consumers clean import paths (`@csv/ui/atoms/Button`) without the tree-shaking penalty of a single barrel file.

---

## 2. Component API Design

### Discriminated union props

Use TypeScript discriminated unions when variants change the available prop surface:

```tsx
type ButtonProps =
  | { variant: 'link'; href: string; onClick?: never }
  | { variant: 'primary' | 'secondary' | 'danger'; href?: never; onClick: () => void }

interface ButtonBaseProps {
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}

export type Props = ButtonBaseProps & ButtonProps
```

### Polymorphic `as` prop

Allow consumers to change the rendered element:

```tsx
type PolymorphicProps<E extends React.ElementType> = {
  as?: E
} & Omit<React.ComponentPropsWithoutRef<E>, 'as'>

function Text<E extends React.ElementType = 'p'>({
  as,
  children,
  ...props
}: PolymorphicProps<E> & { children: React.ReactNode }) {
  const Component = as || 'p'
  return <Component {...props}>{children}</Component>
}
```

### Compound components

For complex components with multiple sub-parts:

```tsx
function Card({ children }: { children: React.ReactNode }) {
  return <div className={styles.card}>{children}</div>
}

Card.Header = function CardHeader({ children }: { children: React.ReactNode }) {
  return <div className={styles.header}>{children}</div>
}

Card.Body = function CardBody({ children }: { children: React.ReactNode }) {
  return <div className={styles.body}>{children}</div>
}

Card.Footer = function CardFooter({ children }: { children: React.ReactNode }) {
  return <div className={styles.footer}>{children}</div>
}
```

### Ref as a prop (React 19)

In React 19, `ref` is a regular prop -- **do not use `forwardRef`** (it is deprecated). Accept `ref` directly in the props interface:

```tsx
interface InputProps {
  label?: string
  error?: string
  ref?: React.Ref<HTMLInputElement>
}

function Input({ label, error, ref, ...props }: InputProps) {
  return (
    <div className={styles.wrapper}>
      {label && <label className={styles.label}>{label}</label>}
      <input ref={ref} className={styles.input} {...props} />
      {error && <span className={styles.error}>{error}</span>}
    </div>
  )
}
```

All atoms and molecules should accept `ref` for composability. No `forwardRef` wrapper, no `displayName` workaround.

### React 19 patterns

**React Compiler (Forget):** Do not manually add `useMemo`, `useCallback`, or `React.memo`. The React 19 Compiler analyzes components at build time and injects memoization automatically. Remove existing manual memoization during migration.

**`use()` hook:** Read promises and context directly in render:

```tsx
function UserProfile({ userPromise }: { userPromise: Promise<User> }) {
  const user = use(userPromise)
  return <h1>{user.name}</h1>
}
```

**`useOptimistic`:** Optimistic UI with automatic rollback:

```tsx
function TodoItem({ todo, updateAction }: Props) {
  const [optimisticTodo, setOptimistic] = useOptimistic(todo)

  async function handleToggle() {
    setOptimistic({ ...todo, completed: !todo.completed })
    await updateAction(todo.id, { completed: !todo.completed })
  }

  return <Checkbox checked={optimisticTodo.completed} onChange={handleToggle} />
}
```

**`useActionState`:** React 19 primitive for declarative async form handling. For most forms, prefer TanStack Form (Section 8) which provides richer validation, field-level errors, and TanStack Query integration. Use `useActionState` only for trivial forms (e.g., a single search input or newsletter signup) that don't justify a full form library:

```tsx
async function subscribe(_prev: State, formData: FormData): Promise<State> {
  const result = await api.subscribe(formData.get('email') as string)
  return result.ok ? { status: 'success' } : { status: 'error', message: result.error }
}

function NewsletterForm() {
  const [state, action, isPending] = useActionState(subscribe, { status: 'idle' })
  return (
    <form action={action}>
      <Input name="email" placeholder="you@example.com" />
      <Button type="submit" disabled={isPending}>Subscribe</Button>
      {state.status === 'error' && <Alert variant="danger">{state.message}</Alert>}
    </form>
  )
}
```

---

## 3. Nx Monorepo Architecture

### Workspace layout (scope-first)

Organize libraries by **scope first** (domain/team ownership), then by **type** within each scope. This keeps everything for a given domain co-located and maps naturally to team boundaries.

```
apps/
  shell/                          # Shell application entry point + routing
  agent/                          # Agent application entry point + routing

libs/
  ibc/                            # scope:shared -- shared design system
    ui/                           # type:ui     -- Button, Input, Card, DataTable, etc.

  shell/                          # scope:shell -- everything shell-specific
    ui/                           # type:ui      -- shell-specific components
    feature-dashboard/            # type:feature -- dashboard page + logic
    feature-settings/             # type:feature -- settings page + logic

  agent/                          # scope:agent -- everything agent-specific
    ui/                           # type:ui      -- agent-specific components
    feature-workspace/            # type:feature -- workspace page + logic

  shared/                         # scope:shared -- non-UI shared code
    data-access/                  # type:data-access -- API client, Zustand stores
    tokens/                       # type:util    -- design tokens + MUI theme
    util/                         # type:util    -- hooks, formatters, helpers
    testing/                      # type:util    -- test utilities, fixtures, mocks
```

**Why scope-first:**
- One folder per domain -- easy to find everything related to "shell" or "agent".
- Maps to team ownership (the shell team owns `libs/shell/`).
- Libraries evolve within their scope without folder moves. If `shell/ui` later becomes shared, change its tag to `scope:shared` and move it to `libs/ibc/` or `libs/shared/`.
- `apps/` contains only deployable entry points (routing, app config). All components, features, stores, and utilities live in `libs/`.

### Library categorization with tags

Every project in `project.json` gets two tags -- **type** (what it is) and **scope** (who owns it):

```json
{
  "tags": ["type:ui", "scope:shared"]
}
```

**Type tags:** `type:app`, `type:feature`, `type:ui`, `type:data-access`, `type:util`
**Scope tags:** `scope:shared`, `scope:shell`, `scope:agent`

| Library | Tags |
|---------|------|
| `libs/ibc/ui` | `type:ui, scope:shared` |
| `libs/shell/ui` | `type:ui, scope:shell` |
| `libs/shell/feature-dashboard` | `type:feature, scope:shell` |
| `libs/agent/ui` | `type:ui, scope:agent` |
| `libs/agent/feature-workspace` | `type:feature, scope:agent` |
| `libs/shared/data-access` | `type:data-access, scope:shared` |
| `libs/shared/tokens` | `type:util, scope:shared` |

### Module boundary enforcement

Configure `@nx/enforce-module-boundaries` in `eslint.config.mjs`. Constraints enforce both the **type hierarchy** (features can't import from apps) and **scope isolation** (shell can't import agent code):

```ts
import nxPlugin from '@nx/eslint-plugin'

export default [
  {
    plugins: { '@nx': nxPlugin },
    rules: {
      '@nx/enforce-module-boundaries': ['error', {
        depConstraints: [
          // Type hierarchy
          { sourceTag: 'type:app',         onlyDependOnLibsWithTags: ['type:feature', 'type:ui', 'type:data-access', 'type:util'] },
          { sourceTag: 'type:feature',     onlyDependOnLibsWithTags: ['type:ui', 'type:data-access', 'type:util'] },
          { sourceTag: 'type:ui',          onlyDependOnLibsWithTags: ['type:ui', 'type:util'] },
          { sourceTag: 'type:data-access', onlyDependOnLibsWithTags: ['type:data-access', 'type:util'] },
          { sourceTag: 'type:util',        onlyDependOnLibsWithTags: ['type:util'] },

          // Scope isolation
          { sourceTag: 'scope:shell', onlyDependOnLibsWithTags: ['scope:shell', 'scope:shared'] },
          { sourceTag: 'scope:agent', onlyDependOnLibsWithTags: ['scope:agent', 'scope:shared'] },
          { sourceTag: 'scope:shared', onlyDependOnLibsWithTags: ['scope:shared'] },
        ],
      }],
    },
  },
]
```

This guarantees:
- `shell/feature-dashboard` can import `shell/ui` and `ibc/ui`, but never `agent/ui`.
- `ibc/ui` (scope:shared) can only depend on other shared libraries -- never on shell or agent code.
- The type hierarchy is enforced independently: features never import from other features, UI never imports from features, etc.

### Dependency flow

```
apps/shell  →  shell/feature-dashboard  →  shell/ui  →  ibc/ui
                                        →  shared/data-access
                                        →  shared/tokens

apps/agent  →  agent/feature-workspace  →  agent/ui  →  ibc/ui
                                        →  shared/data-access
                                        →  shared/tokens
```

### Affected commands

Only rebuild/retest what changed:

```bash
nx affected -t lint test build    # Run lint, test, build on affected projects
nx affected -t test --base=main   # Compare against main branch
nx graph                          # Visualize the project dependency graph
```

### Nx Cloud

Enable distributed caching and task replay for CI:

```bash
npx nx connect                    # Connect workspace to Nx Cloud
```

In CI, Nx Cloud replays cached results from other developers and CI runs, reducing pipeline time by 50-90%.

### Generators

Scaffold libraries into the scope-first structure:

```bash
nx g @nx/react:library libs/shell/feature-checkout --tags="type:feature,scope:shell"
nx g @nx/react:library libs/ibc/ui --tags="type:ui,scope:shared"
nx g @nx/react:component Button --project=ibc-ui --directory=atoms
```

### Module Federation

For micro-frontend scaling, Nx has first-class Module Federation support:

```bash
nx g @nx/react:host apps/shell --remotes=agent
```

Each remote builds and deploys independently. The shell loads remotes at runtime. Use `--devRemotes` during local development to only serve remotes you are actively changing.

---

## 4. Design Tokens

### W3C Design Tokens Format Module (2025.10)

The W3C community group released the first stable Design Tokens spec in October 2025. Adopt the DTCG format as the canonical source:

```json
{
  "color": {
    "primary": {
      "500": {
        "$type": "color",
        "$value": "#6366f1",
        "$description": "Primary brand color"
      }
    }
  },
  "space": {
    "4": {
      "$type": "dimension",
      "$value": "1rem"
    }
  }
}
```

### Three-tier token architecture

```
Primitive tokens     →  Raw values: color.indigo.500 = #6366f1
        ↓
Semantic tokens      →  Intent: color.primary.500 = {color.indigo.500}
        ↓
Component tokens     →  Scoped: button.background = {color.primary.500}
```

Primitive tokens never appear in component CSS. Semantic tokens are the primary interface. Component tokens are optional, used when a component needs to deviate from the semantic set.

### Style Dictionary v4 pipeline

Style Dictionary v4 is ESM-native, async, and DTCG-compatible:

```ts
// style-dictionary.config.ts
import StyleDictionary from 'style-dictionary'

const sd = new StyleDictionary({
  source: ['tokens/**/*.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'libs/shared/tokens/src/',
      files: [{
        destination: 'design-tokens.css',
        format: 'css/variables',
      }],
    },
  },
})

await sd.buildAllPlatforms()
```

### Theming (light/dark mode)

MUI's `colorSchemes` (Section 5) is the primary dark mode mechanism. With `cssVariables: true`, MUI generates `--mui-palette-*` CSS variables that update automatically when the color scheme changes. Define semantic aliases that reference MUI's generated variables so there is a single source of truth:

```css
:root {
  --surface-primary: var(--mui-palette-background-default);
  --text-primary: var(--mui-palette-text-primary);
  --border-default: var(--mui-palette-divider);
}
```

These aliases update automatically when MUI switches between light and dark mode -- no separate `[data-theme='dark']` block needed. Components reference only semantic tokens (`--surface-primary`, `--text-primary`), never raw palette values.

### Rules

- All visual values (colors, spacing, radii, shadows, typography) come from tokens.
- Never use inline styles for anything a token covers.
- Components use CSS Modules (`.module.css`) that consume tokens via `var(--token-name)`.
- The token file is imported globally in each Storybook's `preview.ts` so every story has access.

---

## 5. MUI (Material UI v6)

MUI is the component library foundation. All UI components build on top of MUI primitives with custom theming that maps your design tokens (Section 4) into MUI's theme system.

### Styling strategy

MUI v6 supports three styling approaches. Use them in this priority order:

| Approach | When to use |
|----------|------------|
| **Theme overrides** | Global defaults for all instances of a component (colors, spacing, typography) |
| **`sx` prop** | One-off style adjustments scoped to a single component instance |
| **`styled()`** | Reusable styled wrappers when `sx` becomes repetitive across multiple files |

Do **not** use CSS Modules to style MUI components -- MUI's styling system is tightly coupled to its theme and component internals. CSS Modules remain the right choice for custom non-MUI components (layouts, page shells, bespoke UI).

### Theme setup with design tokens

Bridge your design tokens into MUI's theme via `createTheme` with `cssVariables: true`:

```ts
// libs/shared/tokens/src/mui-theme.ts
import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  cssVariables: true,
  palette: {
    primary: {
      main: '#6366f1',
      light: '#818cf8',
      dark: '#4f46e5',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#14b8a6',
      light: '#2dd4bf',
      dark: '#0d9488',
    },
    error: {
      main: '#ef4444',
    },
    warning: {
      main: '#f59e0b',
    },
    success: {
      main: '#22c55e',
    },
  },
  typography: {
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    fontWeightMedium: 500,
    fontWeightBold: 700,
  },
  spacing: 4,
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
    },
  },
})
```

With `cssVariables: true`, MUI generates CSS variables prefixed with `--mui-` on `:root`, enabling access from both MUI's JS APIs and plain CSS.

### Theme provider

Wrap the app at the root:

```tsx
import { ThemeProvider, CssBaseline } from '@mui/material'
import { theme } from '@csv/tokens'

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router />
    </ThemeProvider>
  )
}
```

### Light/dark mode

Use MUI's `colorSchemes` for built-in light/dark support:

```ts
const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'data-theme' },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#6366f1' },
        background: { default: '#ffffff', paper: '#f8fafc' },
      },
    },
    dark: {
      palette: {
        primary: { main: '#818cf8' },
        background: { default: '#0f172a', paper: '#1e293b' },
      },
    },
  },
})
```

Toggle with:

```tsx
import { useColorScheme } from '@mui/material/styles'

function ThemeToggle() {
  const { mode, setMode } = useColorScheme()
  return (
    <IconButton onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}>
      {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
    </IconButton>
  )
}
```

### Wrapping MUI components in your design system

Wrap MUI primitives into your atomic design system to enforce consistency and decouple your app from MUI internals:

```tsx
// components/atoms/Button/Button.tsx
import MuiButton, { type ButtonProps as MuiButtonProps } from '@mui/material/Button'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps {
  variant?: Variant
  size?: Size
  children: React.ReactNode
  disabled?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  fullWidth?: boolean
  startIcon?: React.ReactNode
}

const variantMap: Record<Variant, { muiVariant: MuiButtonProps['variant']; color: MuiButtonProps['color'] }> = {
  primary:   { muiVariant: 'contained', color: 'primary' },
  secondary: { muiVariant: 'outlined',  color: 'primary' },
  danger:    { muiVariant: 'contained', color: 'error' },
  ghost:     { muiVariant: 'text',      color: 'inherit' },
}

const sizeMap: Record<Size, MuiButtonProps['size']> = {
  sm: 'small',
  md: 'medium',
  lg: 'large',
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  ...props
}: ButtonProps) {
  const { muiVariant, color } = variantMap[variant]

  return (
    <MuiButton variant={muiVariant} color={color} size={sizeMap[size]} {...props}>
      {children}
    </MuiButton>
  )
}
```

This gives your app a stable API (`variant="primary"`, `size="sm"`) while MUI handles rendering, accessibility, and interaction states internally.

### `sx` prop usage

Use `sx` for theme-aware one-off adjustments. Access spacing, palette, and typography via shorthand:

```tsx
<Box sx={{ display: 'flex', gap: 2, p: 3, bgcolor: 'background.paper', borderRadius: 1 }}>
  <Typography variant="h6" sx={{ color: 'primary.main' }}>
    Dashboard
  </Typography>
</Box>
```

Responsive values:

```tsx
<Box sx={{ width: { xs: '100%', sm: '50%', md: '33%' }, p: { xs: 2, md: 4 } }}>
  <Card />
</Box>
```

### Pigment CSS (zero-runtime)

MUI v6 supports **Pigment CSS** as an opt-in zero-runtime CSS engine. It extracts styles at build time, eliminating runtime overhead:

```bash
npm install @pigment-css/vite-plugin
```

```ts
// vite.config.ts
import { pigment } from '@pigment-css/vite-plugin'
import { theme } from '@csv/tokens'

export default defineConfig({
  plugins: [
    pigment({ theme }),
    react(),
  ],
})
```

Pigment CSS is the forward-looking path for production performance and React Server Components compatibility.

### Storybook integration

Use `@storybook/addon-themes` to wrap all stories with the MUI theme:

```bash
npm install -D @storybook/addon-themes @fontsource/roboto @fontsource/material-icons
```

```ts
// .storybook/preview.ts
import { withThemeFromJSXProvider } from '@storybook/addon-themes'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { theme } from '@csv/tokens'

export const decorators = [
  withThemeFromJSXProvider({
    themes: { default: theme },
    defaultTheme: 'default',
    Provider: ThemeProvider,
    GlobalStyles: CssBaseline,
  }),
]
```

For light/dark theme switching in Storybook:

```ts
export const decorators = [
  withThemeFromJSXProvider({
    themes: { light: lightTheme, dark: darkTheme },
    defaultTheme: 'light',
    Provider: ThemeProvider,
    GlobalStyles: CssBaseline,
  }),
]
```

### TypeScript: extending the theme

Add custom tokens to the MUI theme with module augmentation:

```ts
// libs/shared/tokens/src/theme.d.ts
import '@mui/material/styles'

declare module '@mui/material/styles' {
  interface Theme {
    status: { danger: string }
  }
  interface ThemeOptions {
    status?: { danger?: string }
  }
  interface Palette {
    neutral: Palette['primary']
  }
  interface PaletteOptions {
    neutral?: PaletteOptions['primary']
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsColorOverrides {
    neutral: true
  }
}
```

### Rules

- All MUI customization flows through `createTheme` -- never override MUI styles with CSS Modules or `!important`.
- Wrap MUI primitives in your atomic design system components to keep a stable API.
- Use `sx` for layout and one-off adjustments, theme overrides for global defaults.
- Enable `cssVariables: true` so MUI tokens are available as CSS variables.
- Keep `theme.components` overrides minimal -- prefer wrapping over deep overrides.
- Add Pigment CSS for zero-runtime performance when deploying to production.

---

## 6. Zustand State Management

### When to use what

| Mechanism | Use for |
|-----------|---------|
| **Zustand** | Client-side global/shared state (auth, UI preferences, entity caches) |
| **React Context** | Dependency injection (theme provider, feature flags, i18n) |
| **URL state** | Filters, pagination, search queries -- anything shareable via link |
| **Component state** | Ephemeral UI state (open/closed, hover, form field values) |

### Store-per-domain with slices

One store per bounded domain. Each slice owns a subset of the state:

```ts
// stores/auth/authSlice.ts
import type { StateCreator } from 'zustand'

export interface AuthSlice {
  user: User | null
  token: string | null
  login: (credentials: Credentials) => Promise<void>
  logout: () => void
}

export const createAuthSlice: StateCreator<AuthSlice> = (set) => ({
  user: null,
  token: null,
  login: async (credentials) => {
    const { user, token } = await api.login(credentials)
    set({ user, token })
  },
  logout: () => set({ user: null, token: null }),
})
```

### Combining slices into a store

```ts
// stores/appStore.ts
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { createAuthSlice, type AuthSlice } from './auth/authSlice'
import { createUiSlice, type UiSlice } from './ui/uiSlice'

type AppStore = AuthSlice & UiSlice

export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      immer((...args) => ({
        ...createAuthSlice(...args),
        ...createUiSlice(...args),
      })),
      {
        name: 'app-store',
        partialize: (state) => ({ token: state.token }),
      }
    ),
    { name: 'AppStore' }
  )
)
```

### Typed selectors for render optimization

Never subscribe to the entire store. Use selectors to pick only what a component needs:

```tsx
function UserMenu() {
  const user = useAppStore((s) => s.user)
  const logout = useAppStore((s) => s.logout)

  if (!user) return null
  return (
    <div>
      <Avatar name={user.name} />
      <Button onClick={logout}>Sign Out</Button>
    </div>
  )
}
```

For derived state, create reusable selector hooks:

```ts
export const useIsAuthenticated = () => useAppStore((s) => s.token !== null)
```

### Middleware stack

| Middleware | Purpose |
|-----------|---------|
| `devtools` | Redux DevTools integration with time-travel debugging |
| `immer` | Write mutable-looking updates that produce immutable state |
| `persist` | Persist selected state to `localStorage` / `sessionStorage` |

Apply middleware at the combined store level, not on individual slices.

### Testing stores

Test slices in isolation with Vitest:

```ts
import { createAuthSlice } from './authSlice'

describe('authSlice', () => {
  it('sets user on login', async () => {
    const set = vi.fn()
    const get = vi.fn()
    const store = vi.fn()
    const slice = createAuthSlice(set, get, store)

    await slice.login({ email: 'a@b.com', password: 'pass' })
    expect(set).toHaveBeenCalledWith(expect.objectContaining({
      user: expect.any(Object),
      token: expect.any(String),
    }))
  })
})
```

---

## 7. TanStack Query (Server State)

Zustand handles **client state** (auth, UI preferences). TanStack Query handles **server state** (data fetched from APIs). They complement each other -- never store API responses in Zustand.

### When to use TanStack Query vs. Zustand

| Data type | Tool | Example |
|-----------|------|---------|
| Server data (GET) | TanStack Query | User profile, dashboard metrics, table rows |
| Server mutations (POST/PUT/DELETE) | TanStack Query `useMutation` | Create order, update settings |
| Client-only state | Zustand | Sidebar open/closed, selected theme |
| Auth tokens | Zustand (persisted) | JWT stored in `persist` middleware |

### QueryClient configuration

```tsx
// libs/shared/data-access/src/query-client.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: true,
    },
  },
})
```

Wrap the app at the root:

```tsx
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

### Query key conventions

Structure keys as tuples with increasing specificity:

```ts
// libs/shared/data-access/src/query-keys.ts
export const userKeys = {
  all:    ['users'] as const,
  lists:  () => [...userKeys.all, 'list'] as const,
  list:   (filters: UserFilters) => [...userKeys.lists(), filters] as const,
  details:() => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
}
```

This enables targeted invalidation:

```ts
queryClient.invalidateQueries({ queryKey: userKeys.lists() })
```

### Custom query hooks

Encapsulate queries in reusable hooks:

```ts
// libs/shared/data-access/src/hooks/useUser.ts
import { useQuery } from '@tanstack/react-query'
import { userKeys } from '../query-keys'
import { fetchUser, type User } from '../api-client'

export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => fetchUser(id),
  })
}
```

### Mutations with cache invalidation

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateUserInput) => api.updateUser(data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
  })
}
```

### Optimistic updates

For instant-feeling UIs, update the cache before the server responds:

```ts
export function useToggleTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (todo: Todo) => api.toggleTodo(todo.id),
    onMutate: async (todo) => {
      await queryClient.cancelQueries({ queryKey: todoKeys.detail(todo.id) })
      const previous = queryClient.getQueryData<Todo>(todoKeys.detail(todo.id))

      queryClient.setQueryData(todoKeys.detail(todo.id), {
        ...todo,
        completed: !todo.completed,
      })

      return { previous }
    },
    onError: (_err, todo, context) => {
      if (context?.previous) {
        queryClient.setQueryData(todoKeys.detail(todo.id), context.previous)
      }
    },
    onSettled: (_data, _err, todo) => {
      queryClient.invalidateQueries({ queryKey: todoKeys.detail(todo.id) })
    },
  })
}
```

### Prefetching

Prefetch data on hover or route transition for instant navigation:

```ts
function UserListItem({ userId }: { userId: string }) {
  const queryClient = useQueryClient()

  return (
    <Link
      to={`/users/${userId}`}
      onMouseEnter={() => {
        queryClient.prefetchQuery({
          queryKey: userKeys.detail(userId),
          queryFn: () => fetchUser(userId),
          staleTime: 30 * 1000,
        })
      }}
    >
      View Profile
    </Link>
  )
}
```

### Infinite queries (pagination)

```ts
export function useInfiniteUsers(filters: UserFilters) {
  return useInfiniteQuery({
    queryKey: userKeys.list(filters),
    queryFn: ({ pageParam }) => fetchUsers({ ...filters, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })
}
```

### Rules

- Never store fetched server data in Zustand -- let TanStack Query own the cache.
- Every query hook lives in `libs/shared/data-access/src/hooks/`.
- Always use the query key factory (`userKeys`, `todoKeys`) -- never hand-write key arrays.
- Set `staleTime` based on data freshness requirements (real-time data: 0, reference data: 5 min+).
- Use `placeholderData: keepPreviousData` for paginated queries to avoid layout flicker.

---

## 8. Form Management

Use **TanStack Form** for form state + **Zod** for schema validation. TanStack Form provides superior TypeScript inference (field names and values are fully type-checked against your schema), pairs naturally with TanStack Query (same ecosystem, same mental model), and ships at ~4.4kb (55% smaller than alternatives). Schemas are shared with API validation (Section 18).

### Setup

```bash
npm install @tanstack/react-form @tanstack/zod-form-adapter zod
```

### Shared Zod schemas

Define schemas once in `libs/shared/data-access/src/schemas/` and reuse for both form validation and API response validation:

```ts
// libs/shared/data-access/src/schemas/user.ts
import { z } from 'zod'

export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'member', 'viewer']),
})

export const CreateUserSchema = UserSchema.omit({ id: true })
export const UpdateUserSchema = CreateUserSchema.partial()

export type User = z.infer<typeof UserSchema>
export type CreateUserInput = z.infer<typeof CreateUserSchema>
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>
```

### Form component pattern

```tsx
import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { CreateUserSchema, type CreateUserInput } from '@csv/data-access/schemas/user'

function CreateUserForm({ onSubmit }: { onSubmit: (data: CreateUserInput) => void }) {
  const form = useForm({
    defaultValues: { name: '', email: '', role: 'member' as const },
    validatorAdapter: zodValidator(),
    onSubmit: async ({ value }) => onSubmit(value),
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
    >
      <form.Field
        name="name"
        validators={{ onChange: CreateUserSchema.shape.name }}
        children={(field) => (
          <Input
            label="Name"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            error={field.state.meta.errors[0]}
          />
        )}
      />

      <form.Field
        name="email"
        validators={{ onChange: CreateUserSchema.shape.email }}
        children={(field) => (
          <Input
            label="Email"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            error={field.state.meta.errors[0]}
          />
        )}
      />

      <form.Field
        name="role"
        children={(field) => (
          <select
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value as CreateUserInput['role'])}
          >
            <option value="admin">Admin</option>
            <option value="member">Member</option>
            <option value="viewer">Viewer</option>
          </select>
        )}
      />

      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
        children={([canSubmit, isSubmitting]) => (
          <Button type="submit" disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create User'}
          </Button>
        )}
      />
    </form>
  )
}
```

### Integrating with TanStack Query mutations

```tsx
function CreateUserPage() {
  const createUser = useCreateUser()

  return (
    <CreateUserForm
      onSubmit={(data) => createUser.mutate(data)}
    />
  )
}
```

### Async field validation with debounce

TanStack Form has first-class support for async per-field validation (e.g., checking email uniqueness):

```tsx
<form.Field
  name="email"
  validators={{
    onChange: CreateUserSchema.shape.email,
    onChangeAsyncDebounceMs: 300,
    onChangeAsync: async ({ value }) => {
      const taken = await api.checkEmailExists(value)
      return taken ? 'Email already in use' : undefined
    },
  }}
  children={(field) => (
    <Input
      label="Email"
      value={field.state.value}
      onChange={(e) => field.handleChange(e.target.value)}
      onBlur={field.handleBlur}
      error={field.state.meta.errors[0]}
    />
  )}
/>
```

### Dynamic field arrays

```tsx
<form.Field name="addresses" mode="array">
  {(field) => (
    <>
      {field.state.value.map((_, i) => (
        <form.Field key={i} name={`addresses[${i}].street`}>
          {(subField) => (
            <Input
              label={`Address ${i + 1}`}
              value={subField.state.value}
              onChange={(e) => subField.handleChange(e.target.value)}
            />
          )}
        </form.Field>
      ))}
      <Button onClick={() => field.pushValue({ street: '', city: '' })}>
        Add Address
      </Button>
    </>
  )}
</form.Field>
```

### Dependent fields

Use `form.Subscribe` to reactively show/hide fields based on other values:

```tsx
<form.Subscribe
  selector={(state) => state.values.role}
  children={(role) =>
    role === 'admin' ? (
      <form.Field
        name="adminCode"
        validators={{ onChange: z.string().min(6) }}
        children={(field) => (
          <Input
            label="Admin Code"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            error={field.state.meta.errors[0]}
          />
        )}
      />
    ) : null
  }
/>
```

### Rules

- One Zod schema per entity, shared between form validation and API validation.
- Use the Zod adapter (`@tanstack/zod-form-adapter`) -- never write raw validation functions when a schema exists.
- Use `form.Subscribe` to observe form state reactively and avoid unnecessary re-renders.
- Always show field-level errors immediately below the input via `field.state.meta.errors`.
- Place schemas in `libs/shared/data-access/src/schemas/` for cross-library reuse.
- Use `onChangeAsyncDebounceMs` for expensive validations (uniqueness checks, server-side validation).

---

## 9. API Layer and Mocking

### OpenAPI code generation

Generate a type-safe API client from the backend's OpenAPI spec. This ensures the frontend-backend contract is always in sync.

**Using `orval` (recommended for React Query integration):**

```bash
npm install -D orval
```

```ts
// orval.config.ts
import { defineConfig } from 'orval'

export default defineConfig({
  api: {
    input: './openapi.json',
    output: {
      target: 'libs/shared/data-access/src/api-client/generated.ts',
      client: 'react-query',
      mode: 'tags-split',
      override: {
        mutator: {
          path: 'libs/shared/data-access/src/api-client/custom-fetch.ts',
          name: 'customFetch',
        },
      },
    },
  },
})
```

```bash
npx orval                       # Generate API client
npx orval --watch               # Regenerate on spec changes
```

This produces typed query hooks (`useGetUsers`, `useCreateUser`, etc.) with correct query keys, request/response types, and error types -- all derived from the OpenAPI spec.

**Using `openapi-typescript` (lighter, types-only):**

```bash
npx openapi-typescript ./openapi.json -o libs/shared/data-access/src/api-client/schema.d.ts
```

Generates TypeScript types from the spec. You write the fetch calls manually but with full type safety.

### Custom fetch wrapper

Centralize auth headers, base URL, and error handling:

```ts
// libs/shared/data-access/src/api-client/custom-fetch.ts
export async function customFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const token = useAppStore.getState().token

  const response = await fetch(`${import.meta.env.VITE_API_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new ApiError(response.status, error.message ?? 'Request failed')
  }

  return response.json()
}
```

### MSW (Mock Service Worker)

MSW intercepts HTTP requests at the network level, providing consistent API mocking across local development, Vitest, Storybook, and Playwright.

**Setup:**

```bash
npm install -D msw
npx msw init public/ --save     # For browser (dev + Storybook)
```

**Define handlers:**

```ts
// mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/users', () => {
    return HttpResponse.json([
      { id: '1', name: 'Alice', email: 'alice@example.com', role: 'admin' },
      { id: '2', name: 'Bob', email: 'bob@example.com', role: 'member' },
    ])
  }),

  http.post('/api/users', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ id: crypto.randomUUID(), ...body }, { status: 201 })
  }),

  http.get('/api/users/:id', ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      name: 'Alice',
      email: 'alice@example.com',
      role: 'admin',
    })
  }),
]
```

**Browser integration (development + Storybook):**

```ts
// mocks/browser.ts
import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)
```

```ts
// main.tsx (conditional startup)
async function bootstrap() {
  if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/browser')
    await worker.start({ onUnhandledRequest: 'bypass' })
  }

  const root = ReactDOM.createRoot(document.getElementById('root')!)
  root.render(<App />)
}

bootstrap()
```

**Vitest integration:**

```ts
// mocks/server.ts
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
```

```ts
// vitest.setup.ts
import { server } from './mocks/server'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

**Storybook integration:**

```ts
// .storybook/preview.ts
import { initialize, mswLoader } from 'msw-storybook-addon'

initialize()

const preview: Preview = {
  loaders: [mswLoader],
}
```

Per-story overrides:

```tsx
export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/users', () => HttpResponse.json([])),
      ],
    },
  },
}

export const Error: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/users', () => HttpResponse.json(
          { message: 'Internal Server Error' },
          { status: 500 }
        )),
      ],
    },
  },
}
```

### Rules

- Define handlers once in `mocks/handlers.ts`, reuse across dev, Vitest, and Storybook.
- Override handlers per-story or per-test for edge cases (empty states, errors, slow responses).
- Regenerate the API client (`npx orval`) whenever the backend OpenAPI spec changes.
- Never commit generated API client code without re-running the generator.
- Use `onUnhandledRequest: 'error'` in tests to catch unmocked API calls.

---

## 10. Internationalization (i18n)

Use **react-i18next** for multi-language support. It is the most mature React i18n library with TypeScript support, lazy loading, and pluralization.

### Setup

```bash
npm install react-i18next i18next i18next-browser-languagedetector i18next-http-backend
```

```ts
// libs/shared/util/src/i18n/i18n.ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import HttpBackend from 'i18next-http-backend'

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'es', 'fr', 'de', 'ja'],
    ns: ['common', 'auth', 'dashboard'],
    defaultNS: 'common',
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
```

### Translation file structure

```
public/locales/
  en/
    common.json       # Shared: buttons, labels, navigation
    auth.json         # Login, signup, password reset
    dashboard.json    # Dashboard-specific strings
  es/
    common.json
    auth.json
    dashboard.json
```

```json
{
  "welcome": "Welcome, {{name}}",
  "items": {
    "one": "{{count}} item",
    "other": "{{count}} items"
  },
  "actions": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete"
  }
}
```

### Usage in components

```tsx
import { useTranslation } from 'react-i18next'

function DashboardHeader({ user }: { user: User }) {
  const { t } = useTranslation('dashboard')

  return (
    <header>
      <h1>{t('welcome', { name: user.name })}</h1>
      <p>{t('items', { count: user.itemCount })}</p>
    </header>
  )
}
```

### Language switcher

```tsx
function LanguageSwitcher() {
  const { i18n } = useTranslation()

  return (
    <select
      value={i18n.language}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
    >
      <option value="en">English</option>
      <option value="es">Espanol</option>
      <option value="fr">Francais</option>
    </select>
  )
}
```

### Rules

- Never hardcode user-facing strings -- always use `t()`.
- Organize translations by namespace matching feature boundaries.
- Use `i18next-http-backend` to lazy-load translation files per language/namespace.
- Use ICU message format for pluralization and gender-aware strings.
- Pair with CSS logical properties (Section 0) for full RTL layout support.

---

## 11. Animation

Use **Framer Motion** (now **Motion**) for declarative React animations. It covers page transitions, layout animations, gesture handling, and scroll-driven effects.

### Setup

```bash
npm install motion
```

### Component enter/exit animations

```tsx
import { motion, AnimatePresence } from 'motion/react'

function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={styles.toast}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

### Layout animations

Animate between layouts automatically when elements change position or size:

```tsx
function FilterableTabs({ items }: { items: Item[] }) {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div className={styles.tabs}>
      {items.map((item) => (
        <motion.button
          key={item.id}
          layout
          onClick={() => setSelected(item.id)}
          className={styles.tab}
        >
          {item.label}
          {selected === item.id && (
            <motion.div className={styles.activeIndicator} layoutId="active" />
          )}
        </motion.button>
      ))}
    </div>
  )
}
```

### Page transitions

Wrap routes with `AnimatePresence` for cross-fade or slide transitions:

```tsx
import { useLocation } from 'react-router-dom'

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        <Routes location={location}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}
```

### Storybook integration

Create stories that demonstrate animation states:

```tsx
export const ToastAppearing: Story = {
  args: { message: 'Saved successfully', visible: true },
}

export const ToastDismissing: Story = {
  args: { message: 'Saved successfully', visible: false },
}
```

### Rules

- Use Framer Motion for JavaScript-driven animations (enter/exit, layout, gestures).
- Use CSS animations (in `.module.css`) for simple transforms and opacity -- they are cheaper and don't require JS.
- Keep durations short: 150-300ms for UI feedback, never exceed 500ms.
- Always provide `exit` animations via `AnimatePresence` to avoid abrupt disappearances.
- Use `layout` prop for smooth reordering/resizing instead of FLIP calculations.
- Respect `prefers-reduced-motion`: wrap animations with a media query check.

---

## 12. Storybook

### CSF3 story format

```tsx
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './Button'

const meta = {
  title: 'Atoms/Button',
  component: Button,
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'danger'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    onClick: { action: 'clicked' },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { children: 'Continue', variant: 'primary', size: 'md' },
}
```

### Rules

- `title` must mirror the folder hierarchy: `'Atoms/Button'`, `'Molecules/Card'`, `'Pages/Dashboard'`.
- Every file has a `Default` story showing the most common production-realistic state.
- Use `args` for stories controllable via Controls; use `render` for multi-component showcases.
- Use `parameters: { layout: 'fullscreen' }` for page-level stories.
- Name stories after what they show: `WithValidationErrors`, `Dismissible`, `Mobile` -- not `TestCase3`.

### Play functions (interaction testing)

```tsx
import { within, userEvent, expect } from '@storybook/test'

export const Dismissible: Story = {
  args: { dismissible: true, message: 'This can be dismissed.' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: /dismiss/i }))
    await expect(canvas.queryByRole('alert')).not.toBeInTheDocument()
  },
}
```

### Accessibility addon

`@storybook/addon-a11y` runs axe-core on every story. It catches WCAG violations in real-time during development. In CI, the Storybook test-runner executes these checks headlessly.

### Visual regression testing

Use **Chromatic** (by the Storybook team) to catch unintended visual changes:

```bash
npx chromatic --project-token=<token>
```

Chromatic captures a screenshot of every story, compares against the baseline, and flags pixel-level diffs. Integrate into CI to block merges on visual regressions.

### Storybook MCP (AI integration)

When Storybook is running, an MCP server is available at `http://localhost:6006/mcp`. AI agents use it to:

1. `list-all-documentation` -- discover components
2. `get-documentation` -- read prop interfaces and examples
3. `get-storybook-story-instructions` -- learn story conventions
4. `run-story-tests` -- validate interaction + accessibility tests
5. `preview-stories` -- render visual previews

**Hard rule:** Never hallucinate component props. Always call `get-documentation` before using any component.

### Storybook 9 features

- **Vitest-powered test runner:** All interaction tests run via Vitest with a single click. Test status reported in the sidebar.
- **Coverage reports:** See which component code is exercised by tests.
- **Watch mode:** Automatically re-runs relevant tests on file save.

### Composition (monorepo)

In an Nx monorepo, each library can have its own Storybook. Compose them into a single interface:

```ts
// .storybook/main.ts (root)
const config: StorybookConfig = {
  refs: {
    ui: { title: 'UI Library', url: 'http://localhost:6007' },
    features: { title: 'Features', url: 'http://localhost:6008' },
  },
}
```

---

## 13. Testing Strategy

### The testing trophy

```
            ╭────────────╮
            │  E2E Tests  │  Playwright -- critical user journeys
            ╰──────┬─────╯
         ╭─────────┴──────────╮
         │ Integration Tests  │  Storybook play functions -- component interactions
         ╰─────────┬──────────╯
      ╭────────────┴─────────────╮
      │     Component Tests      │  Vitest + RTL -- render logic, props, state
      ╰────────────┬─────────────╯
   ╭───────────────┴────────────────╮
   │      Static Analysis           │  TypeScript + ESLint + a11y lint
   ╰────────────────────────────────╯
```

### Layer breakdown

| Layer | Tool | Scope | Speed |
|-------|------|-------|-------|
| Static analysis | TypeScript strict + ESLint + `eslint-plugin-jsx-a11y` | Type errors, lint rules, a11y issues | Instant |
| Component tests | Vitest + React Testing Library | Single component render, props, callbacks | ~1ms each |
| Integration tests | Storybook play functions | Multi-step interactions, a11y checks via addon-a11y | ~100ms each |
| Visual regression | Chromatic | Screenshot diffs across all stories | Minutes (CI) |
| E2E tests | Playwright | Full user journeys across pages | ~2-10s each |

### Vitest + React Testing Library

```ts
// Button.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

describe('Button', () => {
  it('calls onClick when clicked', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    render(<Button onClick={onClick}>Submit</Button>)
    await user.click(screen.getByRole('button', { name: 'Submit' }))

    expect(onClick).toHaveBeenCalledOnce()
  })

  it('does not fire when disabled', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    render(<Button onClick={onClick} disabled>Submit</Button>)
    await user.click(screen.getByRole('button', { name: 'Submit' }))

    expect(onClick).not.toHaveBeenCalled()
  })
})
```

### Coverage thresholds

Set per library type in `vitest.config.ts`:

```ts
export default defineConfig({
  test: {
    coverage: {
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
})
```

| Library type | Target |
|-------------|--------|
| `type:ui` | 90% (atoms/molecules are small and testable) |
| `type:util` | 95% (pure functions) |
| `type:feature` | 75% (integration-heavy, covered by Storybook + E2E) |
| `type:data-access` | 85% (stores and API clients) |

---

## 14. Playwright E2E Testing

### Project structure

```
e2e/
  fixtures/
    auth.fixture.ts         # Authenticated user fixture
    test-data.ts            # Shared test data
  pages/
    LoginPage.ts            # Page Object Model
    DashboardPage.ts
  tests/
    auth.spec.ts
    dashboard.spec.ts
  playwright.config.ts
```

### Configuration

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? '50%' : undefined,
  reporter: process.env.CI
    ? [['html'], ['github']]
    : [['html']],

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 13'] } },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
})
```

### Page Object Model

Encapsulate page interactions in classes:

```ts
// e2e/pages/LoginPage.ts
import type { Page, Locator } from '@playwright/test'

export class LoginPage {
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator
  readonly errorAlert: Locator

  constructor(private page: Page) {
    this.emailInput = page.getByLabel('Email')
    this.passwordInput = page.getByLabel('Password')
    this.submitButton = page.getByRole('button', { name: 'Sign In' })
    this.errorAlert = page.getByRole('alert')
  }

  async goto() {
    await this.page.goto('/login')
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }
}
```

### Test fixtures

Extend Playwright's base test with custom fixtures:

```ts
// e2e/fixtures/auth.fixture.ts
import { test as base } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'

type Fixtures = {
  loginPage: LoginPage
}

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await use(loginPage)
  },
})

export { expect } from '@playwright/test'
```

### Network mocking

Mock API responses for deterministic tests:

```ts
test('shows error on failed login', async ({ page }) => {
  await page.route('**/api/auth/login', (route) =>
    route.fulfill({
      status: 401,
      json: { error: 'Invalid credentials' },
    })
  )

  const loginPage = new LoginPage(page)
  await loginPage.goto()
  await loginPage.login('bad@example.com', 'wrong')
  await expect(loginPage.errorAlert).toContainText('Invalid credentials')
})
```

### CI integration

Run Playwright with sharding for parallel execution:

```yaml
# In GitHub Actions matrix
strategy:
  matrix:
    shard: [1/4, 2/4, 3/4, 4/4]
steps:
  - run: npx playwright test --shard=${{ matrix.shard }}
```

### Rules

- Use locators (not CSS selectors) with `getByRole`, `getByLabel`, `getByText`.
- Every test is fully isolated -- no shared state between tests.
- Mock external APIs; only test what you control.
- Record traces and video on first retry for debugging flaky tests.
- Test critical user journeys, not individual component behavior (that belongs in Vitest/Storybook).

---

## 15. Accessibility

### Baseline: WCAG 2.2 Level AA

All components must meet WCAG 2.2 AA. This is a legal requirement in many jurisdictions and a quality baseline for enterprise software.

### Three-layer enforcement

| Layer | Tool | When |
|-------|------|------|
| **Static analysis** | `eslint-plugin-jsx-a11y` | On every save / commit |
| **Runtime audit** | `@storybook/addon-a11y` (axe-core) | During Storybook development |
| **E2E verification** | `@axe-core/playwright` | In Playwright test suite |

### ESLint static checks

```bash
npm install -D eslint-plugin-jsx-a11y
```

```ts
// eslint.config.mjs
import jsxA11y from 'eslint-plugin-jsx-a11y'

export default [
  jsxA11y.flatConfigs.recommended,
]
```

Catches: missing `alt` text, invalid ARIA attributes, missing form labels, non-interactive elements with click handlers, etc.

### Axe-core in Playwright

```ts
import AxeBuilder from '@axe-core/playwright'

test('login page has no accessibility violations', async ({ page }) => {
  await page.goto('/login')
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})
```

### Keyboard navigation patterns

- Every interactive element must be reachable via `Tab`.
- Custom components must implement expected keyboard behavior (e.g., `Enter`/`Space` for buttons, `Arrow` keys for menus).
- Visible focus indicators on all focusable elements:

```css
.button:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}
```

### Semantic HTML

- Use `<button>` for actions, `<a>` for navigation -- never `<div onClick>`.
- Use landmark elements: `<nav>`, `<main>`, `<aside>`, `<header>`, `<footer>`.
- Use heading hierarchy (`h1` > `h2` > `h3`) without skipping levels.
- Use `aria-live` regions for dynamic content updates (toast notifications, loading states).

---

## 16. Performance

### Core Web Vitals targets

| Metric | Target | What it measures |
|--------|--------|-----------------|
| **LCP** (Largest Contentful Paint) | < 2.5s | Loading speed |
| **INP** (Interaction to Next Paint) | < 200ms | Responsiveness |
| **CLS** (Cumulative Layout Shift) | < 0.1 | Visual stability |

### Code splitting

Split at the route level using `React.lazy` + `Suspense`:

```tsx
const Dashboard = React.lazy(() => import('./pages/Dashboard/Dashboard'))
const Settings = React.lazy(() => import('./pages/Settings/Settings'))

function App() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  )
}
```

### React 19 Compiler

The React Compiler eliminates the need for manual `useMemo`, `useCallback`, and `React.memo`. Enable it in Vite:

```bash
npm install -D babel-plugin-react-compiler
```

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
  ],
})
```

### Bundle analysis

Use `rollup-plugin-visualizer` to inspect bundle composition:

```bash
npm install -D rollup-plugin-visualizer
```

```ts
// vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    visualizer({ open: true, gzipSize: true }),
  ],
})
```

### Rules

- Lazy-load all routes and heavy components (charts, rich text editors, modals).
- Never use barrel `index.ts` files -- import directly from source paths (see Section 1).
- Measure with Lighthouse CI in your pipeline; fail the build if LCP > 3s.
- Use `loading="lazy"` on images below the fold.
- Prefer CSS animations over JS-driven animations for transform/opacity.

---

## 17. Code Quality and CI/CD

### Linting

ESLint flat config with Nx plugin and accessibility rules:

```ts
// eslint.config.mjs
import nx from '@nx/eslint-plugin'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  ...tseslint.configs.strictTypeChecked,
  jsxA11y.flatConfigs.recommended,
  {
    plugins: { '@nx': nx },
    rules: {
      '@nx/enforce-module-boundaries': ['error', { /* constraints */ }],
    },
  },
)
```

### Formatting

Prettier with a minimal config:

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100
}
```

### Pre-commit hooks

```bash
npm install -D husky lint-staged
npx husky init
```

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{css,json,md}": ["prettier --write"]
  }
}
```

### Conventional Commits

Use the [Conventional Commits](https://www.conventionalcommits.org/) format for automated changelogs:

```
feat(ui): add Tooltip component with hover delay
fix(auth): handle expired refresh token gracefully
refactor(stores): split appStore into domain slices
```

### CI/CD pipeline (GitHub Actions)

```yaml
name: CI
on:
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - run: npm ci

      - uses: nrwl/nx-set-shas@v4

      - name: Lint
        run: npx nx affected -t lint

      - name: Type check
        run: npx nx affected -t typecheck

      - name: Unit & integration tests
        run: npx nx affected -t test -- --coverage

      - name: Build
        run: npx nx affected -t build

      - name: Storybook tests
        run: |
          npx nx affected -t build-storybook
          npx concurrently -k -s first \
            "npx http-server storybook-static -p 6006 --silent" \
            "npx wait-on tcp:6006 && npx test-storybook --url http://localhost:6006"

      - name: Playwright E2E
        run: npx nx affected -t e2e

      - name: Chromatic visual tests
        run: npx chromatic --auto-accept-changes=main
        env:
          CHROMATIC_PROJECT_TOKEN: ${{ secrets.CHROMATIC_TOKEN }}
```

### Quality gates

A PR cannot merge unless all of these pass:
1. Zero ESLint errors
2. Zero TypeScript errors
3. All unit tests pass with coverage above thresholds
4. All Storybook interaction tests pass
5. All accessibility checks pass (axe-core)
6. No unreviewed visual regressions (Chromatic)
7. All Playwright E2E tests pass

---

## 18. Error Handling and Observability

### Error Boundaries

Wrap route segments with error boundaries to isolate failures:

```tsx
import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { hasError: boolean }

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logger.error('Unhandled render error', { error, componentStack: info.componentStack })
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <FallbackUI />
    }
    return this.props.children
  }
}
```

Place boundaries at:
- Route level (catch page-level crashes)
- Feature level (isolate widget failures from the whole page)
- Data-fetching boundaries (catch API errors with Suspense fallbacks)

### Runtime validation with Zod

Validate API responses at the boundary to fail fast:

```ts
import { z } from 'zod'

const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['admin', 'member', 'viewer']),
})

type User = z.infer<typeof UserSchema>

async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`)
  const data = await response.json()
  return UserSchema.parse(data)
}
```

### Feature flags

Use a feature flag service (LaunchDarkly, Unleash, or Flagsmith) to decouple deployment from release:

```tsx
import { useFlag } from '@shared/feature-flags'

function Dashboard() {
  const showNewChart = useFlag('dashboard-new-chart')

  return (
    <main>
      {showNewChart ? <NewRevenueChart /> : <LegacyRevenueChart />}
    </main>
  )
}
```

### Structured logging

Use a consistent logging interface across the app:

```ts
interface Logger {
  info(message: string, context?: Record<string, unknown>): void
  warn(message: string, context?: Record<string, unknown>): void
  error(message: string, context?: Record<string, unknown>): void
}
```

In production, ship logs to your observability platform (Datadog, Sentry, etc.). In development, log to the console with structured JSON.

---

## Mental Model

```
Static Analysis   →  Catches errors before runtime
Responsive        →  Adaptive foundation for all devices
Atomic Design     →  Structural hierarchy for UI components
Nx Monorepo       →  Scalability + boundary enforcement
Design Tokens     →  Visual consistency (W3C spec)
MUI v6            →  Component library + theme system + Pigment CSS
Zustand           →  Predictable client state
TanStack Query    →  Server state, caching, background sync
TanStack Form     →  Type-safe forms + Zod validation
API Layer + MSW   →  Type-safe API client + consistent mocking
i18n              →  Multi-language / multi-region support
Animation         →  Polished UI transitions + micro-interactions
Storybook         →  Component development + documentation + testing
Vitest            →  Fast unit/component testing
Playwright        →  Reliable end-to-end testing
Accessibility     →  WCAG 2.2 AA as non-negotiable baseline
Performance       →  Core Web Vitals as measurable targets
CI/CD             →  Automated quality gates on every PR
Observability     →  Error boundaries + logging + feature flags
```

Together these form a complete enterprise frontend system.
