# Writing Stories

How to write, structure, and test stories in this project.

---

## Anatomy of a Story File

Every component has a co-located `*.stories.tsx` file. Here's the pattern, annotated:

```typescript
// Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './Button'

// 1. META -- describes the component to Storybook
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

// 2. STORIES -- each export is one story
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
// Alert.stories.tsx -- Dismissible story
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

## How to Write a Good Story

A good story is **self-contained, focused, and demonstrates one thing clearly**. Here's a checklist:

### 1. Start with a meaningful Default story

The Default should show the component in its most common, production-realistic state -- not empty or broken.

```typescript
// Good: shows how the component actually looks in the app
export const Default: Story = {
  args: {
    title: 'Monthly Revenue',
    message: 'Revenue is up 12% compared to last month.',
    variant: 'success',
  },
}

// Bad: bare minimum that renders but tells you nothing
export const Default: Story = {
  args: { message: 'text' },
}
```

### 2. One story per meaningful state

Create separate stories for each visual or behavioral state a designer or QA engineer would want to verify:

- Variants (primary, secondary, danger)
- Sizes (sm, md, lg)
- Interactive states (disabled, loading, error)
- Edge cases (long text, empty data, missing image)

### 3. Use `args` for controllable stories, `render` for showcases

If the story should be interactive in Controls, use `args`:
```typescript
export const Error: Story = {
  args: { variant: 'error', message: 'Something went wrong.' },
}
```

If you're showing multiple states side by side for comparison, use `render`:
```typescript
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="danger">Danger</Button>
    </div>
  ),
}
```

### 4. Name stories from the user's perspective

Name stories after what they show, not implementation details:

| Good | Bad |
|------|-----|
| `WithValidationErrors` | `TestCase3` |
| `Dismissible` | `WithOnDismissTrue` |
| `EmptyState` | `NoData` |
| `Mobile` | `ViewportSmall` |

### 5. Add `argTypes` to improve the Controls panel

Map prop types to the right control widgets so teammates can explore without reading code:

```typescript
argTypes: {
  variant: { control: 'select', options: ['info', 'success', 'warning', 'error'] },
  size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  disabled: { control: 'boolean' },
  onClick: { action: 'clicked' },
}
```

### 6. Add play functions for interaction stories

If the component has behavior (dismiss, submit, toggle, sort), write a play function so the interaction is demonstrated automatically:

```typescript
export const Dismissible: Story = {
  args: { dismissible: true, message: 'This can be dismissed.' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: /dismiss/i }))
    await expect(canvas.queryByRole('alert')).not.toBeInTheDocument()
  },
}
```

### 7. Set `parameters` when the default layout doesn't fit

Override layout for components that need it:
```typescript
// Full-screen pages
parameters: { layout: 'fullscreen' }

// Components that need breathing room
parameters: { layout: 'padded' }

// Responsive stories
parameters: { viewport: { defaultViewport: 'mobile1' } }
```

### 8. Use decorators for consistent context

Wrap stories that need a constrained width or shared wrapper:
```typescript
decorators: [(Story) => (
  <div style={{ maxWidth: 360 }}>
    <Story />
  </div>
)],
```

---

## Summary: Template for a Well-Written Story File

```typescript
import type { Meta, StoryObj } from '@storybook/react'
import { within, userEvent, expect } from '@storybook/test'
import { MyComponent } from './MyComponent'

const meta: Meta<typeof MyComponent> = {
  title: 'Category/MyComponent',            // Clear sidebar placement
  component: MyComponent,                    // Enables prop extraction
  argTypes: { /* control overrides */ },     // Improve Controls panel
  args: { /* shared defaults */ },           // DRY base props
}
export default meta
type Story = StoryObj<typeof MyComponent>

export const Default: Story = {}             // Most common real-world state
export const Variant: Story = { args: {} }   // One story per visual state
export const Showcase: Story = { render: () => /* ... */ }  // Side-by-side comparison
export const Interactive: Story = {          // Demonstrates behavior
  args: {},
  play: async ({ canvasElement }) => {},
}
```
