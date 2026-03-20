# Addons and Tooling

The addons installed in this project, how to add new ones, and how to integrate Storybook with AI agents and CI pipelines.

---

## Installed Addons

Each addon adds functionality to the Storybook UI. Here's what's installed and what it provides:

| Addon | Panel / Feature | What it does |
|-------|----------------|--------------|
| **@storybook/addon-essentials** | Controls, Actions, Viewport, Backgrounds, Docs, Measure, Outline | The core bundle. Controls renders prop editors, Actions logs events, Viewport switches screen sizes, Docs generates documentation pages. |
| **@storybook/addon-a11y** | Accessibility tab | Runs axe-core on the rendered story and reports WCAG violations, warnings, and passes in real-time. |
| **@storybook/addon-interactions** | Interactions tab | Shows a step-by-step log of play function execution with pass/fail status. You can step through, pause, and rerun. |
| **@storybook/addon-links** | (Programmatic) | Enables linking between stories. Useful for navigating from one component's story to a related one. |
| **@storybook/test** | (Used in story code) | Provides `within`, `userEvent`, `expect`, and `fn` for writing play functions. Not a panel addon -- it's the testing API. |
| **@storybook/theming** | (Used in config) | Provides the `create()` function used in `theme.ts` to customize Storybook's chrome. |

The toolbar icons at the top of the canvas (grid overlay, measure tool, outline toggle, viewport selector, vision simulator) all come from `addon-essentials`.

---

## Adding a New Addon

1. Install the package:
   ```bash
   npm install --save-dev @storybook/addon-<name>
   ```
2. Add it to the `addons` array in `.storybook/main.ts`
3. Restart Storybook

---

## Storybook MCP Addon (AI Integration)

The **MCP (Model Context Protocol) addon** connects your running Storybook to AI coding agents (Claude, Copilot, Gemini, Codex, etc.), letting them understand your components, generate stories, and run tests -- all through a standard protocol.

### What it does

When the addon is installed, Storybook exposes an MCP server at `http://localhost:6006/mcp`. AI agents connect to this server and get access to three toolsets:

| Toolset | Tools | Purpose |
|---------|-------|---------|
| **Development** | `get-storybook-story-instructions`, `preview-stories` | Helps agents write well-structured stories and preview them in chat. |
| **Docs** | `list-all-documentation`, `get-documentation`, `get-documentation-for-story` | Lets agents discover your components, read their props and usage examples, and reuse them correctly when generating UI. |
| **Testing** | `run-story-tests` | Runs interaction tests and accessibility checks on stories, returns results. Agents can fix failures and re-run, creating a self-healing loop. |

### Why it matters

Without the MCP addon, an AI agent guesses at component APIs based on naming conventions. With it, the agent:

- **Reads your actual prop interfaces** instead of hallucinating props that don't exist
- **Follows your documented patterns** for how components should be used
- **Writes stories** following your project's conventions
- **Runs tests** to validate its work and fixes issues automatically
- **Checks accessibility** and resolves violations before you review

### Installation

```bash
# Install and register the addon
npx storybook add @storybook/addon-mcp

# Add the MCP server to your AI agent
npx mcp-add --type http --url "http://localhost:6006/mcp" --scope project
```

The `mcp-add` command configures your agent (Claude Code, VS Code Copilot, etc.) to connect to the Storybook MCP server. You'll be prompted for a name -- use something like `design-system-storybook`.

### Agent instructions

Add guidance to your `AGENTS.md` (or `CLAUDE.md`) so the agent uses Storybook as its source of truth:

```markdown
When working on UI components, always use the `design-system-storybook` MCP tools
to access Storybook's component and documentation knowledge before taking any action.

- CRITICAL: Never hallucinate component properties! Before using ANY property on a
  component, use `get-documentation` to check if the property actually exists.
- Use `list-all-documentation` to discover available components.
- Use `get-storybook-story-instructions` to follow current conventions when writing stories.
- Check your work by running `run-story-tests`.
```

### Typical AI workflow

Here's what happens when you prompt an agent with "Build a login form":

1. Agent calls `list-all-documentation` -- discovers Input, Button, Toggle components
2. Agent calls `get-documentation` for each -- learns the exact props, types, and usage patterns
3. Agent generates a LoginForm component composing those existing components
4. Agent calls `get-storybook-story-instructions` -- learns how to write stories for this project
5. Agent writes stories covering default state, validation errors, loading, etc.
6. Agent calls `run-story-tests` -- finds a color contrast accessibility issue
7. Agent fixes the issue and re-runs tests -- all pass
8. Agent calls `preview-stories` -- shows you previews in chat

### Requirements

- Vite-based Storybook setup (this project qualifies -- we use `@storybook/react-vite`)
- React project (the docs toolset is currently React-only)
- Storybook must be running (`npm run storybook`) for the MCP server to be accessible

### Compatibility

The MCP addon works with any MCP-compatible agent, including:
- Claude Code
- VS Code Copilot
- Google Gemini CLI
- OpenAI Codex
- Cursor (via MCP server configuration)

---

## CI Testing with test-runner

Storybook stories can be run as tests in CI using `@storybook/test-runner`:

```bash
# Install
npm install --save-dev @storybook/test-runner

# Run (requires Storybook to be running or a static build)
npx test-storybook
```

This starts a headless browser, visits every story, and:
- Verifies each story renders without errors
- Runs any play functions as assertions
- Reports failures with details

For CI pipelines, you'd typically build a static Storybook first, then run the test-runner against it:

```bash
npm run build-storybook
npx http-server storybook-static --port 6006 &
npx test-storybook --url http://localhost:6006
```
