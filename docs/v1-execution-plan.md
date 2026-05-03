# v1 Execution Plan — Zero to `<SchemaForm />`

**Goal:** `<SchemaForm schema={schema} onSubmit={fn} />` renders inputs, validates, submits, supports arrays, performs well.

**Stack:** React 18, MUI v7, TanStack Form, Zod v3, Vitest, Storybook 10.

**Constraint:** One PR per day. Each PR is independently revertable. No v1.1 features (no RHF, no engine switching, no async validation, no conditional rendering).

---

## Pre-flight (skip if already true)

| Check | Action if false |
|---|---|
| React 18 + MUI v7 installed | Install MUI v7 as part of Day 1 foundations (see Phase 0 of main plan) |
| Vitest configured | Will be done in Day 1 |
| TanStack Form installed | Will be done in Day 1 |
| Nx monorepo with `@nx/vite` | Already configured — `libs/shared/schema-forms/` is the target library |
| Storybook 10 running | Already upgraded — `pnpm run storybook` on :6006 |

---

## Day 1 — Foundation + Core Types + Compile

**One PR. ~300 lines. End state: `compile(zodSchema)` returns a `FormSpec` with tests green.**

### Morning: scaffold

```bash
# deps
pnpm add zod @tanstack/react-form @tanstack/zod-form-adapter
pnpm add -D vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

Create the folder skeleton inside `libs/shared/schema-forms/src/` (empty files are fine — just the structure):

```
libs/shared/schema-forms/src/
  framework/
    core/          types.ts  meta.ts  compile.ts  registry.ts  errors.ts
    engines/       types.ts
    renderer/
    fields/
    index.ts       # public surface — empty for now
```

Wire Vitest (`vitest.config.ts`, jsdom, jest-dom matchers). One smoke test passes.

> **Note:** The Nx project `schema-forms` already exists at `libs/shared/schema-forms/` with its own `project.json` and `tsconfig.json`. The library build uses `@nx/vite:build` with a library-mode Vite config (see `libs/shared/ui/vite.config.ts` for reference). Story files use CSF3 with types from `@storybook/react-vite` and test utilities from `storybook/test` (Storybook 10 consolidated imports).

### Afternoon: `ui()` + `compile()`

**`core/errors.ts`**
```ts
export class SchemaFormError extends Error {
  constructor(message: string, public path?: string) { super(message); this.name = 'SchemaFormError' }
}
```

**`core/types.ts`** — define these types exactly:

```ts
export type FieldType = 'text' | 'password' | 'email' | 'number' | 'textarea' | 'select' |
  'checkbox' | 'switch' | 'radio' | 'date' | 'file' | 'object' | 'array' | (string & {})

export type ResponsiveCol = { xs?: number; sm?: number; md?: number; lg?: number; xl?: number }

export interface FieldMeta {
  type?: FieldType
  label?: string
  helperText?: string
  placeholder?: string
  options?: Array<{ value: string | number; label: string }>
  col?: ResponsiveCol
  componentProps?: Record<string, unknown>
}

export interface FieldSpec {
  path: string
  type: FieldType
  meta: FieldMeta
  zod: z.ZodTypeAny
  isArray: boolean
  isObject: boolean
  itemSpec?: FieldSpec[]   // populated for arrays
  children?: FieldSpec[]   // populated for objects
}

export type LayoutNode =
  | { kind: 'row'; children: LayoutNode[]; gap?: number }
  | { kind: 'section'; title?: string; description?: string; children: LayoutNode[] }
  | { kind: 'field'; path: string; col: ResponsiveCol }
  | { kind: 'divider' }
  | { kind: 'custom'; component: string; props?: Record<string, unknown>; children?: LayoutNode[] }

export interface FormSpec {
  fields: Record<string, FieldSpec>
  order: string[]
  layout: LayoutNode
  defaults: Record<string, unknown>
  validators: {
    whole: z.ZodTypeAny
    byField: Record<string, z.ZodTypeAny>
  }
}
```

**`core/meta.ts`** — dual storage (WeakMap primary, `.describe()` fallback):

```ts
const META = new WeakMap<z.ZodTypeAny, FieldMeta>()

export function ui<T extends z.ZodTypeAny>(schema: T, meta: FieldMeta): T {
  META.set(schema, meta)
  schema.describe(JSON.stringify({ __ui: true, ...meta }))
  return schema
}

export function getMeta(schema: z.ZodTypeAny): FieldMeta | undefined {
  // 1. WeakMap (fast path)
  const direct = META.get(schema)
  if (direct) return direct
  // 2. Unwrap .optional() / .nullable() / .default() — check inner
  const inner = (schema as any)._def?.innerType
  if (inner) {
    const m = getMeta(inner)
    if (m) return m
  }
  // 3. .describe() fallback
  const desc = schema.description
  if (desc) {
    try {
      const parsed = JSON.parse(desc)
      if (parsed?.__ui) { const { __ui, ...rest } = parsed; return rest }
    } catch { /* not our envelope */ }
  }
  return undefined
}
```

**`core/compile.ts`** — single walk, produce `FormSpec`:

- Walk `z.object` keys → infer `FieldType` from Zod node when meta omits `type`
- Infer `label` from key name (camelCase → Title Case)
- Default `col: { xs: 12 }`
- Build default layout: one `section` containing one `row` per field
- Depth limit: throw at > 5
- Memoize with `WeakMap<z.ZodTypeAny, FormSpec>`
- Extract `validators.byField[path]` as the sub-schema for each field

**Tests (`core/__tests__/meta.test.ts` + `compile.test.ts`):**

| Test | Asserts |
|---|---|
| `ui()` round-trip | `getMeta(ui(z.string(), m))` returns `m` |
| Survives `.optional()` | `getMeta(ui(z.string(), m).optional())` returns `m` |
| WeakMap survives `.describe()` overwrite | Overwrite `.describe()`, `getMeta()` still works on original ref |
| Flat compile snapshot | `compile(z.object({ email: ui(z.string().email(), { label: 'Email' }) }))` matches expected shape |
| Type inference | `ZodString`→`text`, `ZodNumber`→`number`, `ZodBoolean`→`checkbox`, `ZodEnum`→`select`, `ui(…, { type: 'file' })`→`file` |
| Label inference | `firstName` → `"First Name"` |
| Depth limit | 6-deep schema throws `SchemaFormError` |
| Default layout | Produces one `row` per field |

### Exit gate

- [ ] `pnpm test` green — all `meta.test.ts` + `compile.test.ts` pass
- [ ] `pnpm nx run schema-forms:build` succeeds (strict TypeScript)
- [ ] No renderer, engine, or field code exists yet

---

## Day 2 — Engine Adapter + Field Components + Registry

**One PR. ~450 lines. End state: TanStack adapter works headlessly; 9 MUI field components exist with stories.**

### Morning: engine types + TanStack adapter

**`engines/types.ts`:**

```ts
export interface FieldBinding {
  value: unknown
  onChange: (next: unknown) => void
  onBlur: () => void
  error?: string
  touched: boolean
  dirty: boolean
  isValidating: boolean
  name: string
  ref?: React.Ref<HTMLElement>
}

export interface FormHandle<T = unknown> {
  values: T
  errors: Record<string, string[]>
  isSubmitting: boolean
  isValid: boolean
  getFieldProps: (path: string) => FieldBinding
  submit: () => Promise<void>
  reset: (values?: Partial<T>) => void
  arrayOps: {
    push: (path: string, value: unknown) => void
    insert: (path: string, index: number, value: unknown) => void
    remove: (path: string, index: number) => void
    move: (path: string, from: number, to: number) => void
    getKeys: (path: string) => string[]
  }
}

export interface FormEngine {
  useForm: (opts: { spec: FormSpec; defaultValues?: Record<string, unknown>; onSubmit: (values: any) => void | Promise<void> }) => FormHandle
}
```

**`engines/tanstack/useTanStackForm.ts`:**

- Wraps `@tanstack/react-form` with `zodValidator()`
- `getFieldProps(path)` subscribes to single-field meta (path-scoped — **performance rule #1**)
- Array key management: internal `Map<string, string[]>`, monotonic counter `__fk_N`
- `arrayOps` backed by TanStack's `pushFieldValue` / `removeFieldValue` / `moveFieldValue` / `insertFieldValue`

**Test (`engines/tanstack/__tests__/useTanStackForm.test.ts`):**

| Test | Asserts |
|---|---|
| Field value updates | Type → `handle.values.email` updated |
| Zod error surfaces | Invalid email → `binding.error` populated |
| Submit valid | `onSubmit` called with typed values |
| Submit invalid | `onSubmit` NOT called |
| Array push/remove | Values mutate correctly |
| Array keys stable | `getKeys` returns stable keys after `move` |

### Afternoon: field registry + 8 field components

**`core/registry.ts`:**

```ts
export interface FieldComponent {
  (props: { spec: FieldSpec; binding: FieldBinding; form: FormHandle }): React.ReactElement
}

export interface FieldRegistry {
  get(type: string): FieldComponent | undefined
  register(type: string, component: FieldComponent): void
  extend(partial: Record<string, FieldComponent>): FieldRegistry
}

export function createRegistry(): FieldRegistry { /* Map-backed */ }
```

**9 field components** — each is a thin MUI wrapper (~30-50 lines):

| Component | MUI primitive | Handles |
|---|---|---|
| `TextField` | `TextField` | text, password, email via `type` |
| `NumberField` | `TextField type="number"` | numeric input |
| `TextareaField` | `TextField multiline` | multiline text |
| `SelectField` | `Select` + `MenuItem` | dropdown from `spec.meta.options` |
| `CheckboxField` | `FormControlLabel` + `Checkbox` | boolean toggle |
| `SwitchField` | `FormControlLabel` + `Switch` | boolean toggle (alt) |
| `RadioGroupField` | `RadioGroup` + `Radio` | options as radio buttons |
| `DateField` | `TextField type="date"` | native date picker |
| `FileUploadField` | `Button` + hidden `<input type="file">` | single/multi file selection, drag-and-drop zone, file list preview |

Each component pattern (example for `TextField`):

```tsx
export type FieldType = 'file' | 'text' | 'password' | 'email' | 'number' | 'textarea' | 'select' |
  'checkbox' | 'switch' | 'radio' | 'date' | 'object' | 'array' | (string & {})
  return (
    <MuiTextField
      name={binding.name}
      label={spec.meta.label}
      type={spec.meta.type === 'password' ? 'password' : spec.meta.type === 'email' ? 'email' : 'text'}
      value={binding.value ?? ''}
      onChange={(e) => binding.onChange(e.target.value)}
      onBlur={binding.onBlur}
      error={showError}
      helperText={showError ? binding.error : spec.meta.helperText}
      placeholder={spec.meta.placeholder}
      fullWidth
      {...spec.meta.componentProps}
    />
  )
}
```

**Storybook:** one `*.stories.tsx` per component — `Default` + `WithError` variants. Use mock `binding` objects.

> **Storybook 10 story format:** Import types from `@storybook/react-vite` (not `@storybook/react`). Import test utilities from `storybook/test` (not `@storybook/test`). Title must use atomic hierarchy: `'SchemaForms/Fields/TextField'`.

**`FallbackField`:** MUI `Alert` (warning) + generic `TextField`. One story.

**`FileUploadField` detail:**

```tsx
export function FileUploadField({ spec, binding }: FieldComponentProps) {
  const files = (binding.value as File[]) ?? []
  const { accept, multiple, maxSizeMB } = spec.meta.componentProps ?? {}
  const showError = binding.touched && !!binding.error

  const handleFiles = (incoming: FileList | null) => {
    if (!incoming) return
    const selected = Array.from(incoming)
    const limited = maxSizeMB
      ? selected.filter(f => f.size <= (maxSizeMB as number) * 1024 * 1024)
      : selected
    binding.onChange(multiple ? [...files, ...limited] : [limited[0]])
  }

  return (
    <FormControl error={showError} fullWidth>
      <FormLabel>{spec.meta.label}</FormLabel>
      <Box
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
        sx={{ border: '2px dashed', borderColor: showError ? 'error.main' : 'divider',
              borderRadius: 1, p: 2, textAlign: 'center', cursor: 'pointer' }}
      >
        <Button component="label" variant="outlined">
          Choose file{multiple ? 's' : ''}
          <input type="file" hidden accept={accept as string} multiple={!!multiple}
                 onChange={(e) => handleFiles(e.target.files)} />
        </Button>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          or drag and drop here
        </Typography>
      </Box>
      {files.length > 0 && (
        <List dense>
          {files.map((f, i) => (
            <ListItem key={`${f.name}-${i}`} secondaryAction={
              <IconButton edge="end" onClick={() => binding.onChange(files.filter((_, j) => j !== i))}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            }>
              <ListItemText primary={f.name} secondary={`${(f.size / 1024).toFixed(1)} KB`} />
            </ListItem>
          ))}
        </List>
      )}
      {showError && <FormHelperText>{binding.error}</FormHelperText>}
      {spec.meta.helperText && !showError && <FormHelperText>{spec.meta.helperText}</FormHelperText>}
    </FormControl>
  )
}
```

Features: drag-and-drop zone, file type filtering via `accept`, multi-file support via `multiple`, max file size filtering via `maxSizeMB`, file list with remove buttons, error display.

**Storybook stories (`FileUploadField.stories.tsx`):** `Default`, `MultipleFiles`, `WithAcceptFilter`, `WithError`, `WithMaxSize`.

**Wire:** `createDefaultRegistry()` registers all 9 + `FallbackField` as the catch-all.

### Exit gate

- [ ] `pnpm test` green — engine tests + registry tests pass
- [ ] All 9 field stories render in Storybook with a11y clean
- [ ] FallbackField story shows the warning
- [ ] No `SchemaForm` or `LayoutRenderer` yet

---

## Day 3 — `SchemaForm` + LayoutRenderer + FieldRenderer

**One PR. ~350 lines. End state: `<SchemaForm schema={s} onSubmit={fn} />` renders a working form.**

### Morning: renderer plumbing

**`renderer/FormContext.ts`:**

```ts
const FormCtx = createContext<{ spec: FormSpec; handle: FormHandle; registry: FieldRegistry } | null>(null)
// Provider + useFormContext hook
// IMPORTANT: context value must be a stable ref — not { ...handle } spread on every render
```

**`renderer/LayoutRenderer.tsx`:**

- Receives `LayoutNode`, renders recursively
- `row` → `<Grid container spacing={gap}>`
- `field` → `<Grid size={col}>` → `<FieldRenderer path={path} />`
- `section` → `<Stack>` + `<Typography>` + children
- `divider` → `<Divider />`
- `custom` → layout registry lookup (render children flat if not found + dev warning)
- **Performance rule #2: this component is STATIC.** It receives `spec.layout` which is memoized. It does not subscribe to form values. Zero re-renders after mount.

**`renderer/FieldRenderer.tsx`:**

```tsx
export function FieldRenderer({ path }: { path: string }) {
  const { spec, handle, registry } = useFormContext()
  const fieldSpec = spec.fields[path]
  const binding = handle.getFieldProps(path)  // path-scoped subscription
  const Component = registry.get(fieldSpec.type) ?? FallbackField
  return <Component spec={fieldSpec} binding={binding} form={handle} />
}
```

- **Performance rule #1 enforced here.** Each `FieldRenderer` calls `getFieldProps(path)` which subscribes only to that path. Keystroke in field A does NOT re-render field B.

**`renderer/FormActions.tsx`:** Submit + Reset buttons, `disabled` when submitting or invalid.

**`renderer/SchemaForm.tsx`:**

```tsx
export function SchemaForm({ schema, onSubmit, defaultValues, registry: customRegistry }: SchemaFormProps) {
  const spec = useMemo(() => compile(schema), [schema])  // rule #5: compile once
  const handle = useTanStackForm({ spec, defaultValues, onSubmit })
  const registry = customRegistry ?? defaultRegistry

  return (
    <FormProvider spec={spec} handle={handle} registry={registry}>
      <form onSubmit={(e) => { e.preventDefault(); handle.submit() }} noValidate>
        <LayoutRenderer node={spec.layout} />
        <FormActions />
      </form>
    </FormProvider>
  )
}
```

### Afternoon: integration test + stories

**`contracts/signup.schema.ts`:**

```ts
export const SignupSchema = z.object({
  email: ui(z.string().email(), { label: 'Email', placeholder: 'you@example.com', col: { xs: 12, md: 6 } }),
  password: ui(z.string().min(8), { type: 'password', label: 'Password', col: { xs: 12, md: 6 } }),
  role: ui(z.enum(['admin', 'member', 'viewer']), { label: 'Role', options: [
    { value: 'admin', label: 'Admin' }, { value: 'member', label: 'Member' }, { value: 'viewer', label: 'Viewer' },
  ]}),
  acceptsTerms: ui(z.boolean().refine(v => v, 'Required'), { type: 'checkbox', label: 'I accept the terms' }),
})
```

**Storybook stories (`SchemaForm.stories.tsx`):**

- `Default` — renders signup form
- `WithValidationErrors` — play function types invalid email, blurs, asserts error visible

**Tests:**

| Test | Asserts |
|---|---|
| Renders all fields | 4 inputs present by label |
| Live validation | Type bad email → blur → error appears |
| Submit valid | Fill all fields → submit → `onSubmit` called with correct shape |
| Submit invalid | Leave required fields empty → submit → errors shown, `onSubmit` NOT called |
| Default layout | One row per field, responsive grid rendered |
| Unknown type fallback | Schema with `type: 'foobar'` → FallbackField rendered |

**Public API (`framework/index.ts`):**

```ts
export { SchemaForm } from './renderer/SchemaForm'
export { ui, getMeta } from './core/meta'
export { createDefaultRegistry } from './core/registry'
export type { FieldBinding, FormHandle } from './engines/types'
export type { FieldSpec, FormSpec, FieldMeta, LayoutNode, FieldRegistry } from './core/types'
```

### Exit gate

- [ ] `<SchemaForm schema={SignupSchema} onSubmit={console.log} />` renders in Storybook
- [ ] Type invalid email → blur → error shows → fix → error clears
- [ ] Submit with valid data → `onSubmit` fires
- [ ] `pnpm test` green
- [ ] a11y addon clean on both stories
- [ ] **This is already the minimum viable goal.** Flat forms work end-to-end.

---

## Day 4 — Arrays + Nested Objects + Performance Proof

**One PR. ~300 lines. End state: arrays and nested objects work; performance verified.**

### Morning: ObjectField + ArrayField

**`fields/ObjectField/ObjectField.tsx`:**

```tsx
export function ObjectField({ spec, form }: FieldComponentProps) {
  // Recursively render children via LayoutRenderer using spec.children
  const childLayout = buildLayoutFromChildren(spec.children)
  return <LayoutRenderer node={childLayout} />
}
```

**`fields/ArrayField/ArrayField.tsx`:**

```tsx
export function ArrayField({ spec, binding, form }: FieldComponentProps) {
  const keys = form.arrayOps.getKeys(binding.name)  // stable keys — NEVER use index
  return (
    <Stack gap={2}>
      {keys.map((key, i) => (
        <ArrayRow key={key} index={i} path={binding.name} itemSpec={spec.itemSpec} form={form}>
          <IconButton onClick={() => form.arrayOps.remove(binding.name, i)}>
            <DeleteIcon />
          </IconButton>
        </ArrayRow>
      ))}
      <Button onClick={() => form.arrayOps.push(binding.name, getDefaults(spec.itemSpec))}>
        Add item
      </Button>
    </Stack>
  )
}
```

Key rules enforced:
- `key={key}` from `getKeys()`, never `key={index}`
- Each `ArrayRow` subscribes only to its own index path (performance rule #4)
- Remove row 0 → row 1 keeps focus (key stability)

Register both in `defaultRegistry`.

**Test schemas:**

```ts
// profile.schema.ts — nested object
const ProfileSchema = z.object({
  name: ui(z.string(), { label: 'Name' }),
  address: z.object({
    street: ui(z.string(), { label: 'Street' }),
    city: ui(z.string(), { label: 'City' }),
  }),
})

// survey.schema.ts — array
const SurveySchema = z.object({
  title: ui(z.string(), { label: 'Survey Title' }),
  questions: z.array(z.object({
    question: ui(z.string(), { label: 'Question' }),
    answer: ui(z.string(), { label: 'Answer' }),
  })),
})
```

### Afternoon: performance proof + stories

**Performance verification story (`Performance/LargeForm.stories.tsx`):**

- Generate a 50-field schema programmatically
- Play function: type in field 25, assert render count < 3 via `React.Profiler` or a render-count ref on field 1

**Tests:**

| Test | Asserts |
|---|---|
| Nested paths | `address.city` input has `name="address.city"` |
| Nested edit | Editing `city` doesn't clobber `street` |
| Array push | Click "Add" → new row appears |
| Array remove | Click "Remove" → row gone, sibling keys unchanged |
| Array move | After `move(0, 1)`, keys reorder (not regenerate) |
| Key uniqueness | Remove + push → new key ≠ removed key |
| Focus preservation | Remove row 0 while typing in row 1 → focus stays |
| Depth limit | 6-deep nested schema → compile throws |
| Perf: isolated re-render | Type in field N → only field N re-renders |

**Storybook stories:**

- `Profile/Default`, `Profile/WithValidationErrors`
- `Survey/Default`, `Survey/WithItems` (play function adds 3 items)
- `Performance/LargeForm`

### Exit gate

- [ ] Nested objects render and validate
- [ ] Arrays: push, remove, move all work with stable keys
- [ ] Performance story proves isolated re-renders
- [ ] `pnpm test` green
- [ ] a11y clean on all new stories

---

## Day 5 — Demo Dashboard + Polish + Dev Tools

**One PR. ~250 lines. End state: `pnpm dev` shows a working demo; debug panel works; v1 is shippable.**

### Morning: demo dashboard

**`src/demo/pages/Dashboard.tsx`:**

- `SchemaPicker` dropdown: signup, profile, survey, contact
- Selected schema renders via `<SchemaForm>`
- `StatePreview` panel: live `JSON.stringify(values, null, 2)`
- `ValidationPanel`: live error list with field paths

**`contracts/contact.schema.ts`:**

```ts
const ContactSchema = z.object({
  name: ui(z.string().min(1), { label: 'Name' }),
  email: ui(z.string().email(), { label: 'Email' }),
  message: ui(z.string().min(10), { type: 'textarea', label: 'Message' }),
  attachment: ui(z.any().optional(), { type: 'file', label: 'Attachment',
    helperText: 'PDF or image, max 5 MB',
    componentProps: { accept: '.pdf,.png,.jpg,.jpeg', multiple: false, maxSizeMB: 5 } }),
})
```

### Afternoon: error boundary + debug panel + docs

**`renderer/FieldErrorBoundary.tsx`:**

Wraps each `FieldRenderer` output. One field crashing shows an Alert, not a white screen.

**Debug panel (dev-mode only):**

- `SchemaDebugPanel` — toggled by `debug` prop on `<SchemaForm debug />`
- Shows compiled `FormSpec`, live values, errors, touched/dirty per field
- Tree-shaken in production via `process.env.NODE_ENV` guard

**Validation trace logger:**

- When `debug={true}`, engine adapter logs: `[field:email] validate → ✓` or `→ ✗ "Invalid email"`
- Simple decorator wrapping `getFieldProps` — not middleware

**Quick-test the full flow:**

```tsx
// This must work. If it does, v1 is done.
const schema = z.object({
  email: ui(z.string().email(), { label: 'Email' }),
  age: ui(z.number(), { label: 'Age' }),
})

<SchemaForm schema={schema} onSubmit={console.log} />
```

### Exit gate

- [ ] `pnpm nx dev shell` → dashboard loads, pick any schema, fill, validate, submit
- [ ] `pnpm test` green — all tests pass
- [ ] `pnpm run storybook` — all stories render, a11y clean
- [ ] `pnpm nx run schema-forms:build` + `pnpm nx run ui:build` — zero TS errors
- [ ] Debug panel shows spec + live values when `debug={true}`
- [ ] Validation logger fires in console
- [ ] FieldErrorBoundary catches a thrown field without crashing the form

---

## What's NOT in this plan

Explicitly deferred. Don't build these. Don't even stub them.

| Feature | When |
|---|---|
| RHF adapter | v1.1 — when a consumer asks |
| Engine switching | v1.1 — after RHF exists |
| `capabilities` probe | v1.1 — dead code with one engine |
| Async validation | v1.1 — `isValidating` field exists but unwired |
| Conditional rendering (`dependsOn`) | v1.1 — needs dependency graph |
| Dynamic `import()` | v1.1 — nothing to split |
| ~~Nx library promotion~~ | ✅ Already done — `libs/shared/schema-forms/` exists with Nx project config |
| Multi-step wizard | v1.2+ |
| `unstable.ts` exports | After v1 stabilizes |

---

## File count at v1 completion

```
libs/shared/schema-forms/src/framework/
  core/
    types.ts                    # Day 1
    meta.ts                     # Day 1
    compile.ts                  # Day 1
    registry.ts                 # Day 2
    errors.ts                   # Day 1
    __tests__/
      meta.test.ts              # Day 1
      compile.test.ts           # Day 1
      registry.test.ts          # Day 2

  engines/
    types.ts                    # Day 2
    tanstack/
      useTanStackForm.ts        # Day 2
      __tests__/
        useTanStackForm.test.ts # Day 2

  renderer/
    SchemaForm.tsx              # Day 3
    LayoutRenderer.tsx          # Day 3
    FieldRenderer.tsx           # Day 3
    FieldErrorBoundary.tsx      # Day 5
    FormActions.tsx              # Day 3
    FormContext.ts              # Day 3
    FallbackField.tsx           # Day 2
    SchemaDebugPanel.tsx        # Day 5
    __tests__/
      SchemaForm.test.tsx       # Day 3

  fields/
    TextField/                  # Day 2 (× 9 components)
    NumberField/
    TextareaField/
    SelectField/
    CheckboxField/
    SwitchField/
    RadioGroupField/
    DateField/
    FileUploadField/
    ObjectField/                # Day 4
    ArrayField/                 # Day 4

  contracts/
    signup.schema.ts            # Day 3
    profile.schema.ts           # Day 4
    survey.schema.ts            # Day 4
    contact.schema.ts           # Day 5

  index.ts                      # Day 3

  ~38 files total. ~1,700 lines of code.
```

---

## Daily rhythm

| | Morning | Afternoon | PR |
|---|---|---|---|
| **Day 1** | Scaffold + deps + Vitest | `ui()` + `compile()` + tests | `feat(schema-forms): core types, meta, compile` |
| **Day 2** | TanStack adapter + tests | 9 field components + registry + stories | `feat(schema-forms): engine adapter + field components` |
| **Day 3** | LayoutRenderer + FieldRenderer + SchemaForm | Integration tests + stories + public API | `feat(schema-forms): SchemaForm end-to-end` |
| **Day 4** | ObjectField + ArrayField | Performance story + array tests | `feat(schema-forms): nested objects, arrays, perf` |
| **Day 5** | Demo dashboard | Error boundary + debug panel + final pass | `feat(schema-forms): demo, polish, dev tools` |
