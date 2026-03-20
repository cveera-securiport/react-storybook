# FAQ

Common questions about working with Storybook in this project.

---

### How do I mock data in stories?

Components receive all data via props, so there's no API mocking needed. Data is provided through three patterns:

1. **Inline `args`** -- set props directly on a story. Best for atoms with a few props.
   ```typescript
   export const Default: Story = {
     args: { children: 'Click me', variant: 'primary' },
   }
   ```
2. **Shared `args` on `meta`** -- define defaults once, inherit in every story. Best when most stories share the same base data (e.g. Navbar with nav items).
   ```typescript
   const meta: Meta<typeof Navbar> = {
     args: { items: [...], brandName: 'Design System' },
   }
   ```
3. **Module-level constants** -- define typed arrays at the top of the file for larger data sets (e.g. DataTable rows, Dashboard stats). Multiple stories reference the same constants.
   ```typescript
   const sampleUsers: User[] = [
     { id: '1', name: 'Alice', email: 'alice@example.com', role: 'Admin', status: 'Active' },
     // ...
   ]
   export const Default: Story = { args: { data: sampleUsers } }
   ```

If your components eventually fetch data from an API, you can add [MSW (Mock Service Worker)](https://mswjs.io/) via `msw-storybook-addon` to intercept network requests at the story level.

---

### How do I make a story full-width instead of centered?

Override the `layout` parameter. The global default is `centered` (set in `preview.ts`). For page-level or full-width stories:

```typescript
export const Default: Story = {
  parameters: { layout: 'fullscreen' },
}
```

Options are `centered`, `padded`, and `fullscreen`.

---

### How do I test a story at a specific viewport size?

Use the `viewport` parameter. Storybook ships with presets like `mobile1`, `mobile2`, `tablet`, etc.:

```typescript
export const Mobile: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
}
```

---

### How does autodocs work?

The `tags: ['autodocs']` line in `preview.ts` tells Storybook to generate a **Docs** page for every component automatically. It combines:
- The prop table (extracted from TypeScript interfaces via `react-docgen-typescript`)
- A live preview of each story
- Code snippets showing how to use the component

You can also write custom docs using MDX files if you need more narrative control.

---

### How do play functions differ from unit tests?

Play functions run **inside the Storybook canvas**, so you see each interaction happen visually. They use the same Testing Library API (`getByRole`, `userEvent.click`, `expect`) as unit tests, but:
- They execute when the story loads (or when you click "Rerun" in the Interactions panel)
- They're tied to a specific visual state, making them great for regression testing
- They can be run in CI via `test-storybook`

---

### Can I use Storybook stories as test cases in CI?

Yes. See the [CI Testing section](./addons-and-tooling.md#ci-testing-with-test-runner) in the addons doc for setup details.

---

### Why CSS Modules instead of Tailwind / styled-components / etc.?

CSS Modules were chosen for this demo because they:
- Need zero additional dependencies or config
- Produce scoped class names out of the box with Vite
- Make the connection between design tokens (`var(--color-primary-500)`) and styles explicit and easy to follow
- Keep the focus on Storybook patterns rather than a CSS framework

---

### Where do design tokens come from in a real project?

In production, tokens are typically exported from a design tool (Figma, Tokens Studio) as JSON and transformed into CSS custom properties via a build step (e.g. Style Dictionary). In this demo, they're hand-authored in `src/tokens/design-tokens.css` for simplicity. The consumption pattern (CSS Modules using `var(--token)`) stays the same either way.
