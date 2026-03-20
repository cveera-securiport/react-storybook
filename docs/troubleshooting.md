# Troubleshooting

Solutions for common issues when working with Storybook in this project.

---

### My new story doesn't appear in the sidebar

- **Check the file name.** It must match the glob in `main.ts`: `*.stories.ts` or `*.stories.tsx`. A file named `Button.story.tsx` or `ButtonStories.tsx` won't be found.
- **Check the export.** The meta must be the `default` export. Named-only exports won't register as a story group.
- **Check the `title`.** If two story files have the same `title`, they'll collide. Each must be unique.
- **Restart Storybook.** File additions sometimes need a restart since the watcher may not pick up a brand-new file.

---

### Props aren't showing in the Controls panel

- **Check `component` in meta.** Without it, Storybook can't extract props:
  ```typescript
  const meta: Meta<typeof Button> = {
    component: Button,  // this line is required
  }
  ```
- **Check your interface exports.** `react-docgen-typescript` needs the component's props interface to be importable. If it's defined inline (not exported), it may not be parsed.
- **Try restarting.** Docgen caches can get stale after changing interfaces.

---

### CSS styles aren't loading in stories

- **Design tokens missing?** Make sure `preview.ts` imports `../src/tokens/design-tokens.css`. Without this, any `var(--color-*)` references resolve to nothing.
- **CSS Module not imported?** Each component must import its own module: `import styles from './Button.module.css'`.
- **Class name mismatch?** CSS Modules generate hashed class names. Use `styles.myClass` in JSX, not a raw string `"myClass"`.

---

### Play function says element not found

- **Timing.** The element may not be rendered yet. Wrap queries in `await` and use `findByRole` (which waits) instead of `getByRole` (which doesn't).
- **Wrong query.** Use the browser's accessibility tree to find the right role and name. The Storybook canvas is an iframe, so `document.querySelector` won't work -- use `within(canvasElement)`.
- **Label mismatch.** `getByLabelText(/email/i)` requires the input to have a `<label>` with matching `htmlFor`/`id`. Our `Input` component supports this via the `id` prop.

---

### Storybook is slow to start

- **First start after install** takes longer because Vite pre-bundles dependencies. Subsequent starts are cached.
- **Too many stories?** The glob `../src/**/*.stories.@(ts|tsx)` scans the whole `src/` tree. If non-component files match, narrow the glob.
- **Heavy addons.** Each addon adds startup cost. If you don't need one, remove it from `main.ts`.

---

### The A11y panel shows violations I didn't expect

This is working as intended. The A11y addon runs [axe-core](https://github.com/dequelabs/axe-core) on the rendered output and reports real accessibility issues. Common findings:
- Missing `aria-label` on icon-only buttons
- Insufficient color contrast between text and background
- Missing form labels

Fix them in the component -- the violations will disappear from every story that uses it.
