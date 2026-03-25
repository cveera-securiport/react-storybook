# Scaffold Plan

Step-by-step plan to stand up the enterprise frontend monorepo defined in `.cursor/skills/frontend-architecture/SKILL.md`. Each phase builds on the previous one. Check off tasks as you go.

---

## Phase 0 — Nx Workspace & Toolchain

> Goal: Empty Nx workspace with all DX tooling configured.

- [ ] Create Nx workspace (`npx create-nx-workspace@latest --preset=apps`)
- [ ] Configure `tsconfig.base.json` with strict mode, path aliases (`@ibc/*`, `@shell/*`, `@agent/*`, `@shared/*`)
- [ ] Set up ESLint flat config (`eslint.config.mjs`)
  - [ ] `typescript-eslint` strict type-checked rules
  - [ ] `eslint-plugin-jsx-a11y` recommended
  - [ ] `@nx/enforce-module-boundaries` with type + scope tag constraints
- [ ] Set up Prettier (`.prettierrc` — semi: false, singleQuote: true, trailingComma: all, printWidth: 100)
- [ ] Set up Husky + lint-staged for pre-commit hooks
  - [ ] `*.{ts,tsx}` → eslint --fix, prettier --write
  - [ ] `*.{css,json,md}` → prettier --write
- [ ] Configure Conventional Commits (commitlint + `@commitlint/config-conventional`)
- [ ] Connect Nx Cloud (`npx nx connect`)
- [ ] Verify: `nx graph` shows empty workspace, `nx affected -t lint` passes

---

## Phase 1 — Design Tokens & MUI Theme

> Goal: A single `libs/shared/tokens` library that produces CSS variables and an MUI theme.

- [ ] Scaffold library: `nx g @nx/react:library libs/shared/tokens --tags="type:util,scope:shared"`
- [ ] Create W3C Design Token JSON files in `tokens/`
  - [ ] `primitives.json` — raw palette, spacing scale, radii, shadows, typography
  - [ ] `semantic.json` — intent aliases (color.primary, surface, text, border)
  - [ ] `component.json` — component-scoped overrides (optional)
- [ ] Install and configure Style Dictionary v4
  - [ ] `style-dictionary.config.ts` — source: `tokens/**/*.json`, output: `libs/shared/tokens/src/design-tokens.css`
  - [ ] Add `build:tokens` script to workspace root `package.json`
- [ ] Create MUI theme (`libs/shared/tokens/src/mui-theme.ts`)
  - [ ] `createTheme` with `cssVariables: true`
  - [ ] Map token palette values into `palette`, `typography`, `spacing`, `shape`
  - [ ] `colorSchemes` for light/dark with `colorSchemeSelector: 'data-theme'`
  - [ ] `components` overrides (MuiButton: disableElevation, textTransform none; MuiTextField: outlined, small)
- [ ] Create theme type augmentation (`libs/shared/tokens/src/theme.d.ts`)
  - [ ] Extend `Theme`, `ThemeOptions`, `Palette`, `PaletteOptions`
  - [ ] Add custom color overrides (e.g. `neutral`)
- [ ] Wire semantic CSS aliases to MUI variables in `design-tokens.css`
  - [ ] `--surface-primary: var(--mui-palette-background-default)` etc.
- [ ] Configure `package.json` `exports` field for granular entry points
- [ ] Verify: `nx build shared-tokens` succeeds, `design-tokens.css` generated

---

## Phase 2 — Shared Infrastructure Libraries

> Goal: API client, state management, schemas, test utilities, and MSW mocking — all ready before any UI work.

### 2a. `libs/shared/util`

- [ ] Scaffold: `nx g @nx/react:library libs/shared/util --tags="type:util,scope:shared"`
- [ ] Create i18n setup (`src/i18n/i18n.ts`)
  - [ ] Install `react-i18next`, `i18next`, `i18next-browser-languagedetector`, `i18next-http-backend`
  - [ ] Configure with fallbackLng: `en`, namespaces: `['common', 'auth', 'dashboard']`
- [ ] Create `public/locales/en/common.json` with base translation keys (actions.save, actions.cancel, actions.delete)
- [ ] Stub utility hooks: `useDebounce`, `useMediaQuery`, `useLocalStorage`

### 2b. `libs/shared/data-access`

- [ ] Scaffold: `nx g @nx/react:library libs/shared/data-access --tags="type:data-access,scope:shared"`
- [ ] Create custom fetch wrapper (`src/api-client/custom-fetch.ts`)
  - [ ] Auth header injection from Zustand store
  - [ ] Base URL from `import.meta.env.VITE_API_URL`
  - [ ] `ApiError` class with status + message
- [ ] Install and configure Orval (`orval.config.ts`)
  - [ ] Input: `./openapi.json` (stub or real spec)
  - [ ] Output: `libs/shared/data-access/src/api-client/generated.ts`, client: `react-query`
- [ ] Create TanStack Query client (`src/query-client.ts`)
  - [ ] `staleTime: 60_000`, `gcTime: 300_000`, `retry: 2`, `refetchOnWindowFocus: true`
- [ ] Create query key factories (`src/query-keys.ts`)
  - [ ] `userKeys` (all, lists, list, details, detail)
- [ ] Create example query hook (`src/hooks/useUser.ts`)
- [ ] Create example mutation hook (`src/hooks/useUpdateUser.ts`) with cache invalidation
- [ ] Create Zod schemas (`src/schemas/user.ts`)
  - [ ] `UserSchema`, `CreateUserSchema`, `UpdateUserSchema`
  - [ ] Export inferred types
- [ ] Create Zustand store (`src/stores/appStore.ts`)
  - [ ] Auth slice (user, token, login, logout)
  - [ ] UI slice (sidebarOpen, theme preference)
  - [ ] Combined store with `devtools` + `immer` + `persist` middleware
- [ ] Typed selector hooks (`useIsAuthenticated`, `useCurrentUser`)

### 2c. `libs/shared/testing`

- [ ] Scaffold: `nx g @nx/react:library libs/shared/testing --tags="type:util,scope:shared"`
- [ ] Custom `renderWithProviders` that wraps `QueryClientProvider` + `ThemeProvider` + `MemoryRouter`
- [ ] Reusable test fixtures (mock users, mock tokens)
- [ ] Vitest setup file (`vitest.setup.ts`) with MSW server lifecycle

### 2d. MSW Mocking

- [ ] Install MSW: `npm install -D msw`
- [ ] Initialize browser worker: `npx msw init public/ --save`
- [ ] Create shared handlers (`mocks/handlers.ts`)
  - [ ] GET /api/users, POST /api/users, GET /api/users/:id
  - [ ] POST /api/auth/login, POST /api/auth/logout
- [ ] Create browser worker (`mocks/browser.ts`)
- [ ] Create node server (`mocks/server.ts`)
- [ ] Wire into Vitest setup (`beforeAll/afterEach/afterAll` lifecycle)
- [ ] Wire into Storybook (`msw-storybook-addon`)

---

## Phase 3 — Shared Component Library (`libs/ibc/ui`)

> Goal: Atomic design system wrapping MUI primitives, fully documented in Storybook.

### 3a. Library + Storybook Setup

- [ ] Scaffold: `nx g @nx/react:library libs/ibc/ui --tags="type:ui,scope:shared"`
- [ ] Configure Storybook for the library
  - [ ] `.storybook/main.ts` — stories glob, `@storybook/react-vite` framework
  - [ ] `.storybook/preview.ts` — import design tokens, MUI ThemeProvider via `@storybook/addon-themes` decorator, MSW loader
  - [ ] `.storybook/theme.ts` — branded Storybook UI theme
- [ ] Install Storybook addons: `addon-a11y`, `addon-themes`, `addon-interactions`, `msw-storybook-addon`
- [ ] Configure `package.json` `exports` for granular component imports

### 3b. Atoms

Each atom: component wrapping MUI + stories file. No `.module.css` for MUI wrappers.

- [ ] `atoms/Button/Button.tsx` + `Button.stories.tsx`
  - Variants: primary, secondary, danger, ghost. Sizes: sm, md, lg.
- [ ] `atoms/Input/Input.tsx` + `Input.stories.tsx`
  - Props: label, error, placeholder, disabled. Accepts `ref`.
- [ ] `atoms/Badge/Badge.tsx` + `Badge.stories.tsx`
  - Variants: info, success, warning, error. Sizes: sm, md.
- [ ] `atoms/Avatar/Avatar.tsx` + `Avatar.stories.tsx`
  - Props: src, name (fallback initials), size.
- [ ] `atoms/Toggle/Toggle.tsx` + `Toggle.stories.tsx`
  - Props: checked, onChange, label, disabled.
- [ ] `atoms/Typography/Typography.tsx` + `Typography.stories.tsx`
  - Polymorphic `as` prop. Variants: h1–h6, body1, body2, caption.
- [ ] `atoms/IconButton/IconButton.tsx` + `IconButton.stories.tsx`

### 3c. Molecules

- [ ] `molecules/Card/Card.tsx` + `Card.stories.tsx`
  - Compound: Card, Card.Header, Card.Body, Card.Footer.
- [ ] `molecules/Alert/Alert.tsx` + `Alert.stories.tsx`
  - Variants: info, success, warning, error. Dismissible with play function test.
- [ ] `molecules/Tooltip/Tooltip.tsx` + `Tooltip.stories.tsx`
- [ ] `molecules/SearchBar/SearchBar.tsx` + `SearchBar.stories.tsx`
  - Debounced input + clear button.
- [ ] `molecules/Dialog/Dialog.tsx` + `Dialog.stories.tsx`
  - Accessible modal. Focus trap. Keyboard close (Esc).
- [ ] `molecules/Tabs/Tabs.tsx` + `Tabs.stories.tsx`
  - Keyboard arrow navigation.

### 3d. Organisms

- [ ] `organisms/Navbar/Navbar.tsx` + `Navbar.stories.tsx`
  - Logo, nav links, ThemeToggle, UserMenu, LanguageSwitcher.
- [ ] `organisms/Sidebar/Sidebar.tsx` + `Sidebar.stories.tsx`
  - Collapsible. Active link highlighting. Keyboard navigable.
- [ ] `organisms/DataTable/DataTable.tsx` + `DataTable.stories.tsx`
  - Sorting, pagination, row selection. MSW-backed data story.
- [ ] `organisms/Form/Form.tsx` + `Form.stories.tsx`
  - TanStack Form + Zod integration example. Play function for validation test.

### 3e. Validation

- [ ] Run all Storybook interaction tests: `npx test-storybook`
- [ ] Run accessibility checks on all stories (addon-a11y)
- [ ] Verify direct imports work: `import { Button } from '@ibc/ui/atoms/Button'`

---

## Phase 4 — Shell Application

> Goal: Working Shell app with routing, providers, and feature pages.

### 4a. App Shell

- [ ] Scaffold: `nx g @nx/react:application apps/shell --tags="type:app,scope:shell"`
- [ ] Create root `App.tsx` with provider stack:
  - `QueryClientProvider` → `ThemeProvider` + `CssBaseline` → `I18nextProvider` → `ErrorBoundary` → `Router`
- [ ] Conditional MSW bootstrap in `main.tsx` (`import.meta.env.DEV`)
- [ ] Route-level code splitting with `React.lazy` + `Suspense`
- [ ] Page transition animation with `AnimatePresence`

### 4b. Shell-Specific Libraries

- [ ] Scaffold: `nx g @nx/react:library libs/shell/ui --tags="type:ui,scope:shell"`
  - [ ] `ShellNavbar` (extends Navbar with shell-specific links)
  - [ ] `ShellSidebar` (extends Sidebar with shell-specific navigation)
- [ ] Scaffold: `nx g @nx/react:library libs/shell/feature-dashboard --tags="type:feature,scope:shell"`
  - [ ] Dashboard page component
  - [ ] Dashboard-specific query hooks (metrics, charts)
  - [ ] Storybook stories with MSW-mocked data
- [ ] Scaffold: `nx g @nx/react:library libs/shell/feature-settings --tags="type:feature,scope:shell"`
  - [ ] Settings page component
  - [ ] Theme toggle (useColorScheme)
  - [ ] Language switcher
  - [ ] Profile update form (TanStack Form + Zod)

### 4c. Validation

- [ ] `nx serve shell` — app loads on :5173
- [ ] Login → Dashboard → Settings flow works
- [ ] Light/dark theme toggle persists
- [ ] Module boundaries: shell cannot import from agent (`nx lint`)

---

## Phase 5 — Agent Application

> Goal: Working Agent app with its own feature libraries.

- [ ] Scaffold: `nx g @nx/react:application apps/agent --tags="type:app,scope:agent"`
- [ ] Create root `App.tsx` with same provider stack as shell
- [ ] Scaffold: `nx g @nx/react:library libs/agent/ui --tags="type:ui,scope:agent"`
  - [ ] `AgentToolbar` component + stories
  - [ ] `AgentPanel` component + stories
- [ ] Scaffold: `nx g @nx/react:library libs/agent/feature-workspace --tags="type:feature,scope:agent"`
  - [ ] Workspace page component
  - [ ] Agent-specific query hooks
  - [ ] Storybook stories
- [ ] Verify: `nx serve agent` loads on a different port
- [ ] Module boundaries: agent cannot import from shell (`nx lint`)

---

## Phase 6 — Testing Infrastructure

> Goal: Full testing pyramid from static analysis through E2E, with coverage thresholds.

### 6a. Vitest

- [ ] Root `vitest.config.ts` with:
  - [ ] Coverage thresholds: statements 80%, branches 75%, functions 80%, lines 80%
  - [ ] MSW server integration in setup file
  - [ ] `@testing-library/jest-dom` matchers
- [ ] Per-library type coverage overrides:
  - [ ] `type:ui` → 90%
  - [ ] `type:util` → 95%
  - [ ] `type:feature` → 75%
  - [ ] `type:data-access` → 85%
- [ ] Write unit tests for at least:
  - [ ] 2 atoms (Button, Input)
  - [ ] 1 Zustand slice (auth)
  - [ ] 1 query hook (useUser)
  - [ ] 1 utility function

### 6b. Storybook Tests

- [ ] Ensure all stories pass `npx test-storybook`
- [ ] Verify addon-a11y catches known violations (test with intentionally broken component)

### 6c. Playwright E2E

- [ ] Create `e2e/` directory structure:
  - [ ] `fixtures/auth.fixture.ts`
  - [ ] `fixtures/test-data.ts`
  - [ ] `pages/LoginPage.ts` (Page Object Model)
  - [ ] `pages/DashboardPage.ts`
  - [ ] `tests/auth.spec.ts`
  - [ ] `tests/dashboard.spec.ts`
- [ ] `playwright.config.ts`:
  - [ ] Projects: chromium, firefox, webkit, mobile-chrome, mobile-safari
  - [ ] `trace: 'on-first-retry'`, `screenshot: 'only-on-failure'`, `video: 'on-first-retry'`
  - [ ] `webServer` pointing to `npm run dev`
- [ ] Install `@axe-core/playwright` and add a11y E2E test
- [ ] Write E2E tests:
  - [ ] Login flow (happy path + error state)
  - [ ] Dashboard loads with data
  - [ ] Accessibility scan on login + dashboard pages

### 6d. Visual Regression

- [ ] Set up Chromatic (`npx chromatic --project-token=<token>`)
- [ ] Configure to auto-accept on `main` branch
- [ ] Verify baseline snapshots captured for all stories

---

## Phase 7 — CI/CD Pipeline

> Goal: GitHub Actions workflow with all quality gates.

- [ ] Create `.github/workflows/ci.yml`:
  - [ ] Trigger on `pull_request` to `main`
  - [ ] Checkout with `fetch-depth: 0`
  - [ ] Node 22 + npm cache
  - [ ] `nrwl/nx-set-shas@v4` for affected calculation
  - [ ] Steps (all using `nx affected`):
    1. Lint
    2. Type check
    3. Unit + integration tests (with coverage)
    4. Build
    5. Storybook tests (build-storybook → http-server → test-storybook)
    6. Playwright E2E (with sharding: `matrix.shard: [1/4, 2/4, 3/4, 4/4]`)
    7. Chromatic visual tests
- [ ] Configure branch protection rules requiring all checks to pass
- [ ] Verify: open a test PR, all jobs run and pass

---

## Phase 8 — Polish & Cross-Cutting Concerns

> Goal: i18n, animation, error handling, feature flags, observability.

### 8a. Internationalization

- [ ] Wire i18n provider into both app shells (shell + agent)
- [ ] Create translation files for at least `en` and one other language
- [ ] Add `LanguageSwitcher` to Navbar
- [ ] Verify: switching language updates all visible strings

### 8b. Animation

- [ ] Install `motion` (Framer Motion)
- [ ] Add page transitions to shell app router (`AnimatePresence`)
- [ ] Add enter/exit animations to Alert (dismissible) and Toast components
- [ ] Add `layout` animation to Tabs active indicator
- [ ] Verify: `prefers-reduced-motion` disables animations

### 8c. Error Handling

- [ ] Create `ErrorBoundary` component in `ibc/ui`
- [ ] Place error boundaries at route level in both apps
- [ ] Create `FallbackUI` component (friendly error page)
- [ ] Add runtime Zod validation to API response layer (`customFetch`)

### 8d. Feature Flags

- [ ] Create `libs/shared/feature-flags` with `useFlag` hook
- [ ] Stub implementation (JSON config or env-var based for dev)
- [ ] Document how to swap in LaunchDarkly / Unleash / Flagsmith

### 8e. Structured Logging

- [ ] Create `Logger` interface in `libs/shared/util`
- [ ] Console implementation for dev, structured JSON for production
- [ ] Wire into ErrorBoundary `componentDidCatch`

---

## Phase 9 — Module Federation (Optional)

> Goal: Shell loads Agent as a remote micro-frontend.

- [ ] `nx g @nx/react:host apps/shell --remotes=agent`
- [ ] Configure shell as host, agent as remote
- [ ] Verify: shell loads agent module at runtime
- [ ] Configure `--devRemotes` for local development

---

## Verification Checklist

Run after all phases are complete:

- [ ] `nx graph` — dependency graph matches the architecture diagram
- [ ] `nx run-many -t lint` — zero errors across all projects
- [ ] `nx run-many -t test` — all unit tests pass with coverage thresholds met
- [ ] `nx run-many -t build` — all apps and libraries build cleanly
- [ ] `npx test-storybook` — all interaction + a11y tests pass
- [ ] `npx playwright test` — all E2E tests pass across browsers
- [ ] Module boundaries enforced: shell ↛ agent, agent ↛ shell, shared ↛ shell/agent
- [ ] Light/dark theme works end-to-end
- [ ] i18n language switching works end-to-end
- [ ] Error boundaries catch and display friendly fallback
- [ ] Bundle size within budget (check with `rollup-plugin-visualizer`)

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `nx serve shell` | Run shell app on :5173 |
| `nx serve agent` | Run agent app on :5174 |
| `nx storybook ibc-ui` | Launch Storybook for shared components on :6006 |
| `nx affected -t lint test build` | CI: lint, test, build affected projects |
| `nx graph` | Visualize project dependency graph |
| `npx orval` | Regenerate API client from OpenAPI spec |
| `npx test-storybook` | Run all Storybook interaction + a11y tests |
| `npx playwright test` | Run all E2E tests |
| `npx chromatic` | Run visual regression tests |
| `npm run build:tokens` | Rebuild design tokens from JSON → CSS |
