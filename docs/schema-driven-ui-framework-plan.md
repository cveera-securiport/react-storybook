# Schema-Driven UI Framework -- Implementation Plan

A production-ready plan for a **form-library-agnostic, schema-driven UI framework** that renders dynamic forms from Zod schemas with pluggable form engines (TanStack Form primary, React Hook Form secondary), built on **React 18 + MUI v7** in an **Nx monorepo with pnpm**, aligned with the enterprise frontend architecture. Design tokens live in `libs/shared/tokens/` as CSS custom properties and are bridged into the MUI theme. Storybook 10 is the component development environment.

This document is the blueprint. It is intentionally detailed enough that an engineer or cloud agent can execute it without re-deriving architecture decisions.

---

## 1. Goals and Non-Goals

### Goals

- **Single source of truth.** A Zod schema defines types, validation, *and* UI metadata. Derived form state, API validation, and renderers all read from the same schema.
- **Engine-agnostic rendering.** A stable `FormEngine` interface decouples field components from the underlying form library. Switching the engine must not require changes in field, layout, or page components.
- **Extensible field registry.** Field types map to React components via a registry. Consumers can override any field (e.g. replace the default `text` with a branded one) or register new ones.
- **Responsive, token-driven layout.** Layout metadata converts to responsive MUI Grid layouts consuming design tokens -- no inline styles.
- **Graceful failure.** Unknown field types render a visible fallback with a developer-facing warning. Missing metadata uses sensible defaults. Engine mid-edit switch preserves values.
- **Demo-ready.** A live dashboard showcases multiple schemas, both engines side-by-side, inline validation, async validation, and a JSON preview of current form state.

### Non-Goals (explicitly out of scope for v1)

- Drag-and-drop schema builder UI.
- Visual form editor.
- Server-side rendering of forms.
- Multi-step wizard orchestration (leave hooks for it; do not build it).
- Non-Zod schema adapters (e.g. Yup, Valibot). Design keeps the door open but v1 ships Zod only.

### v1 Scope Contract

Appendix A.1 trims scope informally. This section makes it binding. Any feature not in the **MUST** list requires a design review before landing on `main`.

**v1 MUST ship:**

| Capability | Notes |
|---|---|
| Flat object forms | `z.object({ … })` with all primitive field types |
| Per-field + whole-form Zod validation | Sync only; errors surfaced inline via `FieldBinding.error` gated by `touched` |
| Default auto-layout + explicit `LayoutNode` | One row per field unless author overrides |
| Basic arrays | `z.array(z.object(…))` — push, insert, remove, move with stable keys |
| Field registry + `custom` layout extensibility | `defaultRegistry` with 11 field types; `LayoutRegistry` for `kind: 'custom'` |
| Single engine (TanStack Form) | `FormEngine` interface exists as the seam; only the TanStack adapter is implemented |
| Storybook stories for every component | `Default` + at least one error/edge-case variant per field and form story |
| Dev-mode warnings | Fallback fields, unregistered layout components, unused fields in custom layouts |

**v1 MUST NOT ship (deferred to v1.1+):**

| Feature | Reason |
|---|---|
| Conditional rendering (`dependsOn` + `visibleWhen`) | Requires dependency graph; runtime guard is enough for v1 |
| Async validation | Wiring exists (`isValidating` in `FieldBinding`) but no adapter code; Phase 13 |
| RHF adapter / engine switching | ~40% of complexity; defer until a real consumer asks |
| `FormHandle.capabilities` probe | Dead code with one engine |
| Dynamic `import()` code-splitting of engines | Nothing to split with one engine |
| Static cycle detection in `dependsOn` graph | Runtime recursion guard suffices |
| Multi-step wizard orchestration | Hooks only; no built-in stepper |

If a PR introduces code for a "MUST NOT" feature, it must be behind a feature flag and merged to a `next` branch, not `main`.

---

## 2. Conceptual Architecture

```
                ┌────────────────────────────────────┐
                │          Zod Schema + Meta         │   single source of truth
                └───────────────┬────────────────────┘
                                │  compile()
                                ▼
                ┌────────────────────────────────────┐
                │          Compiled FormSpec         │   normalized, engine-agnostic
                │ { fields[], layout, validators }   │
                └───────────────┬────────────────────┘
                                │
          ┌─────────────────────┼──────────────────────┐
          ▼                     ▼                      ▼
   ┌────────────┐        ┌────────────┐        ┌────────────┐
   │ FormEngine │        │  Layout    │        │   Field    │
   │  Adapter   │◀──────▶│  Renderer  │◀──────▶│  Registry  │
   │(TanStack / │        │ (Grid from │        │  (MUI      │
   │  RHF)      │        │   spec)    │        │  fields)   │
   └────────────┘        └────────────┘        └────────────┘
          │                     │                      │
          └─────────────────────┼──────────────────────┘
                                ▼
                  ┌────────────────────────────┐
                  │  <SchemaForm schema=… />   │
                  └────────────────────────────┘
```

Four decoupled concerns:

1. **Schema** -- Zod + UI metadata, author-facing.
2. **Spec** -- compiled, normalized intermediate representation (IR).
3. **Engine** -- a hook + bindings contract; one implementation per form library.
4. **Renderer** -- layout + field registry; consumes IR and engine bindings.

The IR is the stable contract. Engines and renderers do not talk to each other directly; they both talk to the IR.

---

## 3. Package / Folder Structure

Following the atomic-design + scope-first conventions in the skill, even though this repo is currently single-package. Structure the framework as if it were an Nx library so the promotion path is trivial.

```
src/
  framework/                              # the schema-driven UI framework
    contracts/                            # Zod schemas authored by consumers
      user.schema.ts
      signup.schema.ts
      survey.schema.ts

    core/
      types.ts                            # FieldSpec, FormSpec, LayoutNode, FieldMeta
      meta.ts                             # ui() helper; attaches metadata to Zod nodes
      compile.ts                          # zodSchema → FormSpec
      registry.ts                         # FieldRegistry + createRegistry()
      errors.ts                           # UnknownFieldTypeError, CompileError

    engines/
      types.ts                            # FormEngine interface
      tanstack/
        TanStackEngine.tsx                # default engine
        useTanStackForm.ts
      rhf/
        RHFEngine.tsx                     # secondary engine
        useRHFForm.ts
      switcher.ts                         # engine state preservation helper

    renderer/
      SchemaForm.tsx                      # top-level orchestrator
      LayoutRenderer.tsx                  # grid / sections / dividers
      FieldRenderer.tsx                   # registry lookup, error surfacing
      FallbackField.tsx                   # unknown field type UI

    fields/                               # default MUI-backed field components
      TextField/TextField.tsx
      NumberField/NumberField.tsx
      SelectField/SelectField.tsx
      CheckboxField/CheckboxField.tsx
      SwitchField/SwitchField.tsx
      RadioGroupField/RadioGroupField.tsx
      DateField/DateField.tsx
      TextareaField/TextareaField.tsx
      FileUploadField/FileUploadField.tsx # file upload with drag-and-drop
      ObjectField/ObjectField.tsx         # nested objects
      ArrayField/ArrayField.tsx           # repeatable groups

    hooks/
      useSchemaForm.ts                    # thin facade: engine + compile + state
      useFieldBinding.ts                  # adapter-agnostic field hook

    testing/
      renderWithProviders.tsx
      mockSchemas.ts

    index.ts                              # public surface (no barrels below)

  demo/                                   # live showcase app
    pages/
      Dashboard.tsx                       # schema picker + engine toggle
      Comparison.tsx                      # side-by-side TanStack vs RHF
    components/
      SchemaPicker.tsx
      EngineToggle.tsx
      StatePreview.tsx                    # JSON view of current form state
      ValidationPanel.tsx                 # live error list
    App.tsx

  tokens/design-tokens.css                # existing; framework consumes these
```

All components are co-located with their `*.stories.tsx` file for Storybook coverage. No barrel `index.ts` files inside `framework/` subfolders -- only the top-level `framework/index.ts` re-exports the public API.

---

## 4. Schema Definition System

### 4.1 Authoring model

Zod is the schema language. UI metadata attaches via a small helper that stores metadata in `schema._def.description` using a reserved JSON envelope, so it survives Zod transforms and does not require a custom Zod build.

```ts
import { z } from 'zod'
import { ui } from '@/framework/core/meta'

export const SignupSchema = z.object({
  email: ui(z.string().email(), {
    type: 'text',
    label: 'Email',
    placeholder: 'you@example.com',
    autoComplete: 'email',
    col: { xs: 12, md: 6 },
  }),
  password: ui(z.string().min(8), {
    type: 'password',
    label: 'Password',
    helperText: 'At least 8 characters.',
    col: { xs: 12, md: 6 },
  }),
  role: ui(z.enum(['admin', 'member', 'viewer']), {
    type: 'select',
    label: 'Role',
    options: [
      { value: 'admin', label: 'Admin' },
      { value: 'member', label: 'Member' },
      { value: 'viewer', label: 'Viewer' },
    ],
    col: { xs: 12 },
  }),
  acceptsTerms: ui(z.boolean().refine((v) => v === true, 'You must accept the terms'), {
    type: 'checkbox',
    label: 'I accept the terms of service',
    col: { xs: 12 },
  }),
})

export type Signup = z.infer<typeof SignupSchema>
```

### 4.2 `ui()` helper contract

```ts
type FieldMeta = {
  type: FieldType                  // 'text' | 'number' | 'select' | … | string (registry extensible)
  label?: string
  helperText?: string
  placeholder?: string
  hidden?: boolean
  readOnly?: boolean
  autoComplete?: string
  col?: ResponsiveCol              // { xs?, sm?, md?, lg?, xl? } 1–12
  options?: Array<{ value: string | number; label: string; disabled?: boolean }>
  asyncValidate?: AsyncValidatorRef  // reference to a named async validator
  dependsOn?: string[]             // dot-paths; re-renders when these change
  componentProps?: Record<string, unknown>  // passthrough to custom field components
}

function ui<T extends z.ZodTypeAny>(schema: T, meta: FieldMeta): T
```

`ui()` uses a **dual-storage** strategy:

1. **Primary: `WeakMap` side-channel.** A module-scoped `WeakMap<z.ZodTypeAny, FieldMeta>` keyed by schema reference. This is the authoritative source -- it never conflicts with other Zod tooling (e.g. `zodToJsonSchema`, OpenAPI generators), is garbage-collected, and is easy to inspect during debugging.
2. **Fallback: `.describe()` JSON envelope.** `ui()` also serializes meta into `schema.describe(JSON.stringify({ __ui: true, ...meta }))` so metadata survives Zod combinators (`.optional()`, `.nullable()`, `.default()`) that return new wrapper nodes not present in the WeakMap.

`compile()` reads metadata via a `getMeta(schema)` helper that checks the WeakMap first, then falls back to parsing `.describe()`. Malformed `.describe()` envelopes are rejected with a precise `CompileError`.

### 4.3 Compilation (`compile.ts`)

`compile(zodSchema) → FormSpec` walks the schema once and produces a normalized IR:

```ts
interface FormSpec {
  fields: Record<string, FieldSpec>      // dot-path → spec
  order: string[]                         // author order, used when no layout given
  layout: LayoutNode                      // tree of sections/rows/fields
  defaults: Record<string, unknown>       // default values from z.default() + type-based fallback
  validators: {
    whole: ZodSchema                      // original schema for submit-time validation
    byField: Record<string, ZodSchema>    // derived per-field schema for live validation
  }
}

interface FieldSpec {
  path: string                            // e.g. 'address.city' or 'hobbies[0].name'
  type: FieldType
  meta: FieldMeta
  zod: ZodSchema                          // the exact sub-schema at that path
  isArray: boolean
  isObject: boolean
  depth: number
}
```

Rules enforced during compile:

- If no `type` in meta, infer from Zod node (`ZodString`→`text`, `ZodNumber`→`number`, `ZodBoolean`→`checkbox`, `ZodEnum`/`ZodUnion` of literals→`select`, `ZodArray`→`array`, `ZodObject`→`object`, `ZodDate`→`date`).
- If no `label`, derive from the last segment of the field path (camel→Title Case).
- If no `col`, default to `{ xs: 12 }` (full width mobile, stacks on all breakpoints until overridden).
- Nested objects produce a sub-tree with `depth + 1`; a maximum depth of `5` is enforced, emitting a `CompileError` beyond that.

**Internal structure.** In v1 (Phase 2), `compile()` is a single-pass walk that populates all five concerns (fields, layout, validators, defaults, order) in one traversal — the schema is small enough that separate passes add indirection without benefit. However, the walk produces an intermediate `SchemaNode[]` array (the "AST") that all downstream logic reads from, rather than reading from the Zod tree directly. This makes decomposition into explicit passes mechanical when Phase 13 adds `dependsOn` graph analysis, `asyncValidate` registry lookups, and conditional visibility — at that point `compile()` is refactored into:

```
compile(schema) → walkSchema(schema) → SchemaNode[]
                → extractFields(nodes)
                → buildLayout(nodes)
                → buildValidators(nodes)
                → extractDefaults(nodes)
                → assembleDependencyGraph(nodes)   // Phase 13
                → assembleSpec(…)
```

See Phase 13's entry gate for when this refactor is triggered.

Compilation is memoized per schema reference so re-renders don't recompile.

---

## 5. Form Engine Abstraction

### 5.1 Interface

```ts
export interface FormEngine<TValues extends Record<string, unknown> = Record<string, unknown>> {
  name: 'tanstack' | 'rhf'

  // One-time setup: returns a stable handle used by renderers.
  useForm(args: {
    spec: FormSpec
    defaultValues: Partial<TValues>
    onSubmit: (values: TValues) => void | Promise<void>
  }): FormHandle<TValues>
}

export interface FormHandle<TValues> {
  values: TValues                             // current values snapshot (subscribable)
  errors: Record<string, string[]>            // keyed by dot-path
  isSubmitting: boolean
  isDirty: boolean
  isValid: boolean

  submit: () => Promise<void>
  reset: (next?: Partial<TValues>) => void

  // Field-level binding; used by FieldRenderer.
  getFieldProps: (path: string) => FieldBinding
  subscribe: (paths: string[], cb: (snapshot: unknown) => void) => Unsubscribe
}

export interface FieldBinding {
  value: unknown
  onChange: (next: unknown) => void
  onBlur: () => void
  error?: string                              // first error for the field
  touched: boolean                            // true after first blur; gates error display
  dirty: boolean                              // true when value !== defaultValue
  isValidating: boolean                       // true while an async validator is in flight
  name: string                                // dot-path, for `name` attr + testing
  ref?: React.Ref<HTMLElement>
}
```

`touched` and `dirty` are required from v1 — field components use `touched` to gate error display ("show errors only after interaction"), and `dirty` for visual indicators. `isValidating` defaults to `false` until Phase 13 wires async validators; including it now avoids retrofitting every field component later. `isDisabled` is intentionally omitted — disability is a rendering concern driven by `spec.meta.readOnly` / `spec.meta.hidden`, not an engine concern.

Everything else (arrays, async validation, cross-field dependencies) is layered on top using `subscribe` plus engine-specific opt-in APIs exposed through a capability probe:

```ts
interface FormHandle<TValues> {
  capabilities: {
    fieldArrays: boolean
    asyncValidation: boolean
  }
  // Optional, guarded by capabilities.
  arrayOps?: {
    push: (path: string, value: unknown) => void
    insert: (path: string, index: number, value: unknown) => void
    remove: (path: string, index: number) => void
    move: (path: string, from: number, to: number) => void
    getKeys: (path: string) => string[]         // stable identity keys for React `key` prop
  }
}
```

**Array identity guarantees.** Every array item is assigned a stable, monotonically-increasing string key (e.g. `"__fk_0"`, `"__fk_1"`) when it enters the array — via `push`, `insert`, or initial `defaultValues` hydration. Keys are managed by the engine adapter in a parallel `Map<string, string[]>` (path → keys). The contract:

1. **Keys survive reorder.** After `move(path, 0, 2)`, the key that was at index 0 is now at index 2. React sees the same `key` prop, so local state, focus, and animations are preserved.
2. **Keys are never reused.** After `remove(path, 1)`, that key is permanently retired for the lifetime of the form instance.
3. **`getKeys(path)`** returns the current ordered key array. `ArrayField` calls this to set `key={keys[i]}` on each row — never `key={index}`.
4. **Immutable semantics from the consumer's perspective.** All `arrayOps` methods trigger a re-render with updated values. Whether the engine mutates internally (TanStack) or replaces state (RHF) is an adapter detail invisible to field components.

Field components call `arrayOps` only after checking `capabilities.fieldArrays`. If an engine lacks native array support, the adapter implements `arrayOps` via an imperative `reset(nextValues)` path — but still maintains the key map, so React keys remain stable even on the fallback path. The fallback is marked with a `console.warn` in dev mode noting the performance implication for arrays > 50 items.

### 5.2 TanStack Form adapter (primary)

- Uses `@tanstack/react-form` with `@tanstack/zod-form-adapter`.
- `useForm({ defaultValues, validatorAdapter: zodValidator(), onSubmit })` returns TanStack's API.
- `getFieldProps` wraps `form.Field` by calling the hook-form-free imperative helpers TanStack exposes: `form.getFieldValue(path)`, `form.setFieldValue(path, v)`, `form.getFieldMeta(path)` plus a subscription registered in an effect.
- `byField` validators attach per field via `validators.onChange: spec.validators.byField[path]`.
- `onChangeAsyncDebounceMs` is wired when `meta.asyncValidate` is present.
- Array ops use `form.pushFieldValue`, `form.removeFieldValue`, `form.moveFieldValue`, `form.insertFieldValue` -- capability flag `fieldArrays: true`.
- Key management: the adapter maintains a `Map<string, string[]>` of path → stable keys. On `push`/`insert`, a new key is appended/spliced. On `remove`, the key is spliced out and retired. On `move`, keys are reordered in parallel. `getKeys(path)` returns the current array.

### 5.3 React Hook Form adapter (secondary)

- Uses `react-hook-form` with `@hookform/resolvers/zod`.
- `useForm({ defaultValues, resolver: zodResolver(spec.validators.whole) })` for submit validation; per-field live validation uses `trigger(path)` plus a manual Zod parse of `spec.validators.byField[path]` to report precise errors.
- `getFieldProps` adapts `register(path)` + `getFieldState(path)` into the common `FieldBinding` shape.
- Array ops use `useFieldArray`. Capability flag `fieldArrays: true`.
- Async validation uses `register(path, { validate: async (v) => … })`.

### 5.4 Engine switching with state preservation

`switcher.ts` exports a hook:

```ts
function useEngineSwitcher<T>(initial: EngineName): {
  engine: FormEngine<T>
  setEngine: (name: EngineName) => void
  snapshot: Partial<T>           // last known values, preserved across switches
}
```

Mechanism:

1. The active engine's `FormHandle` emits its `values` into a `useRef` on every change via `subscribe`.
2. When the user toggles, the hook:
   - Calls `handle.submit` in a *dry-run* mode? No -- simpler: snapshots `handle.values`, unmounts the old engine, mounts the new one with `defaultValues: snapshot`.
   - Errors and touched state are intentionally *not* preserved (they're engine-specific); values are.
3. `SchemaForm` keys its internal engine subtree by `engine.name` so React unmounts the old tree and remounts cleanly. A short `<AnimatePresence>` crossfade avoids flicker.

This is why the engine interface exposes `values` but not internal error state: preserving values is portable; preserving errors is not.

---

## 6. Layout Renderer

### 6.1 Layout IR

```ts
type LayoutNode =
  | { kind: 'row'; children: LayoutNode[]; gap?: number }
  | { kind: 'section'; title?: string; description?: string; children: LayoutNode[] }
  | { kind: 'field'; path: string; col: ResponsiveCol }
  | { kind: 'divider' }
  | { kind: 'custom'; component: string; props?: Record<string, unknown>; children?: LayoutNode[] }
```

The `custom` kind is an extensibility escape hatch. It references a named component from the **layout registry** (separate from the field registry). The renderer resolves `component` to a React component at runtime, passes `props` and renders `children` recursively if provided. This means future needs — tabs, accordions, conditional blocks, responsive hiding wrappers, inline groups — can be implemented by registering a layout component, not by changing the `LayoutNode` union.

Example:

```ts
ui(Schema, {
  layout: {
    kind: 'section',
    title: 'Settings',
    children: [
      {
        kind: 'custom',
        component: 'tabs',
        props: { labels: ['General', 'Advanced'] },
        children: [
          { kind: 'row', children: [{ kind: 'field', path: 'name', col: { xs: 12 } }] },
          { kind: 'row', children: [{ kind: 'field', path: 'debug', col: { xs: 12 } }] },
        ],
      },
    ],
  },
})
```

`compile()` produces a default layout: one section containing one row per field, each field spanning `meta.col`. Authors override by providing an explicit layout in meta:

```ts
ui(SignupSchema, {
  layout: {
    kind: 'section',
    title: 'Account',
    children: [
      { kind: 'row', children: [
        { kind: 'field', path: 'email', col: { xs: 12, md: 6 } },
        { kind: 'field', path: 'password', col: { xs: 12, md: 6 } },
      ]},
      { kind: 'field', path: 'role', col: { xs: 12 } },
      { kind: 'divider' },
      { kind: 'field', path: 'acceptsTerms', col: { xs: 12 } },
    ],
  },
})
```

### 6.2 Rendering

`LayoutRenderer` translates each node to MUI primitives:

- `row` → `<Grid container spacing={node.gap ?? 2}>`
- `field` → `<Grid size={node.col}>` wrapping `<FieldRenderer path={node.path} />`
- `section` → `<Stack gap>` with `Typography` heading + `Divider`
- `divider` → `<Divider />`
- `custom` → looks up `node.component` in a `LayoutRegistry` (a `Map<string, React.ComponentType<CustomLayoutProps>>`), passes `node.props` and recursively renders `node.children` via `LayoutRenderer`. If the component is not registered, dev-mode `console.error` with the name and a `FallbackLayoutBlock` renders the children flat with a warning badge (same pattern as `FallbackField`).

```ts
export interface CustomLayoutProps {
  props: Record<string, unknown>
  children: React.ReactNode      // pre-rendered children from recursive LayoutRenderer
}

export interface LayoutRegistry {
  get(name: string): React.ComponentType<CustomLayoutProps> | undefined
  register(name: string, component: React.ComponentType<CustomLayoutProps>): void
}
```

A default `LayoutRegistry` ships empty. Authors register custom layout components via `<SchemaForm layoutRegistry={registry} />`. The field registry and layout registry are intentionally separate — field components deal with `FieldBinding` and form state; layout components deal with visual grouping and receive pre-rendered children.

Responsive behavior flows from MUI's Grid v2, which accepts `size={{ xs, sm, md, lg, xl }}` matching `ResponsiveCol`. No custom CSS; token-driven spacing inherited from the MUI theme.

### 6.3 Ordering and unused fields

If a custom layout omits fields, a development-only `console.warn` lists them and the renderer appends them in author order at the end of the top-level section, so forms cannot silently drop inputs.

---

## 7. Field Registry and Field Renderer

### 7.1 Registry

```ts
export type FieldComponent = React.ComponentType<{
  spec: FieldSpec
  binding: FieldBinding
  form: FormHandle<unknown>   // for dependent fields / array ops
}>

export interface FieldRegistry {
  get(type: FieldType): FieldComponent | undefined
  register(type: FieldType, component: FieldComponent): void
  extend(partial: Record<FieldType, FieldComponent>): FieldRegistry
}

export function createDefaultRegistry(): FieldRegistry
```

A default registry ships with MUI-backed implementations for `text`, `password`, `email`, `number`, `textarea`, `select`, `checkbox`, `switch`, `radio`, `date`, `object`, `array`. Each is a thin wrapper around the corresponding MUI component, reading from `binding` for value/error/onChange and from `spec.meta` for label/helperText/options.

Consumers override per-project:

```tsx
<SchemaForm
  schema={SignupSchema}
  registry={defaultRegistry.extend({
    'rich-text': MyRichTextField,
    text: MyBrandedTextField,
  })}
/>
```

### 7.2 FieldRenderer

`FieldRenderer` is where most edge-case handling lives:

```tsx
function FieldRenderer({ path }: { path: string }) {
  const spec = useSpec(path)
  const registry = useRegistry()
  const form = useFormHandle()
  const binding = form.getFieldProps(path)

  const Component = registry.get(spec.type)
  if (!Component) {
    return <FallbackField spec={spec} binding={binding} />
  }

  if (spec.meta.hidden) return null

  return (
    <ErrorBoundary fallback={<FieldErrorFallback path={path} />}>
      <Component spec={spec} binding={binding} form={form} />
    </ErrorBoundary>
  )
}
```

### 7.3 Fallback field (unknown types)

`FallbackField` renders an MUI `Alert` at severity `warning` with the field label, the attempted type, and the current value serialized. It still wires `value` / `onChange` to a generic `TextField` so the form is not broken -- users can still type a value. The warning also logs via the project logger with component stack.

### 7.4 Nested rendering (objects and arrays)

- `ObjectField` recursively renders its sub-spec through `LayoutRenderer` (if author provided a layout for the sub-object) or a default row-per-child fallback.
- `ArrayField` renders each element as a group, driven by `form.arrayOps` when available, falling back to `reset`-based mutations otherwise. It enforces `depth ≤ 5` (compiled into the spec) so circular or runaway structures fail loudly.
- `ArrayField` **must** use `arrayOps.getKeys(path)` for React `key` props — never array indices. This ensures focus, local component state, and CSS transitions survive add/remove/move operations.
- Each row receives its key as a prop so downstream components can use it for DOM identity (e.g. `data-testid={key}` for Testing Library selectors).

---

## 8. Edge Case Handling -- Specification

| Edge case | Behavior |
|-----------|----------|
| Unknown field type | `FallbackField` renders `Alert` + generic text input. Warning logged. Form still submits. |
| Missing `type` in meta | `compile()` infers from Zod node. If not inferrable (e.g. `z.any()`), defaults to `text`. |
| Missing `label` | Derived from field path via camel-to-title-case. |
| Missing `col` | Defaults to `{ xs: 12 }`. |
| Validation errors | Rendered inline as MUI `FormHelperText` with `error` state. Live on change after first blur; always on submit. |
| Async validation in flight | Field shows `CircularProgress` adornment; submit button disabled via `isValid` + `isSubmitting`. |
| Deeply nested objects | Enforced max depth 5. Compile fails loudly beyond that. |
| Empty form (no fields) | Renders `Alert` with copy: "No fields defined. Add a Zod schema in `contracts/`." with link to the schema docs. |
| Engine switch mid-edit | `useEngineSwitcher` snapshots `values`, remounts with them as `defaultValues`. Errors reset; values preserved. |
| Server-side submit error | `onSubmit` rejection propagates to `FormHandle.errors[''] ` (form-level) and is rendered as an `Alert` above the form. |
| Dependent field that hides mid-edit | Hidden fields retain their last value unless meta has `clearOnHide: true`. |

---

## 9. Public API (the `<SchemaForm>` facade)

```tsx
<SchemaForm
  schema={SignupSchema}
  engine="tanstack"                       // 'tanstack' | 'rhf'
  registry={customRegistry}               // optional
  defaultValues={{ role: 'member' }}      // optional
  onSubmit={async (values) => await api.signup(values)}
  onChange={(values) => …}                // optional; throttled
  className={…}
/>
```

Under the hood:

```tsx
function SchemaForm(props) {
  const spec = useMemo(() => compile(props.schema), [props.schema])
  const engine = useEngine(props.engine)
  const handle = engine.useForm({ spec, defaultValues: props.defaultValues, onSubmit: props.onSubmit })

  return (
    <FormProvider spec={spec} handle={handle} registry={props.registry ?? defaultRegistry}>
      <form onSubmit={(e) => { e.preventDefault(); handle.submit() }} noValidate>
        <LayoutRenderer node={spec.layout} />
        <FormActions />
      </form>
    </FormProvider>
  )
}
```

`FormActions` is a default submit/reset bar; consumers can pass `actions={…}` to override.

### 9.1 Public API Surface and Stability Tiers

The public API is small by design. This section makes the boundary explicit so consumers don't accidentally depend on internals.

**Tier 1 — Public (stable, semver-protected):**

| Export | Purpose |
|---|---|
| `SchemaForm` | The top-level form component |
| `ui()` | Meta-annotation helper for Zod schemas |
| `defaultRegistry` | The built-in field registry (11 field types) |
| `createRegistry()` | Factory for custom field registries |
| `createLayoutRegistry()` | Factory for custom layout registries |
| `FieldBinding` (type) | The contract between engines and field components |
| `FieldSpec` (type) | The compiled field descriptor |
| `FieldRegistry` / `LayoutRegistry` (types) | Registry interfaces for `extends` / custom components |

These are exported from `libs/shared/schema-forms/src/framework/index.ts`. Breaking changes to any of these require a major version bump.

**Tier 2 — Unstable (exported but marked `@unstable`):**

| Export | Purpose | Why unstable |
|---|---|---|
| `compile()` | Schema → FormSpec compilation | IR shape may change as new features land |
| `FormSpec` (type) | The compiled IR | Internal structure; consumers shouldn't depend on it |
| `FormEngine` (type) | Engine adapter interface | Will evolve when RHF adapter lands |
| `FormHandle` (type) | Engine instance handle | Will gain capabilities when second engine ships |

These are exported from `libs/shared/schema-forms/src/framework/unstable.ts` (separate entry point). Import path: `@ibc/schema-forms/unstable`. JSDoc on each export includes `@unstable` and a note that the API may change in minor versions.

**Tier 3 — Internal (NOT exported):**

| Module | Why internal |
|---|---|
| `core/meta.ts` (WeakMap internals, `getMeta()`) | Implementation detail of `ui()` |
| `engines/tanstack/*` (adapter internals) | Engine-specific; consumers pick engine via string, never import adapter |
| `renderer/LayoutRenderer`, `FieldRenderer` | Orchestration internals; consumers use `SchemaForm` |
| `fields/*` (individual MUI field components) | Registered via `defaultRegistry`; override via registry, not direct import |
| `core/errors.ts` | Internal error types |

No `index.ts` barrel files exist inside `framework/` subfolders. Import from internal paths (e.g. `@ibc/schema-forms/core/compile`) is blocked by the `exports` map in `package.json` (Appendix B.4).

**Enforcement:**

- `package.json` `exports` field only exposes `.` and `./unstable`. All other paths resolve to nothing.
- Phase 0 acceptance criteria: "Import from `@ibc/schema-forms/core/compile` fails with a module-not-found error in a consumer app."
- The Appendix B checklist item ("fewer than 20 exported names") is refined: Tier 1 ≤ 10 names, Tier 2 ≤ 10 names.

---

## 10. Live Demo Dashboard

### 10.1 Pages

- **Dashboard (`/`)** -- Schema picker dropdown on the left; engine toggle (TanStack / RHF) at the top; rendered form in the middle; two side panels on the right:
  - `StatePreview`: live `JSON.stringify(values, null, 2)` of the form state.
  - `ValidationPanel`: list of current errors with field paths.
- **Comparison (`/compare`)** -- Two `<SchemaForm>` instances side-by-side on the same schema, one per engine. Values sync bidirectionally via a shared controlled `defaultValues` derived from a parent `useState`. Demonstrates that the abstraction holds.

### 10.2 Example schemas to ship

Place each in `libs/shared/schema-forms/src/framework/contracts/`:

1. `signup.schema.ts` -- simple flat schema with string, enum, boolean, async email uniqueness check.
2. `profile.schema.ts` -- nested object (`address: { street, city, zip }`), demonstrates `ObjectField`.
3. `survey.schema.ts` -- dynamic array of question/answer pairs, demonstrates `ArrayField` + dependent fields (question type changes answer field type).
4. `billing.schema.ts` -- discriminated union on `paymentMethod` (card vs invoice); demonstrates `dependsOn` and conditional rendering.

### 10.3 Interactions wired

- Edit any field → live validation and `StatePreview` update.
- Toggle engine → values preserve, errors reset, same JSON in `StatePreview`.
- Swap schema → form remounts with new defaults.
- Click "Submit" → disabled while invalid/submitting; async uniqueness check shows loading adornment; success toast on fulfilled submit.

---

## 11. Dependencies to Add

Targeting **React 18 + MUI v7 + Storybook 10** for v1. Design tokens live in `libs/shared/tokens/` as CSS custom properties and are bridged into the MUI theme via `createTheme({ cssVariables: true })`.

```
react                           ^18.3     # React 18 (current)
react-dom                       ^18.3
@mui/material                   ^7        # MUI v7 (React 18 compatible)
@mui/icons-material             ^7
@emotion/react                  ^11
@emotion/styled                 ^11
@tanstack/react-form            ^1        # primary engine
@tanstack/zod-form-adapter      ^0.4+     # Zod bridge
react-hook-form                 ^7        # secondary engine (v1.1)
@hookform/resolvers             ^3        # v1.1
zod                             ^3        # stay on v3 for v1; v4 tracked
motion                          ^11       # crossfade on engine switch (v1.1)
```

Dev-only:

```
@testing-library/react          ^16
@testing-library/user-event     ^14
vitest                          ^2
jsdom                           ^25
msw                             ^2
storybook                       ^10       # Storybook 10 (already installed)
storybook/addon-themes          ^10
storybook/test                  ^10
@axe-core/playwright            ^4        # later, when E2E is added
```

Pin versions when scaffolding; do not hand-write them in JSON.

---

## 12. Testing Strategy

### 12.1 Unit (Vitest + RTL)

- `core/compile.test.ts` -- schema → spec invariants (defaults, inferred types, layout fallback, depth limits).
- `core/meta.test.ts` -- `ui()` round-trips through `.optional()`, `.nullable()`, `.default()`.
- `core/registry.test.ts` -- `get`, `register`, `extend`, unknown-type behavior.
- `engines/tanstack/useTanStackForm.test.ts` -- values, validation, submit, array ops, capabilities.
- `engines/rhf/useRHFForm.test.ts` -- same coverage via the same interface so the test file can share fixtures.
- `engines/switcher.test.ts` -- value preservation across engine switches.
- `renderer/FieldRenderer.test.tsx` -- unknown type fallback, hidden fields, error display.

### 12.2 Integration (Storybook + play functions)

- One story per default field component (typing, validation errors, async validation).
- `SchemaForm` stories per demo schema:
  - `Default`, `WithValidationErrors`, `WithAsyncValidation`, `Submitting`, `SwitchingEngines` (play function toggles engine mid-edit and asserts preserved values).
- `addon-a11y` runs axe-core on every story; zero violations required.

### 12.3 Contract tests (engine parity)

Critical. A single test suite iterates both engines over the same `FormSpec` fixture set and asserts identical observable behavior:

```ts
describe.each(['tanstack', 'rhf'] as const)('FormEngine parity: %s', (name) => {
  it('preserves values across submit', …)
  it('surfaces per-field Zod errors', …)
  it('supports array push/remove/move', …)
  it('runs async validation with debounce', …)
})
```

This is the only guarantee that swapping engines is safe.

### 12.4 E2E (Playwright, optional for v1)

Cover the demo dashboard: pick schema → fill fields → validation states → submit → success toast. One test per demo schema. Run axe-core on each rendered page.

### 12.5 Performance Guardrails

Large forms (50+ fields, nested arrays) will re-render heavily without explicit rules. These are enforced via code review and tested with the profiling story (Phase 6).

**Hard rules:**

1. **`FieldRenderer` subscribes only to its own path.** Each `FieldRenderer` calls `handle.getFieldProps(path)` which subscribes to that single path's value, error, touched, and dirty state. A keystroke in field A must not trigger a re-render of field B. Engine adapters must use path-scoped subscriptions (TanStack's `form.useField` / RHF's `useWatch({ name })`).

2. **`LayoutRenderer` is static.** It receives the `LayoutNode` tree (which is a product of `compile()` and never changes for a given schema) and renders the grid structure. It must not subscribe to form values or re-render when fields change. Only `FieldRenderer` leaf nodes re-render.

3. **No full-form re-render on every change.** `SchemaForm` and `FormProvider` must not pass form values via context. The context provides `spec`, `handle`, and `registry` — all stable references. Field-level reactivity flows through `getFieldProps`, not through context updates.

4. **Array rows are independently memoized.** Each `ArrayField` row component receives a stable key (from `arrayOps.getKeys`) and subscribes only to its own index path. Adding/removing a row at index N must not re-render rows 0..N-1.

5. **`compile()` is called once per schema identity.** `SchemaForm` wraps `compile()` in `useMemo(() => compile(schema), [schema])`. Since schemas are module-level constants, this means compile runs once per mount.

**Verification:**

- A Storybook story (`Performance/LargeForm`) renders a 50-field schema. A play function types into field 25 and asserts (via `React.Profiler` callback or render-count ref) that fewer than 3 components re-rendered.
- Phase 6 acceptance criteria includes: "Typing in one field does not trigger re-render of any other field (verified via React Profiler or render-count test)."

### 12.6 Dev Tooling

Debugging schema-driven forms is harder than hand-coded forms because the indirection hides what's happening. Ship these dev tools from Phase 6 onward (dev-mode only, tree-shaken in production):

**1. Schema Debug Panel (`<SchemaDebugPanel />`)**

A collapsible overlay (toggled via `Ctrl+Shift+D` or a `debug` prop on `SchemaForm`) that shows:

- The compiled `FormSpec` as a JSON tree (fields, layout, validators).
- Current form values (live-updating).
- Current errors, touched, and dirty state per field.
- The active engine name and its capabilities.

Implementation: a React context consumer that reads `spec`, `handle.values`, and `handle.errors`. Rendered inside `SchemaForm` only when `process.env.NODE_ENV !== 'production'`.

**2. Field Path Inspector**

Hovering over any rendered field (when debug mode is active) shows a tooltip with:

- `path` (e.g. `address.city`)
- Resolved `FieldSpec` (type, meta, validators)
- Current `FieldBinding` snapshot (value, error, touched, dirty)
- Registry resolution (which component is rendering this field)

Implementation: `FieldRenderer` wraps its output in a thin `<FieldInspectorWrapper>` in dev mode. The wrapper uses `onMouseEnter` to populate a context that the debug panel reads.

**3. Validation Trace Logger**

When `SchemaForm` receives `debug={true}` (or `localStorage.__SCHEMA_FORM_DEBUG` is set), the engine adapter logs to `console.group`:

- `[field:email] validate.onChange → ✓ valid` or `→ ✗ "Invalid email"`
- `[form] validate.onSubmit → ✗ 3 errors: email, password, role`
- `[field:username] validate.onChangeAsync → pending (debounce 300ms)`
- `[field:username] validate.onChangeAsync → ✓ valid (took 142ms)`

This is implemented as a `LoggingEngineDecorator` that wraps the real engine adapter and intercepts `getFieldProps` and `submit` calls. Not a middleware — a simple decorator applied conditionally in dev mode.

**Phase mapping:**

| Tool | Ships in | Acceptance criteria |
|---|---|---|
| Validation Trace Logger | Phase 5 (engine adapter) | Logger output appears in console when `debug={true}` |
| Schema Debug Panel | Phase 6 (SchemaForm) | Panel toggles open, shows spec + live values |
| Field Path Inspector | Phase 6 (FieldRenderer) | Hover shows path + binding snapshot in dev mode |

---

## 13. Phased Delivery

Execution is broken into small, sequential phases. Each phase is sized to fit in a single PR, ends with a runnable artifact, and has a clear entry gate (what must be true before starting) and exit gate (what must be true before merging). Phases in **v1** are required; phases marked **v1.1** are deferred per the simplicity review in Appendix A.

**Stack target:** React 18 + MUI v7 + design tokens + TanStack Form + Zod v3. Storybook 10 for component development. Nx monorepo with pnpm.

### One phase = one PR

This is the load-bearing constraint of the execution plan. It keeps reviews small, lets CI run end-to-end per phase, and gives the team a clean revert boundary if any phase ships a problem.

Rules:

- **Exactly one phase per PR.** Do not combine phases, even tiny ones. Phase 1 + Phase 3 land as two PRs.
- **Do not start a phase until its entry gate is green on `main`.** The Depends-on column in the map is the dependency constraint.
- **Exit-gate bullets must all be true before merge.** CI checks them where possible (tests, type-check, lint, Storybook a11y); reviewers check the rest.
- **Branch name:** `feat/schema-forms-phase-<N>-<kebab-slug>` (e.g., `feat/schema-forms-phase-3-field-registry`).
- **Commit message (PR title):** `feat(schema-forms): phase <N> -- <short summary>` (Conventional Commits). Body lists the phase's file changes and references the "PR contents" bullets from this document.
- **PR description template:** copy the block in Section 13.1 below into every phase PR.
- **Size target:** < 500 net lines of code changed per phase for v1 phases. If a phase grows past that, split it (the dependency graph allows splitting phases 4 and 6 by field type or by renderer concern).
- **No cross-phase refactors.** A phase may only touch files in its declared scope plus trivial type-import fixups. Broader refactors are their own PRs that don't claim a phase number.
- **Revert policy.** Each phase is independently revertable. If Phase 6 regresses, reverting the single PR restores `main` to Phase 5's green state.

### 13.1 PR description template

Every phase PR's description starts with this block, filled in:

```md
## Phase <N> -- <phase name>

**Release target:** v1 | v1.1
**Depends on phases:** <comma-separated phase numbers, or "--">
**Plan reference:** docs/schema-driven-ui-framework-plan.md Section 13, Phase <N>

### Entry gate (must be true before this PR)
- [ ] <paste from plan>

### Acceptance criteria (must be true before merge)
- [ ] <paste from plan -- phase-specific criteria>
- [ ] All Definition of Done items pass (Section 13.2)

### Files changed
- <list>

### Out of scope
- <explicit list of things this PR intentionally does NOT do, to reassure reviewers not to ask for them>
```

The "out of scope" block is the thing that stops review scope-creep from fusing phases.

### 13.2 Definition of Done (applies to every phase)

Every phase PR -- without exception -- must satisfy this universal checklist in addition to its phase-specific acceptance criteria. CI enforces the mechanical items; reviewers enforce the rest.

**Mechanical (CI-enforced):**

- [ ] `pnpm nx run-many -t build` succeeds (TypeScript strict mode, zero errors).
- [ ] `pnpm test` passes (Vitest, zero failures). New code is covered by tests at the coverage threshold for its library type (see Section 6c of the skill: `type:ui` 90%, `type:util` 95%, `type:feature` 75%, `type:data-access` 85%).
- [ ] `pnpm nx run-many -t lint` passes (ESLint strict + `jsx-a11y` recommended; zero errors).
- [ ] `pnpm run build-storybook` succeeds.
- [ ] `@storybook/addon-a11y` reports zero new violations on any new or modified story.

**Manual (reviewer-enforced):**

- [ ] The PR description matches the template in Section 13.1, entry/acceptance bullets pasted from the plan.
- [ ] The PR touches only files listed in the phase's "PR contents". No cross-phase refactors.
- [ ] Prefer minimal `useMemo` / `useCallback` / `React.memo` -- only where profiling shows a real performance need.
- [ ] No new inline styles for values a token covers (colors, spacing, radii, shadows, typography); all styling flows through MUI theme + `sx` or design tokens.
- [ ] No barrel `index.ts` files added inside `framework/` subfolders (only the top-level public-surface `index.ts`; see Appendix B.4 exports map).
- [ ] Public API additions (new exports from the root) are documented with JSDoc including one example.
- [ ] If the phase adds a component, it has a Storybook story with a `Default` variant showing a production-realistic state.
- [ ] If the phase changes public API, a note is added to the `CHANGELOG.md` under `## Unreleased`.

**Phase-specific exit artifact:**

Every phase must produce at least one observable artifact a reviewer can click on or run. Typically this is a Storybook story, a `pnpm nx dev shell` route, or a Vitest test file. "Code landed, no visible artifact" is never acceptable -- even pure-core phases (1, 2, 3, 5) produce test files the reviewer runs.

### Map of phases

| # | Phase | Release | Depends on | Rough size |
|---|-------|---------|------------|------------|
| -1 | ~~Consuming app upgrade~~ | pre-v1 | -- | **DONE** (React 18 + Storybook 10 + Nx monorepo already in place) |
| 0 | Foundations (deps, test runner) | v1 | -- | Small |
| 1 | Core types + `ui()` helper | v1 | 0 | Small |
| 2 | `compile()` (schema → FormSpec) | v1 | 1 | Medium |
| 3 | Field registry + FallbackField | v1 | 1 | Small |
| 4 | Default field components (flat types) | v1 | 0, 3 | Medium |
| 5 | TanStack engine adapter | v1 | 2 | Medium |
| 6 | `SchemaForm` + `LayoutRenderer` + `FieldRenderer` | v1 | 2, 3, 4, 5 | Medium |
| 7 | Nested (`ObjectField`) and arrays (`ArrayField`) | v1 | 6 | Medium |
| 8 | Demo dashboard (one page, 4 schemas, state + validation panels) | v1 | 6, 7 | Small |
| 9 | Polish: error boundaries, form-level errors, docs, quickstart | v1 | 6, 7, 8 | Small |
| 10 | ~~Nx promotion~~ | v1 or later | 9 | **DONE** (already an Nx monorepo with `libs/shared/schema-forms/`) |
| 11 | RHF adapter + parity contract tests | **v1.1** | 5, 6 | Medium |
| 12 | Engine switcher + comparison page | **v1.1** | 11 | Small |
| 13 | Advanced meta: `asyncValidate`, `dependsOn`, `hidden`, `readOnly` | **v1.1** | 6 | Medium |

Phases 0-9 in order give a junior dev a shippable v1. Phase 10 (Nx promotion) is already complete -- the project is an Nx monorepo with `libs/shared/schema-forms/`. Phase -1 is no longer needed -- the app is already on React 18 + Storybook 10.

### Phase -1 -- ~~Consuming app upgrade~~ (COMPLETE)

*Status:* **Already done.** The repo runs React 18 + Storybook 10 in an Nx monorepo with pnpm. Phase -1 scope (MUI install + theme wiring) is folded into Phase 0.

### Phase 0 -- Foundations

*Outcome:* the repo is ready to build schema-driven forms on top of React 18 + MUI v7 + design tokens.

- Entry gate: Nx monorepo structure in place with `libs/shared/schema-forms/`.
- Add framework dependencies from Section 11 (MUI v7, Zod v3, TanStack Form + zod adapter; dev: Vitest, jsdom, Testing Library, MSW).
- Configure Vitest with jsdom + `@testing-library/jest-dom` matchers. One smoke test file that imports React and asserts `1 + 1 === 2`.
- Create `libs/shared/schema-forms/src/framework/tokens/mui-theme.ts` bridging `libs/shared/tokens/src/tokens/design-tokens.css` into `createTheme({ cssVariables: true, colorSchemes: { light, dark } })`.
- Wrap `apps/shell/src/main.tsx` with `<ThemeProvider theme={theme}><CssBaseline />…</ThemeProvider>`.
- Wrap Storybook via `.storybook/preview.ts` using `withThemeFromJSXProvider`.
- Acceptance criteria:
  - [ ] Framework deps installed: `@mui/material@^7`, `@mui/icons-material@^7`, `@emotion/react@^11`, `@emotion/styled@^11`, `zod@^3`, `@tanstack/react-form@^1`, `@tanstack/zod-form-adapter`, `@testing-library/react@^16`, `@testing-library/user-event@^14`, `vitest@^2`, `jsdom@^25`, `msw@^2`.
  - [ ] `pnpm test` runs via Vitest and passes the smoke test.
  - [ ] `pnpm nx dev shell` loads the app; `pnpm run storybook` loads Storybook.
  - [ ] A throwaway Storybook story renders an MUI Button with a token-derived palette (verifies theme + tokens wired).
  - [ ] `--mui-palette-*` CSS variables are present on `:root` (verifies `cssVariables: true` wired).
  - [ ] `ThemeProvider` wraps the app in `apps/shell/src/main.tsx` and Storybook via `withThemeFromJSXProvider` in `.storybook/preview.ts`.
  - [ ] No framework code (`libs/shared/schema-forms/src/framework/core`, `engines`, `renderer`, `fields`) exists yet -- this phase only sets up foundations.
- PR contents: `package.json` diff, `vitest.config.ts`, `libs/shared/schema-forms/src/framework/tokens/mui-theme.ts`, theme provider wiring, one smoke test, one temporary Storybook check.

### Phase 1 -- Core types and `ui()` helper

*Outcome:* a schema author can attach UI metadata to any Zod node.

- Entry gate: Phase 0 merged.
- Create `libs/shared/schema-forms/src/framework/core/types.ts` with `FieldMeta`, `FieldSpec`, `FormSpec`, `LayoutNode`, `ResponsiveCol`, `FieldType` (v1 meta = `type`, `label`, `helperText`, `placeholder`, `options`, `col`, `componentProps`).
- Create `libs/shared/schema-forms/src/framework/core/meta.ts` exporting:
  - `ui<T extends z.ZodTypeAny>(schema: T, meta: FieldMeta): T` — stores meta in a module-scoped `WeakMap<z.ZodTypeAny, FieldMeta>` (primary) **and** serializes it into `schema.describe(...)` (fallback for combinator survival).
  - `getMeta(schema: z.ZodTypeAny): FieldMeta | undefined` — checks WeakMap first, falls back to parsing the `.describe()` JSON envelope.
- Create `libs/shared/schema-forms/src/framework/core/errors.ts` with a single exported `SchemaFormError extends Error` class that carries `{ path: string }`.
- Unit tests in `libs/shared/schema-forms/src/framework/core/__tests__/meta.test.ts`:
  - `ui()` stores meta retrievable via `getMeta()` on the original schema reference (WeakMap path).
  - `getMeta()` recovers meta through `.optional()`, `.nullable()`, `.default()` wrappers (`.describe()` fallback path).
  - When another tool overwrites `.describe()`, `getMeta()` still returns correct meta from WeakMap on the original reference.
  - Malformed `.describe()` envelopes throw `SchemaFormError` with the path.
- Acceptance criteria:
  - [ ] `ui(schema, meta)` returns the same Zod schema reference with meta readable by `getMeta()` via WeakMap (primary) and `.describe()` envelope (fallback).
  - [ ] `getMeta()` returns correct meta from the WeakMap on the original schema reference.
  - [ ] `getMeta()` returns correct meta through `.optional()`, `.nullable()`, `.default()`, `.refine()` wrappers via the `.describe()` fallback.
  - [ ] If `.describe()` is overwritten by external tooling, `getMeta()` still succeeds on the original (unwrapped) reference via WeakMap.
  - [ ] TypeScript type of `ui(z.string(), meta)` is still `z.ZodString` (no type narrowing lost).
  - [ ] Calling `ui()` with invalid meta throws `SchemaFormError` carrying a field path in dev mode; production mode falls through silently with a `console.warn`.
  - [ ] No renderer or engine code imported anywhere in `core/`.
- PR contents: the four files above plus one test file.

### Phase 2 -- `compile()` (schema → FormSpec)

*Outcome:* any Zod schema can be normalized to a `FormSpec` the renderer will consume.

- Entry gate: Phase 1 merged.
- Create `libs/shared/schema-forms/src/framework/core/compile.ts` exporting `compile(schema): FormSpec`.
- **Structural constraint:** the walk produces an intermediate `SchemaNode[]` array (typed in `types.ts`) that all downstream logic reads from, rather than re-traversing the Zod `_def` tree. This intermediate representation is the seam for the multi-pass refactor in Phase 13.
- Implementation rules (from Section 4.3):
  - Walk the Zod tree once into `SchemaNode[]`; then build `fields` map keyed by dot-path, `order`, `defaults`, `validators.byField`, `validators.whole` from those nodes.
  - Infer `type` from Zod node if meta doesn't set it (`ZodString`→`text`, `ZodNumber`→`number`, `ZodBoolean`→`checkbox`, `ZodEnum`→`select`, `ZodArray`→`array`, `ZodObject`→`object`, `ZodDate`→`date`, literal `true`→`checkbox`).
  - Derive `label` from field name (camel→Title Case) if meta omits it.
  - Default `col` to `{ xs: 12 }`.
  - Enforce depth limit of 5 -- throw `SchemaFormError`.
  - Default layout = one row per field in author order.
- Memoize via `WeakMap` keyed on the schema reference.
- Unit tests in `libs/shared/schema-forms/src/framework/core/__tests__/compile.test.ts`:
  - Flat schema snapshot.
  - Inference covers every Zod node type.
  - Nested object depth produces correct paths (`address.city`).
  - Array produces correct paths (`hobbies[0].name`).
  - Depth > 5 throws.
  - Missing meta falls back to defaults.
- Acceptance criteria:
  - [ ] `compile(flatSchema)` produces a snapshot matching the expected `FormSpec` (test via Vitest's `toMatchInlineSnapshot`).
  - [ ] Type inference mapping (`ZodString`→`text`, `ZodNumber`→`number`, `ZodBoolean`→`checkbox`, `ZodEnum`→`select`, `ZodArray`→`array`, `ZodObject`→`object`, `ZodDate`→`date`) has a test case per Zod node type.
  - [ ] Nested `z.object({ address: z.object({ city: z.string() }) })` produces a field at path `address.city` with `depth === 1`.
  - [ ] Array `z.array(z.object({ name: z.string() }))` produces an `array` field whose item sub-spec has path `items[].name`.
  - [ ] Schema nested 6 levels deep throws `SchemaFormError` carrying the offending path; 5 levels deep does not throw.
  - [ ] When meta omits `type`, `label`, and `col`, the compiled field has inferred `type`, title-cased `label` from the field name, and `col: { xs: 12 }`.
  - [ ] `compile()` is memoized via `WeakMap`: calling it twice on the same schema reference returns referentially equal `FormSpec`.
  - [ ] `FormSpec.validators.whole` equals the original schema; `FormSpec.validators.byField[path]` is a sub-schema for live per-field validation.
- PR contents: `compile.ts` + tests + a `__fixtures__/` folder of small schemas.

### Phase 3 -- Field registry and FallbackField

*Outcome:* the renderer has a lookup mechanism for field types and a graceful fallback for unknown ones.

- Entry gate: Phase 1 merged (can run in parallel with Phase 2).
- Create `libs/shared/schema-forms/src/framework/core/registry.ts` with `createDefaultRegistry()`, `FieldRegistry` type, and `extend()` helper.
- Registry is seeded empty for now; Phase 4 will populate it.
- Create `libs/shared/schema-forms/src/framework/renderer/FallbackField.tsx` -- an MUI `Alert` (severity `warning`) + generic `TextField` wired to `binding.value` / `binding.onChange`. In dev, logs via `console.warn`.
- Unit tests:
  - `get(type)` returns registered component; returns `undefined` for unknown.
  - `extend()` does not mutate the base registry.
- Storybook: one story for `FallbackField` showing an unknown-type warning.
- Acceptance criteria:
  - [ ] `createDefaultRegistry()` returns an empty registry (fields populated in Phase 4).
  - [ ] `registry.extend({ foo: FooField })` produces a new registry; base is unchanged.
  - [ ] `registry.get('unknown')` returns `undefined`.
  - [ ] `FallbackField` renders an MUI `Alert` at severity `warning` naming the attempted type.
  - [ ] `FallbackField` still wires `binding.value` / `binding.onChange` so the form can submit.
  - [ ] In `NODE_ENV !== 'production'`, using an unknown type emits exactly one `console.warn` per unique field path (not per re-render).
  - [ ] Fallback story visible in Storybook at `Framework/Renderer/FallbackField`.

### Phase 4 -- Default field components (flat types only)

*Outcome:* the 9 flat MUI-backed field components exist and are documented in Storybook.

- Entry gate: Phase 3 merged.
- Build, one component per commit inside the phase PR if possible:
  - `TextField` (text, password, email -- variants via `type`)
  - `NumberField` -- wraps MUI `TextField type="number"` for v1; upgrade to Base UI `NumberField` if MUI v9+ is adopted later
  - `TextareaField`
  - `SelectField`
  - `CheckboxField`
  - `SwitchField`
  - `RadioGroupField`
  - `DateField` (native `type="date"` via MUI `TextField` for v1; upgrade to `@mui/x-date-pickers` if needed later)
  - `FileUploadField` -- drag-and-drop zone + hidden `<input type="file">`; supports `accept`, `multiple`, `maxSizeMB` via `componentProps`; renders file list with remove buttons
- Each component accepts `{ spec, binding, form }`, reads `label` / `helperText` / `placeholder` / `options` from `spec.meta`, wires `binding.value` / `binding.onChange` / `binding.onBlur`, surfaces `binding.error` via MUI `error` + `helperText`.
- Every component co-located with a `*.stories.tsx` file showing `Default`, `WithError`, `Disabled`. No `ObjectField` or `ArrayField` yet.
- Acceptance criteria:
  - [ ] All 9 components exist, each as `libs/shared/schema-forms/src/framework/fields/<Name>/<Name>.tsx` + `.stories.tsx` + `.test.tsx`.
  - [ ] Each component accepts `{ spec, binding, form }` and only these three props; implementation details (e.g., MUI-specific props) are passed through `spec.meta.componentProps`.
  - [ ] Each component renders `spec.meta.label` wired to the input via `htmlFor` / `aria-labelledby`.
  - [ ] Each component surfaces `binding.error` inline via MUI `helperText` + `error` state.
  - [ ] Each component calls `binding.onBlur` on blur and `binding.onChange` with the correct typed value (not the raw DOM event).
  - [ ] Each component's `Default`, `WithError`, `Disabled` stories render in Storybook.
  - [ ] `@storybook/addon-a11y` reports zero violations on every story.
  - [ ] All 9 components are registered in `defaultRegistry` (Phase 3's empty registry now populated).
  - [ ] 80%+ statement coverage on each field component.
- PR contents: 9 component folders, 9 stories, 9 test files. Register all into the default registry created in Phase 3.

### Phase 5 -- TanStack Form engine adapter

*Outcome:* a working `FormEngine` built on TanStack Form.

- Entry gate: Phases 2 and 4 merged.
- Create `libs/shared/schema-forms/src/framework/engines/types.ts` with `FormEngine`, `FormHandle`, `FieldBinding` (v1 shape; no `capabilities` yet).
- Create `libs/shared/schema-forms/src/framework/engines/tanstack/TanStackEngine.ts` and `useTanStackForm.ts`.
  - `useForm({ spec, defaultValues, onSubmit })` wraps `@tanstack/react-form`.
  - `getFieldProps(path)` returns `{ value, onChange, onBlur, error, touched, dirty, isValidating, name }` by subscribing to the TanStack field meta.
  - Per-field validators attach via `validators.onChange: spec.validators.byField[path]`.
  - Array operations exposed via `arrayOps: { push, insert, remove, move, getKeys }` backed by TanStack's array helpers + adapter-managed key map.
- Unit tests using `@testing-library/react` + a tiny test harness:
  - Typing into a field updates `values`.
  - Invalid values produce the expected Zod error.
  - `submit()` resolves when valid; rejects when invalid.
  - Array push/insert/remove/move mutate correctly.
  - Array keys remain stable across mutations.
- Acceptance criteria:
  - [ ] `useTanStackForm({ spec, defaultValues, onSubmit })` returns a `FormHandle` matching `engines/types.ts` exactly.
  - [ ] `handle.getFieldProps('email')` returns `{ value, onChange, onBlur, error, name }` with `name === 'email'`.
  - [ ] Typing in a test harness input updates `handle.values.email` after the next tick.
  - [ ] Zod `email()` validator surfaces as `handle.errors.email[0]` on invalid input.
  - [ ] Async validators with `onChangeAsyncDebounceMs: 300` fire at most once per 300ms of typing (verified via fake timers).
  - [ ] `handle.submit()` resolves when valid; when invalid, it rejects *without* calling the user's `onSubmit`.
  - [ ] `handle.arrayOps.push('items', value)` adds an item; `.insert('items', 0, value)` inserts at index 0; `.remove('items', 0)` removes the first; `.move('items', 0, 1)` swaps.
  - [ ] `handle.arrayOps.getKeys('items')` returns `['__fk_0']` after one push; after a second push returns `['__fk_0', '__fk_1']`; after `remove('items', 0)` returns `['__fk_1']` (key `__fk_0` is retired).
  - [ ] After `move('items', 0, 1)`, `getKeys` returns keys in the new order (not regenerated).
  - [ ] No `SchemaForm` or renderer imports anywhere in `engines/`.
- PR contents: 3 files + 1 test file.

### Phase 6 -- `SchemaForm` + LayoutRenderer + FieldRenderer

*Outcome:* a consumer can call `<SchemaForm schema={…} onSubmit={…} />` and get a working form.

- Entry gate: Phases 2, 3, 4, 5 merged.
- Create `libs/shared/schema-forms/src/framework/renderer/`:
  - `FormContext.ts` -- React context for `{ spec, handle, registry }`.
  - `LayoutRenderer.tsx` -- translates `LayoutNode` tree into MUI `Grid` v2 tree.
  - `FieldRenderer.tsx` -- resolves `spec.type` via registry, renders component or `FallbackField`.
  - `SchemaForm.tsx` -- top-level orchestrator (compile spec, call engine `useForm`, wrap in provider, render layout).
  - `FormActions.tsx` -- default submit/reset bar with `disabled={!isValid || isSubmitting}`.
- Public API from `libs/shared/schema-forms/src/framework/index.ts`:
  - `SchemaForm`, `ui`, `defaultRegistry` only. Nothing else exported from the root.
- Create `libs/shared/schema-forms/src/framework/contracts/signup.schema.ts` with the schema from Section 4.1.
- Storybook: `SchemaForm/SchemaForm.stories.tsx` with `Default` and `WithValidationErrors` (play function fills invalid values and asserts inline errors).
- Acceptance criteria:
  - [ ] `<SchemaForm schema={SignupSchema} onSubmit={fn} />` renders a working form with one field per schema property.
  - [ ] Signup form renders in Storybook with tokens-derived MUI styling (no unstyled inputs, no inline colors).
  - [ ] Live validation works: typing an invalid email shows the error inline after blur or change.
  - [ ] Submit with valid values calls `onSubmit` with a value typed as `z.infer<typeof SignupSchema>` (TypeScript-checked).
  - [ ] Submit with invalid values does NOT call `onSubmit`; invalid fields are highlighted and focus moves to the first invalid field.
  - [ ] `LayoutRenderer` produces the default layout (one row per field) when the schema has no layout meta.
  - [ ] `LayoutRenderer` renders a `custom` node by resolving it from the `LayoutRegistry`; an unregistered name renders `FallbackLayoutBlock` with a dev-mode console error.
  - [ ] `FieldRenderer` falls back to `FallbackField` when a schema uses an unregistered `type`.
  - [ ] Public `libs/shared/schema-forms/src/framework/index.ts` exports exactly three names: `SchemaForm`, `ui`, `defaultRegistry`.
  - [ ] a11y addon reports zero violations on the `SchemaForm/Default` and `SchemaForm/WithValidationErrors` stories.
  - [ ] 80%+ statement coverage on files in `libs/shared/schema-forms/src/framework/renderer/`.
- PR contents: 5 renderer files, `FormContext`, `SchemaForm/SchemaForm.stories.tsx`, `signup.schema.ts`, `index.ts` public surface, renderer tests. No changes to `core/`, `engines/`, or `fields/`.

### Phase 7 -- Nested objects and arrays

*Outcome:* nested schemas and dynamic arrays render correctly.

- Entry gate: Phase 6 merged.
- Create `libs/shared/schema-forms/src/framework/fields/ObjectField/ObjectField.tsx` -- recursively renders sub-specs via `LayoutRenderer`.
- Create `libs/shared/schema-forms/src/framework/fields/ArrayField/ArrayField.tsx` -- uses `form.arrayOps` to add/remove/insert/move rows, each row keyed via `arrayOps.getKeys(path)`. Each row is a sub-layout of the item schema.
- Register both in the default registry.
- Create `libs/shared/schema-forms/src/framework/contracts/profile.schema.ts` (nested `address`) and `libs/shared/schema-forms/src/framework/contracts/survey.schema.ts` (array of question/answer).
- Storybook stories demonstrating both.
- Tests: `ArrayField` push/remove/move/insert behavior via Testing Library; key stability assertions; depth-limit violation path in `compile.test.ts`.
- Acceptance criteria:
  - [ ] `ObjectField` renders nested paths correctly (`address.city` → `<input name="address.city">`).
  - [ ] Editing a nested field updates the parent `values` tree without clobbering siblings.
  - [ ] `ArrayField` renders an "Add" button; clicking it calls `form.arrayOps.push(path, defaults)` and a new row appears.
  - [ ] Each array row renders a "Remove" button that calls `form.arrayOps.remove(path, index)`.
  - [ ] Array rows render with their own sub-layout (one row per item field) derived from the item schema.
  - [ ] **Key stability:** each row's React `key` comes from `arrayOps.getKeys(path)[i]`, not from the array index. Verified: after `move(path, 0, 2)`, the DOM node for the moved item retains its `data-testid` key.
  - [ ] **Key uniqueness:** after `remove(path, 1)` followed by `push(path, newItem)`, the new item's key is different from the removed item's key.
  - [ ] **Focus preservation:** typing in an input inside array row 1, then clicking "Remove" on row 0, leaves focus inside the same logical row (now at index 0) without re-mounting.
  - [ ] Depth-limit story in Storybook shows a compile error message when a schema nests past 5 levels.
  - [ ] `profile.stories.tsx` and `survey.stories.tsx` have `Default`, `WithValidationErrors`, and `Submitting` variants.
  - [ ] a11y addon reports zero violations on both stories (labels associated with inputs, "Add"/"Remove" buttons have accessible names).
- PR contents: `ObjectField/`, `ArrayField/` folders (component + stories + test), registry registration, `profile.schema.ts`, `survey.schema.ts`, one new test case in `compile.test.ts`.

### Phase 8 -- Demo dashboard

*Outcome:* a single page a junior can run (`pnpm nx dev shell`) that showcases the framework.

- Entry gate: Phase 7 merged.
- Build `apps/shell/src/App.tsx` with a router route:
  - `/` = `Dashboard` page with:
    - `SchemaPicker` (dropdown listing 4 schemas: signup, profile, survey, contact)
    - `<SchemaForm>` rendered for the chosen schema
    - `StatePreview` panel showing `JSON.stringify(currentValues, null, 2)` (subscribes to the form via a hook exposed by the renderer)
    - `ValidationPanel` listing current errors
- Wire existing demo `package.json` scripts to point `dev` at `apps/shell/src/App.tsx`.
- One simple Playwright-less smoke test is sufficient: a Storybook play function for each schema.
- Acceptance criteria:
  - [ ] `pnpm nx dev shell` loads the dashboard on :5173 with no console errors.
  - [ ] `SchemaPicker` dropdown lists at least 4 schemas: signup, profile, survey, contact.
  - [ ] Switching schemas in the picker remounts the form and resets to the new schema's defaults.
  - [ ] `StatePreview` renders valid JSON of `handle.values` and updates on every keystroke (verified manually and via a play function).
  - [ ] `ValidationPanel` lists current errors with field path + message; updates live as fields are edited.
  - [ ] Each schema has a Storybook play function that fills a valid submission and asserts `onSubmit` fired with the right shape.
  - [ ] No engine toggle is present (must ship in Phase 12, not earlier).
  - [ ] The demo page is accessible: keyboard-only navigation reaches every interactive element, tab order is logical, focus visible.
- PR contents: `apps/shell/src/App.tsx`, `apps/shell/src/pages/Dashboard.tsx`, `apps/shell/src/components/SchemaPicker.tsx`, `apps/shell/src/components/StatePreview.tsx`, `apps/shell/src/components/ValidationPanel.tsx`, `contact.schema.ts`, `vite.config.ts` + `package.json` script wiring.

### Phase 9 -- Polish, quickstart, and v1 docs

*Outcome:* v1 is ready for juniors.

- Entry gate: Phase 8 merged.
- Wrap `FieldRenderer` in an `ErrorBoundary` per field so one broken field doesn't crash the form.
- Add form-level error surface: when `onSubmit` rejects, render an MUI `Alert` at the top of the form with the error message; store as `errors['']` on the handle.
- Write `docs/schema-forms-quickstart.md` (~200 lines) based on Appendix A.4's "contact form in 10 minutes" flow. Include: add a field, add validation, style one field (via `componentProps`), test a form with `renderWithProviders`.
- Write `docs/schema-forms-cookbook.md` with 6 copy-paste recipes.
- Add JSDoc with one example each on `ui()`, `SchemaForm`, and every default field component.
- Verify Storybook Docs tab is populated for every field.
- Acceptance criteria:
  - [ ] `FieldErrorBoundary` wraps every rendered field so one field crashing does not blank the whole form; a friendly "This field failed to render" Alert appears in place.
  - [ ] When `onSubmit` rejects, the form renders an MUI `Alert` above the form with the error message; the error is also stored at `handle.errors['']`.
  - [ ] Server RFC 9457 `problem+json` responses with field-level errors are parsed and surfaced inline on the matching fields (per Section 19.5 contract).
  - [ ] `docs/schema-forms-quickstart.md` exists, ≤ 200 lines, and includes: "install", "build a contact form in 10 minutes", "add validation", "style one field", "test with `renderWithProviders`".
  - [ ] `docs/schema-forms-cookbook.md` has at least 6 copy-paste recipes, each runnable as-is.
  - [ ] JSDoc with `@example` is present on `ui()`, `SchemaForm`, `defaultRegistry`, and every default field component.
  - [ ] Storybook Docs tab is populated for every field (props table + working Controls + one "Try it" example).
  - [ ] All Appendix A.8 sanity checks pass.
  - [ ] Volunteer test: a new engineer (not the plan author) can build the contact form from the quickstart in under 10 minutes, without asking questions outside the docs.
- PR contents: `libs/shared/schema-forms/src/framework/renderer/FieldErrorBoundary.tsx`, form-level error wiring in `SchemaForm.tsx`, `docs/schema-forms-quickstart.md`, `docs/schema-forms-cookbook.md`, JSDoc additions on public-API files, no behavior changes beyond error handling.

### Phase 10 -- Nx library promotion (optional timing)

*Outcome:* the framework lives in `libs/ibc/schema-forms/` as an Nx library and consumer apps import from `@ibc/schema-forms`.

- Entry gate: Phase 9 merged; team has decided a monorepo promotion is desired.
- Follow Appendix B steps 1-10 exactly. No code is rewritten; everything is a move or a config addition.
- Acceptance criteria (Appendix B.11 as a checklist):
  - [ ] `nx build ibc-schema-forms` emits a tree-shakeable ESM dist with `.d.ts` files.
  - [ ] `nx test ibc-schema-forms` runs the unit suite green.
  - [ ] `nx storybook ibc-schema-forms` serves stories on :6007 with a11y addon clean.
  - [ ] `nx lint ibc-schema-forms` passes with module-boundary constraints active.
  - [ ] A consumer app can `import { SchemaForm, ui } from '@ibc/schema-forms'` with zero barrel imports.
  - [ ] `nx graph` shows `ibc-schema-forms` as a shared node with no inbound edges from `scope:shell` or `scope:agent` libs.
  - [ ] Every test that passed pre-move still passes post-move.
  - [ ] No behavior changes; `git diff --stat` shows predominantly file renames.
- PR contents: this one is deliberately large because it moves the folder tree. Keep it to a single PR by performing the move in a single commit, then follow-up commits for `project.json`, `package.json` exports, tags, Storybook composition. No behavior changes; tests must pass identically to pre-move.

### Phase 11 -- RHF adapter + parity contract tests (v1.1)

*Outcome:* a second engine exists, proving the abstraction holds.

- Entry gate: Phase 5 and Phase 6 merged. (Phase 10 not required.)
- Reintroduce `FormHandle.capabilities` in the engine types.
- Implement `libs/shared/schema-forms/src/framework/engines/rhf/RHFEngine.ts` + `useRHFForm.ts` against the same interface.
- Build `libs/shared/schema-forms/src/framework/engines/__tests__/parity.test.ts`:
  ```ts
  describe.each(['tanstack', 'rhf'] as const)('engine parity: %s', (name) => {
    it('runs Zod validators per-field', …)
    it('supports array push/remove/move', …)
    it('resolves submit with typed values', …)
  })
  ```
- Add `engine` prop to `SchemaForm` (default `'tanstack'`); dynamic `import()` of engines so only the active one ships.
- Acceptance criteria:
  - [ ] `useRHFForm({ spec, defaultValues, onSubmit })` returns a `FormHandle` matching the same interface as `useTanStackForm`.
  - [ ] Parity test suite has at least the following describe-each groups: per-field Zod validation, submit with typed values, array push/remove/move, reset with new values, error paths on invalid submit.
  - [ ] Both engines pass every test in the parity suite. A failure on one engine fails CI.
  - [ ] `<SchemaForm engine="rhf" …>` renders the same signup/profile/survey/contact schemas as `engine="tanstack"` with visually and functionally identical output.
  - [ ] Bundle analysis (e.g., `rollup-plugin-visualizer`) confirms only the active engine ships in a production build (dynamic-import code-splitting verified).
  - [ ] The default `engine` prop is `'tanstack'` so existing v1 call-sites are unchanged.
  - [ ] `FormHandle.capabilities.fieldArrays === true` on both engines.
- PR contents: `engines/rhf/` folder, `engines/types.ts` capabilities addition, `engines/__tests__/parity.test.ts`, `SchemaForm.tsx` engine-prop wiring, `package.json` peer-dep update. No default-registry or field-component changes.

### Phase 12 -- Engine switcher + comparison demo (v1.1)

*Outcome:* the demo showcases the abstraction with live engine switching.

- Entry gate: Phase 11 merged.
- Implement `useEngineSwitcher` per Section 5.4.
- Add an `EngineToggle` control to the dashboard.
- Add a `/compare` route that renders the same schema with both engines side-by-side, sharing `defaultValues`.
- Add a `SwitchingEngines` Storybook play function that toggles engines mid-edit and asserts preserved values.
- Acceptance criteria:
  - [ ] `useEngineSwitcher(initialName)` returns `{ engine, setEngine, snapshot }` where `snapshot` is the last-known form values from the outgoing engine.
  - [ ] Toggling engines mid-edit: fill 3 fields, switch, verify those 3 values are still present; errors reset (they are engine-specific).
  - [ ] `/compare` route renders two `<SchemaForm>` instances side-by-side on the same schema, one per engine, with a shared parent-controlled `defaultValues` state.
  - [ ] Editing in either form in `/compare` syncs the JSON preview; the other form does *not* auto-update (demo shows independent engines, not shared state).
  - [ ] Storybook play function `SchemaForm/SwitchingEngines` fills `email`, toggles engine, asserts email still present, no crash.
  - [ ] a11y addon clean on the dashboard with the new `EngineToggle` control (has accessible label).
- PR contents: `libs/shared/schema-forms/src/framework/engines/switcher.ts`, `apps/shell/src/components/EngineToggle.tsx`, `apps/shell/src/pages/Comparison.tsx`, new route in `App.tsx`, one new Storybook story.

### Phase 13 -- Advanced meta (v1.1)

*Outcome:* async validation, conditional fields, and hidden/readonly fields are first-class.

- Entry gate: Phase 6 merged. (Phase 11 not required; these features work with TanStack-only.)
- **Refactor first:** Before adding new features, decompose `compile()` into explicit passes as described in Section 4.3. The `SchemaNode[]` intermediate from Phase 2 makes this mechanical: extract `walkSchema()`, `extractFields()`, `buildLayout()`, `buildValidators()`, `extractDefaults()` as separate functions. Add `assembleDependencyGraph()` as the new pass for `dependsOn` cycle detection. All existing Phase 2 tests must pass unchanged after the refactor — do this in a dedicated commit before the feature commits.
- Extend `FieldMeta` with `asyncValidate`, `dependsOn`, `hidden`, `readOnly`, `clearOnHide`.
- Implement the async validator registry (named validators referenced by string so schemas stay JSON-safe).
- Implement `dependsOn` via `assembleDependencyGraph()` (compile-time cycle detection) + a runtime re-render hook that subscribes to specific paths.
- Implement hidden/readonly behavior in `FieldRenderer`.
- Add cookbook examples for each.
- Acceptance criteria:
  - [ ] `asyncValidate: 'checkEmail'` on a field meta triggers the registered validator with debouncing (300ms default); loading adornment shows on the input during the request.
  - [ ] Async errors surface as `handle.errors[path]` identical to sync errors; submit is disabled while any async validation is in flight.
  - [ ] `dependsOn: ['role']` on field `adminCode` re-renders that field when `values.role` changes; the field is hidden when `role !== 'admin'`.
  - [ ] `hidden: true` on a field: the field is not rendered *and* its value is excluded from `onSubmit` payload if `clearOnHide: true`; otherwise the last value is preserved.
  - [ ] `readOnly: true` renders the field's MUI control with `readOnly` / `InputProps: { readOnly: true }` such that values display but cannot change.
  - [ ] Each of `asyncValidate`, `dependsOn`, `hidden`, `readOnly`, `clearOnHide` has a dedicated Storybook story demonstrating it and at least one unit test.
  - [ ] Cookbook (`docs/schema-forms-cookbook.md`) has a new recipe for each of the five features, each recipe ≤ 40 lines.
- PR contents: `core/types.ts` meta extension, `core/asyncValidators.ts` registry, `renderer/FieldRenderer.tsx` hidden/readonly handling, `hooks/useDependentFields.ts`, four new Storybook stories, four new cookbook sections. This phase can optionally be split into 13a (hidden/readonly) and 13b (async + dependsOn) if the diff exceeds 500 lines.

### Tracking and visibility

A junior can open `docs/schema-driven-ui-framework-plan.md` Section 13, scroll to the current phase, and know exactly what files to touch, what tests to write, and what the exit gate is. No v1 phase depends on more than three earlier phases, so the graph is small and easy to parallelize where dependencies allow (phases 3 and 4 can run alongside 2; phases 11 and 13 can run alongside each other in v1.1).

**Dashboard view.** Maintain a pinned GitHub issue titled "Schema Forms v1 Progress" that lists the phases as checkboxes and links to the PR for each. When a phase PR merges, check its box. v1 is complete when phases -1 through 9 are checked.

Project managers can track v1 completion as "Phases -1 through 9 green". Phase 10 (Nx) is independent and can land whenever the monorepo is ready. v1.1 work (Phases 11-13) is triggered only by a real user need.

---

## 14. Acceptance Criteria

### v1 (phases -1 through 9)

1. **Schema Definition System** -- Authoring a Zod schema with `ui()` metadata renders a working, validated form. TS types flow from schema to `onSubmit`.
2. **Form Engine Abstraction (single engine + seam)** -- `SchemaForm` renders on TanStack Form. Field components import from neither form library directly; they consume only the `FieldBinding` contract. The `FormEngine` interface is in place so a second adapter can be added without changing field components.
3. **Layout Renderer** -- Forms adapt responsively across `xs/sm/md/lg`. Author layout overrides are honored; missing fields fall through to a warning + append. No CSS authored outside tokens + MUI theme.
4. **Field Registry** -- All shipped field types render. Unknown types produce the `FallbackField` with warning log. Consumers can register custom types.
5. **Live Demo Dashboard** -- Four schemas, `StatePreview` + `ValidationPanel` reflect state in real time. (No engine toggle in v1; that ships in v1.1.)
6. **Edge cases** -- All entries in Section 8 covered by unit or story tests.

### v1.1 (phases 11-13)

7. **Two-engine parity** -- `SchemaForm` supports `engine="tanstack"` and `engine="rhf"` with identical observable behavior (contract tests green).
8. **Engine switcher** -- `useEngineSwitcher` preserves values across engines mid-edit.
9. **Advanced meta** -- `asyncValidate`, `dependsOn`, `hidden`, `readOnly`, `clearOnHide` all documented and tested.

---

## 15. Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| TanStack Form API churn (pre-1.0 when adopted) | Pin to a specific minor; wrap every API call inside `TanStackEngine` so upgrades touch one file. |
| RHF `resolver` validation granularity differs from TanStack's per-field model | Engine adapter re-parses `spec.validators.byField[path]` manually on change; contract tests enforce parity. |
| Zod metadata lost through transforms (`.optional()`, `.default()`, etc.) | Dual-storage: `WeakMap` side-channel (primary, authoritative) + `.describe()` JSON envelope (fallback for combinator survival). `getMeta()` checks both. Contract test each combinator through both paths. |
| External tooling overwrites `.describe()` (e.g. `zodToJsonSchema`, OpenAPI generators) | `WeakMap` is the primary source of truth and is invisible to other tools; `.describe()` is only a fallback. Contract test: overwrite `.describe()`, assert `getMeta()` still returns correct meta from WeakMap. |
| Infinite render loops from `dependsOn` | Compile a static dependency graph, detect cycles at compile time, fail with `CompileError`. |
| `useFieldArray` vs TanStack array semantics differ | Normalize through `FormHandle.arrayOps` capability with stable key management (adapter-maintained `Map<string, string[]>`). Fallback `reset(nextValues)` path still maintains keys; dev-mode warning emitted for arrays > 50 items on the fallback path. Contract tests assert key stability across push/remove/move for **both** engines. |
| Engine switch loses ref / focus state | Document that focus is not preserved; focus the first invalid field on switch to give a sensible UX. |
| Bundle bloat from shipping both engines | Engines are imported from `engines/tanstack/*` and `engines/rhf/*` behind a dynamic `import()` inside `useEngine`, so only the active engine ships in the primary chunk. |
| Schema meta schema drift (author writes wrong meta) | `ui()` validates meta against an internal Zod schema at authoring time in dev (`process.env.NODE_ENV !== 'production'`). |

---

## 16. Out-of-Band Questions for the Product Owner

None blocking. Decisions assumed in this plan:

- **Primary stack = React 18 + MUI v7 + design tokens + TanStack Form + Zod v3.** Design tokens live in `libs/shared/tokens/` and are bridged into the MUI theme.
- **Phase -1 is complete** -- the repo is an Nx monorepo with React 18 + Storybook 10 + pnpm. MUI install + theme wiring is part of Phase 0.
- **Default form engine = TanStack** (per user preference).
- **Zod v3** (v4 tracked; upgrade path is a one-line adapter change).
- **MUI v7 + design tokens** for layout and styling. All visual decisions live in `libs/shared/tokens/src/tokens/design-tokens.css` as CSS custom properties and are bridged into the MUI theme via `createTheme({ cssVariables: true })`. Framework field components use MUI primitives + `sx` prop. Non-framework components (atoms, molecules) may continue using CSS Modules.
- **No router integration** in the framework itself; the demo uses `react-router-dom` v7 already in the repo.
- **Use `useMemo` / `useCallback` / `React.memo` sparingly** -- only where profiling shows a real performance need (React Compiler is not available on React 18).

---

## 17. Quick Reference

| Command | Purpose |
|---------|---------|
| `pnpm nx dev shell` | Launch demo dashboard on :5173 |
| `pnpm run storybook` | Launch Storybook on :6006 |
| `pnpm test` | Run Vitest suite (unit + contract tests) |
| `pnpm nx run-many -t build` | Type-check + production build of demo |
| `pnpm run build-storybook` | Static Storybook export |

---

## 18. Tree of Deliverables (Cheat Sheet)

```
libs/shared/schema-forms/src/framework/
  core/                    ← compile, meta, registry, types, errors
  engines/
    tanstack/              ← primary
    rhf/                   ← secondary
    switcher.ts
  renderer/
    SchemaForm.tsx         ← public entry
    LayoutRenderer.tsx
    FieldRenderer.tsx
    FallbackField.tsx
  fields/                  ← MUI-backed default field set
  hooks/
  testing/
  index.ts                 ← public surface

contracts/                 ← consumer-authored schemas (4 demo schemas)

apps/shell/src/            ← dashboard (comparison page ships in v1.1)
```

This is the complete plan. Execution follows the phases in Section 13; every phase ends with runnable artifacts and green tests, so progress is observable without a final big-bang integration.

---

## 19. Backend Coordination Contract

Schema-driven forms only deliver on "single source of truth" if the **schema itself** is shared with the backend. This section is the brief for server developers: what they need to deliver and what timing works.

Share this section (or a copy) with the backend team before framework Phase 2 merges.

### 19.1 What we need from the backend, ranked by value

| # | Deliverable | Required by | Consumed by |
|---|---|---|---|
| 1 | **OpenAPI 3.1 spec** (JSON or YAML) at a stable URL, versioned with the backend release | Phase 0 (app-level); unblocks client code-gen | `orval` / `openapi-typescript` in `libs/shared/data-access` |
| 2 | **Field-level validation rules** expressed in OpenAPI (`minLength`, `maxLength`, `pattern`, `format`, `enum`, `minimum`, `maximum`, `required`) | Phase 2 | Zod schema generation (see 19.4) |
| 3 | **Semantic `format` hints** on string fields (`email`, `uri`, `date`, `date-time`, `uuid`, `tel`) | Phase 2 | `ui.type` inference |
| 4 | **Unique-value endpoints** for async validation (`GET /api/users/check-email?value=...` → `{ taken: boolean }`) | Phase 13 (v1.1) | `asyncValidate` helpers |
| 5 | **Error response contract** -- when a write fails validation server-side, return `422` with a body matching the shape below (19.5) | Phase 6 | Form-level + field-level error surfacing |
| 6 | **Enum sources** for dynamic option lists (countries, roles, tags) exposed as `GET /api/enums/{name}` returning `[{ value, label }]` | Phase 4 | `SelectField` / `RadioGroupField` `options` |
| 7 | **Idempotency key support** on write endpoints (accept `Idempotency-Key` header) | Phase 6 | Safe retries on submit |
| 8 | **CORS + preflight for PATCH / DELETE** in all non-prod environments | Phase 0 | Needed for MSW-backed mock UX |

Items 1-3 are blocking for the framework. Items 5 and 7 block a good submission UX. Items 4, 6, and 8 are deferrable but should be on the backlog.

### 19.2 OpenAPI conventions we rely on

Give server developers a short rule sheet so the spec they produce generates the schemas we want:

- Use **OpenAPI 3.1**, not 3.0 (3.1 aligns with JSON Schema Draft 2020-12, which Zod tooling converts most faithfully).
- Prefer `type: string, format: <semantic>` over ad-hoc patterns when a format exists (`email`, `uuid`, `uri`, `date-time`, `date`, `time`, `ipv4`, `ipv6`). We key `ui.type` off format.
- For closed choice sets, use `enum`. We render as `select` by default.
- For open tag-like fields, use `type: array, items: { type: string }` -- we render as a chip input.
- Mark required fields in the parent's `required: []` array -- this is the source of truth for `z.optional()`.
- Use `x-ui` extensions (explicitly allowed by OpenAPI) for UI hints that don't map to validation:

  ```yaml
  properties:
    bio:
      type: string
      maxLength: 500
      x-ui:
        type: textarea
        helperText: "Short bio shown on your profile"
        col: { xs: 12 }
  ```

  Our code-gen reads `x-ui` and emits `ui({ … })` automatically. This is optional -- forms still render without it.
- Describe error responses with `application/problem+json` (RFC 9457) so our error surfacing has a single shape to parse.

### 19.3 The request-to-us to the backend team

A short message the frontend team can send, verbatim:

> **Subject:** Dependencies for the schema-driven forms project
>
> We are starting a schema-driven UI framework that generates React forms from Zod schemas. To avoid divergence between UI validation and server validation, we want to generate both from your OpenAPI spec. We need the following from you, ideally before we land framework Phase 2:
>
> 1. An OpenAPI 3.1 spec published at a stable URL (e.g., `https://api.example.com/openapi.json`), versioned with each deploy.
> 2. Complete field-level validation: `minLength`, `maxLength`, `pattern`, `format`, `enum`, `minimum`, `maximum`, and the parent `required` array.
> 3. Semantic `format` hints on string fields wherever applicable (`email`, `uuid`, `date`, etc.).
> 4. Error responses with status `422` on validation failures, body shape per RFC 9457 (`application/problem+json`) with a `errors: [{ path, code, message }]` array for per-field failures.
> 5. (Deferred, needed only for async uniqueness checks) Endpoints like `GET /api/users/check-email?value=...` returning `{ taken: boolean }`.
> 6. (Deferred) `Idempotency-Key` header support on write endpoints.
>
> We'll own: generating the TypeScript client, generating the base Zod schemas from your spec, writing `ui()` metadata on top, and rendering forms. You own: the spec staying accurate every deploy.
>
> We do **not** need you to change your server code in response to our UI; the schema is the contract, and we generate from it.

### 19.4 OpenAPI → Zod pipeline (frontend side, not a backend ask)

The frontend is responsible for converting the server's spec into Zod. Two tools do most of the work:

```bash
# Install once in libs/shared/data-access
npm install -D openapi-zod-client
```

```jsonc
// libs/shared/data-access/openapi-zod.config.json
{
  "input": "./openapi.json",
  "output": "./src/schemas/generated/",
  "distribution": "schemas-only",
  "withDescription": true,
  "exportAllNamedSchemas": true
}
```

```bash
npx openapi-zod-client  # regenerate on every backend release
```

Output: one file per operation with `z.object({ … })` schemas. We then **extend** these with `ui()` metadata in a hand-written sibling file:

```ts
// libs/shared/data-access/src/schemas/signup.ts
import { Signup as GeneratedSignup } from './generated/signup.gen'
import { ui } from '@ibc/schema-forms'

export const SignupSchema = GeneratedSignup.extend({
  email:    ui(GeneratedSignup.shape.email,    { label: 'Email',   col: { xs: 12, md: 6 } }),
  password: ui(GeneratedSignup.shape.password, { label: 'Password', col: { xs: 12, md: 6 } }),
})
```

Generated schemas give us validation parity with the server for free. The `ui()` overlay adds the UI metadata the server doesn't care about.

### 19.5 Server validation error contract

Server-side 422 responses use RFC 9457 with a tiny extension for per-field errors:

```json
{
  "type": "https://api.example.com/errors/validation",
  "title": "Validation failed",
  "status": 422,
  "detail": "One or more fields are invalid.",
  "errors": [
    { "path": "email", "code": "already_taken", "message": "That email is already in use." },
    { "path": "password", "code": "too_weak", "message": "Password must contain a number." }
  ]
}
```

The framework's `SchemaForm` submit wrapper parses this shape and pipes errors into the right places:

- Each `errors[i].path` → `FormHandle.errors[path]` (the matching field shows the error inline).
- Any error without a matching field falls through to the form-level `errors['']` and renders as an `Alert` above the form.
- `type` + `detail` are logged via the app logger for observability.

If the backend cannot adopt RFC 9457, the framework ships an adapter: `<SchemaForm errorAdapter={myAdapter} …>` receives the raw response and returns the same normalized shape. We prefer RFC 9457 so consumers don't write adapters per API.

### 19.6 Who owns what -- a coordination table

| Concern | Backend owns | Frontend owns |
|---|---|---|
| Field validation rules (min, max, pattern, enum, required) | Yes -- publish in OpenAPI | Consumes via codegen |
| Error shape on failed writes | Yes -- RFC 9457 `problem+json` | Parses and surfaces |
| Enum values for dynamic options | Yes -- expose `/api/enums/{name}` | Fetches and passes to `SelectField` |
| Async uniqueness endpoints | Yes -- `GET /check-*` endpoints | Calls via `asyncValidate` |
| UI labels, helper text, layout | No | `ui()` metadata on generated schemas |
| Field visibility rules | Mixed -- server enforces at submit; UI hides early via `dependsOn` | `dependsOn` in `ui()` |
| Breaking schema changes | Yes -- version the spec; increment the MUI X-style major | Consumes the new spec; migrate forms in a single PR |

### 19.7 Versioning the contract

The OpenAPI spec should be versioned alongside backend releases. Two rules keep forms stable:

1. **Adding a field is non-breaking.** The frontend's generated schema gets a new field with default `ui()` behavior; existing forms either ignore it or pick it up on rebuild.
2. **Removing / renaming a field is breaking.** Must go through a deprecation window: backend marks field `deprecated: true` in OpenAPI for one release, then removes it. The frontend tracks `deprecated: true` and logs dev-mode warnings when a form still references it.

Backend releases that introduce breaking changes bump the `info.version` major and optionally move to a new base path (e.g., `/api/v2/`). The frontend bumps its `openapi.json` snapshot and regenerates schemas in a single PR.

---

## 20. MSW Cookbook for Schema-Driven Forms

MSW (Mock Service Worker) lets us develop forms against realistic API responses without waiting for the backend. This section is a step-by-step recipe tailored to the schema-driven form pipeline -- not a generic MSW primer.

### 20.1 What MSW covers in this project

- **Dev server** -- `pnpm nx dev shell` starts the app against mocked endpoints until the real backend is available.
- **Storybook** -- every form story renders with its own handler set, so edge cases (server errors, slow responses, validation failures) are single-click reproducible.
- **Vitest** -- unit and integration tests use the same handlers as Storybook, guaranteeing parity.

### 20.2 One-time setup

```bash
npm install -D msw
npx msw init public/ --save
```

Creates `public/mockServiceWorker.js` and registers it in `package.json`. Commit both. Never modify the generated worker by hand.

### 20.3 File layout

```
src/
  mocks/
    handlers/
      users.ts           # per-domain handler files
      auth.ts
      enums.ts
    fixtures/
      users.ts           # reusable seed data
    helpers/
      fromZodSchema.ts   # generate fixtures from a Zod schema
      problemJson.ts     # RFC 9457 helpers
    browser.ts           # setupWorker() for dev + Storybook
    server.ts            # setupServer() for Vitest
    index.ts             # combined handlers export
```

Keep handlers **per domain**, not per story. Per-story overrides go in the story file via `parameters.msw`.

### 20.4 Handler that validates with our own Zod schema

This is the key move: the mock parses the request body with the **same Zod schema the form uses**. If the form's validation passes but the mock rejects, we know the schema is incomplete (or the form is skipping a rule). If both accept, we have full-stack confidence from the schema alone.

```ts
// apps/shell/src/mocks/handlers/users.ts
import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import { CreateUserSchema } from '@ibc/shared/data-access/schemas/user'
import { problemJson, fieldErrors } from '../helpers/problemJson'

export const userHandlers = [
  http.post('/api/users', async ({ request }) => {
    const body = await request.json()
    const parsed = CreateUserSchema.safeParse(body)

    if (!parsed.success) {
      return problemJson(422, {
        title: 'Validation failed',
        detail: 'One or more fields are invalid.',
        errors: fieldErrors(parsed.error),
      })
    }

    // Simulate server-side uniqueness check
    if (parsed.data.email === 'taken@example.com') {
      return problemJson(422, {
        title: 'Email already in use',
        errors: [{ path: 'email', code: 'already_taken', message: 'That email is already in use.' }],
      })
    }

    return HttpResponse.json(
      { id: crypto.randomUUID(), ...parsed.data },
      { status: 201 },
    )
  }),

  http.get('/api/users/check-email', ({ request }) => {
    const url = new URL(request.url)
    const value = url.searchParams.get('value')
    return HttpResponse.json({ taken: value === 'taken@example.com' })
  }),
]
```

### 20.5 RFC 9457 helper

```ts
// apps/shell/src/mocks/helpers/problemJson.ts
import { HttpResponse } from 'msw'
import type { ZodError } from 'zod'

export function problemJson(
  status: number,
  body: { title: string; detail?: string; errors?: Array<{ path: string; code: string; message: string }> },
) {
  return HttpResponse.json(
    {
      type: `https://api.example.com/errors/${status}`,
      status,
      ...body,
    },
    { status, headers: { 'Content-Type': 'application/problem+json' } },
  )
}

export function fieldErrors(error: ZodError) {
  return error.errors.map((e) => ({
    path: e.path.join('.'),
    code: e.code,
    message: e.message,
  }))
}
```

### 20.6 Generating realistic fixtures from the same Zod schema

For GET endpoints, seed data from the schema rather than hand-rolling objects. This keeps mocks in sync when the schema changes.

```ts
// apps/shell/src/mocks/helpers/fromZodSchema.ts
import { z } from 'zod'
import { generateMock } from '@anatine/zod-mock'   // npm install -D @anatine/zod-mock

export function seedFrom<T extends z.ZodTypeAny>(schema: T, count = 1): z.infer<T>[] {
  return Array.from({ length: count }, () => generateMock(schema))
}
```

```ts
// apps/shell/src/mocks/handlers/users.ts
import { UserSchema } from '@ibc/shared/data-access/schemas/user'
import { seedFrom } from '../helpers/fromZodSchema'

const SEED_USERS = seedFrom(UserSchema, 25)

http.get('/api/users', () => HttpResponse.json(SEED_USERS))
```

### 20.7 Per-story handler overrides

For Storybook stories that need a specific backend state (empty list, server error, slow response), override handlers via `parameters.msw`:

```tsx
// libs/shared/schema-forms/src/framework/renderer/SchemaForm.stories.tsx
export const ShowsServerValidationError: Story = {
  args: { schema: SignupSchema, onSubmit: realSubmit },
  parameters: {
    msw: {
      handlers: [
        http.post('/api/users', () =>
          problemJson(422, {
            title: 'Validation failed',
            errors: [{ path: 'email', code: 'already_taken', message: 'That email is already in use.' }],
          }),
        ),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByLabelText('Email'), 'new@example.com')
    await userEvent.type(canvas.getByLabelText('Password'), 'longpassword')
    await userEvent.click(canvas.getByRole('button', { name: /submit/i }))
    await expect(canvas.getByText('That email is already in use.')).toBeVisible()
  },
}
```

This is the canonical way to prove each edge case in Section 8 without a real backend.

### 20.8 Dev and Storybook wiring

```ts
// apps/shell/src/mocks/browser.ts
import { setupWorker } from 'msw/browser'
import { userHandlers } from './handlers/users'
import { authHandlers } from './handlers/auth'
import { enumHandlers } from './handlers/enums'

export const worker = setupWorker(...userHandlers, ...authHandlers, ...enumHandlers)
```

```ts
// src/main.tsx
async function bootstrap() {
  if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/browser')
    await worker.start({ onUnhandledRequest: 'bypass' })
  }
  ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
}
bootstrap()
```

```ts
// .storybook/preview.ts
import { initialize, mswLoader } from 'msw-storybook-addon'
import { userHandlers, authHandlers, enumHandlers } from '../src/mocks'

initialize({ onUnhandledRequest: 'bypass' })

const preview: Preview = {
  loaders: [mswLoader],
  parameters: {
    msw: { handlers: [...userHandlers, ...authHandlers, ...enumHandlers] },
  },
}
export default preview
```

```ts
// vitest.setup.ts
import { server } from './apps/shell/src/mocks/server'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))  // loud in tests
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

Three environments, one handler source, one Zod schema. That's the payoff.

### 20.9 Pattern catalog -- the five mocks every form needs

Every new form ships with Storybook stories covering these five states, each backed by a small MSW override. Juniors copy the template rather than invent from scratch:

| State | Why it matters | MSW handler |
|---|---|---|
| **Happy path** | Valid submit → 201 | Default handler from `handlers/` |
| **Server validation error (per-field)** | `422` with `errors[].path` surfaces inline | `problemJson(422, { errors: [{ path: 'email', … }] })` |
| **Server validation error (form-level)** | `422` without a path → `errors['']` alert | `problemJson(422, { title: 'Your session expired.' })` |
| **Network / 500** | `ErrorBoundary` or retry surfaces | `HttpResponse.error()` or `problemJson(500, …)` |
| **Slow response** | Submit button shows loading; double-submit prevented | `await delay(2000)` before response |

Put a story per state in every form's `*.stories.tsx` file. Phase 6's exit gate should require these five; the template can live in `libs/shared/schema-forms/src/framework/testing/mockSchemas.ts`.

### 20.10 When the real backend arrives

MSW handlers are a development convenience, not a fork of the app. The transition from mocks to real backend is:

1. Backend publishes the OpenAPI spec at a stable URL.
2. Frontend runs `openapi-zod-client` → generated schemas replace the hand-written ones.
3. MSW handlers stay put. They still parse incoming requests with the *same* Zod schemas the real server validates against, so mocks and server validate identically.
4. `import.meta.env.DEV` check in `main.tsx` keeps MSW enabled locally; production bundles exclude it.
5. As endpoints go live, remove their MSW handlers one at a time. Handlers are dev-only helpers, not architecture -- deleting them does not risk production code.

The framework's schema-first architecture makes this transition cheap: validation logic lives in Zod, Zod is generated from OpenAPI, and MSW uses the same Zod. Forms don't care whether the response came from MSW or the live backend.

---

## Appendix A -- Simplicity Review and Junior-Dev Quickstart

This plan optimizes for a capability ceiling that the request describes (two engines, registry, compiled IR, mid-edit engine switching). Not every ceiling needs to be in v1, and not every concept needs to be visible to a junior dev at the call-site. This appendix calls out where the design was over-built, trims the v1 scope, and codifies the API shape a new developer should actually see.

### A.1 Is this over-engineered?

Honestly, yes -- in specific places:

| Concept in plan | Verdict | Recommendation |
|---|---|---|
| Two form engines + parity contract tests | **Defer.** Requested, but ~40% of the code and the main complexity source. | Ship **TanStack only in v1**. Keep the `FormEngine` interface as the seam, but don't build the RHF adapter or engine-switcher until a real app asks for it. The demo "engine comparison" tab becomes a v1.1 story. |
| `useEngineSwitcher` with mid-edit value preservation | **Defer.** Demo-only concern; production apps pick an engine and stay. | Move to v1.1 alongside the RHF adapter. Not in public API for v1. |
| `FormHandle.capabilities` probe | **Cut.** With one engine shipped, capabilities is dead code. | Re-introduce when the second adapter lands. |
| Dynamic `import()` of engines for code-splitting | **Cut.** Premature optimization. One engine means nothing to split. | Plain static imports. |
| Static `dependsOn` graph + cycle detection at compile time | **Cut for v1.** Real cycles are rare; runtime recursion guard is enough. | Simple `<form.Subscribe>`-style re-render when referenced paths change. |
| Max-depth compile error (`depth > 5`) | **Keep but simplify.** It's a few lines and it prevents a confusing failure mode. | Throw a plain `Error` with the offending path; skip the custom `CompileError` class. |
| Granular `exports` map, no barrels | **Keep.** Tree-shaking matters even in v1. | No change. |
| Compiled IR (`FormSpec`) | **Keep, but hide.** It is the thing that makes engine-agnosticism actually work. | Keep it internal. No consumer code imports `FormSpec`; they pass a Zod schema and get a form. |
| Field registry | **Keep.** This is the extension point juniors and seniors both need. | Ship a narrow default registry (11 field types). Override via one prop. |
| Layout DSL (`LayoutNode`) with rows/sections/dividers | **Keep, but make optional.** 95% of forms need no layout authoring -- just `col` per field. | Default layout = one row per field, responsive from `col`. Only authors who want sections or custom grids reach for `LayoutNode`. |
| `ui()` meta with `autoComplete`, `hidden`, `readOnly`, `componentProps`, etc. | **Keep, but start small.** Ship the minimum first; extend on demand. | v1 meta = `type`, `label`, `helperText`, `placeholder`, `options`, `col`. Add the rest as real schemas request them. |

Net effect: v1 is roughly the plan minus the RHF adapter, the switcher, the capability probe, dynamic imports, and the static dependency-graph analyzer. The public API and folder layout stay the same so v1.1 is additive.

### A.2 The API a junior dev sees

Two touchpoints, that's it.

**(1) Authoring a schema.** Same Zod they already use, with one extra helper:

```ts
// libs/shared/data-access/schemas/signup.ts
import { z } from 'zod'
import { ui } from '@ibc/schema-forms'

export const SignupSchema = z.object({
  email:    ui(z.string().email(),            { label: 'Email',   col: { xs: 12, md: 6 } }),
  password: ui(z.string().min(8),             { label: 'Password', col: { xs: 12, md: 6 } }),
  role:     ui(z.enum(['admin', 'member']),   { label: 'Role' }),   // select inferred
  terms:    ui(z.literal(true),               { label: 'I accept the terms' }),
})
```

Notice what is *not* required: no `type:` (inferred from the Zod node in 90% of cases), no layout, no registry. A junior writes Zod + labels and the form works.

**(2) Rendering a form.** One component:

```tsx
// apps/shell/src/pages/SignupPage.tsx
import { SchemaForm } from '@ibc/schema-forms'
import { SignupSchema } from '@ibc/shared/data-access/schemas/signup'

export function SignupPage() {
  return (
    <SchemaForm
      schema={SignupSchema}
      onSubmit={async (values) => await api.signup(values)}
    />
  )
}
```

That's the end of the mandatory surface area. `SchemaForm` handles submit, reset, validation, error display, and layout. A junior shipping a form knows exactly these two things.

### A.3 Progressive disclosure (when they need more)

Advanced knobs exist but stay opt-in. A junior only meets them when the task actually calls for it:

| Need | Additional concept | Example |
|---|---|---|
| Custom input look for one field | `componentProps` passthrough | `ui(z.string(), { label: 'Bio', componentProps: { multiline: true, rows: 4 } })` |
| Brand your own Input across the app | Registry override | `<SchemaForm registry={defaultRegistry.extend({ text: OurInput })} … />` |
| Two fields side-by-side on desktop | `col` per field | `col: { xs: 12, md: 6 }` |
| Sections, dividers, or custom grouping | Author a `LayoutNode` | Covered in Section 6.1; not needed for typical forms |
| Tabs, accordion, or custom wrapper | `kind: 'custom'` layout node + `LayoutRegistry` | Register a component, reference by name in layout. See Section 6.1 |
| Async uniqueness check | `asyncValidate` in meta | `ui(z.string().email(), { label: 'Email', asyncValidate: 'checkEmail' })` |
| Conditional field | `dependsOn` + Zod `discriminatedUnion` | Covered in Section 10.2's billing example |
| Array of repeating items | Nothing extra -- `z.array(z.object(…))` just works | `ArrayField` handles it by default |

Each of these is a single prop or a single line of meta. The mental model never requires a junior to know there is an IR, an engine adapter, or a registry lookup happening.

### A.4 The 80% form -- from zero to screen

This is the literal recipe a junior gets in the README. It should fit on one screen.

```tsx
// 1. Define the schema
import { z } from 'zod'
import { ui } from '@ibc/schema-forms'

export const ContactSchema = z.object({
  name:    ui(z.string().min(1),       { label: 'Name' }),
  email:   ui(z.string().email(),      { label: 'Email' }),
  message: ui(z.string().min(10),      { label: 'Message', componentProps: { multiline: true, rows: 4 } }),
})

// 2. Render it
import { SchemaForm } from '@ibc/schema-forms'

export function ContactPage() {
  return <SchemaForm schema={ContactSchema} onSubmit={send} />
}

async function send(values: z.infer<typeof ContactSchema>) {
  await fetch('/api/contact', { method: 'POST', body: JSON.stringify(values) })
}
```

Three imports. One schema. One component. Types flow from the schema to `send()` automatically. Validation, error display, submit handling, and accessibility are all included.

### A.5 What a junior will hit first, and how the library handles it

| First surprise | How the library responds |
|---|---|
| Forgot to add `ui(...)` wrapper | Field still renders with type inferred from Zod + label derived from the field name (camel→Title Case). `console.warn` in dev tells them the convention. |
| Used a `type` the registry doesn't know | `FallbackField` renders a visible warning Alert + a plain text input; the form still submits. Not a crash. |
| Typo in `col` breakpoint key | TypeScript catches it (`col: { xs, sm, md, lg, xl }` is a typed interface). |
| Wants to test the form | `renderWithProviders` from `@ibc/schema-forms/testing` wraps with MUI theme + QueryClient; they import it and their test works. |
| Needs to reset after submit | `<SchemaForm resetOnSuccess />` one-prop behavior. |
| Needs a custom submit button | `<SchemaForm actions={<MyActions />} />` children slot. |
| Wants to prefill from URL / server | `defaultValues={{ email: session.email }}` prop. |

The library owns the graceful-degradation edge cases so the junior doesn't have to think about them.

### A.6 Documentation we commit to shipping for juniors

Docs are not a nice-to-have; for a framework with this much abstraction, they are the actual UX. As part of v1:

- `docs/schema-forms-quickstart.md` -- the recipe in Section B.4, expanded to ~200 lines with "add a field", "add validation", "add async validation", "style one field", "test a form".
- `docs/schema-forms-cookbook.md` -- 6-8 copy-paste examples: contact form, signup, profile, nested address, repeating line items, conditional billing form, async email check, multi-step-lite (two `SchemaForm` instances).
- Inline JSDoc on `ui()`, `SchemaForm`, and each default field component, with one example each. Shows up on hover in VS Code.
- Storybook `Docs` tab for every default field with props table + "Try it" controls.
- Storybook MCP integration (already in this repo per `AGENTS.md`) means a junior's AI assistant can call `get-documentation` before using any field.

### A.7 Revised v1 scope

Taking the trims above, v1 ships:

- Core: `compile()`, `ui()`, `FieldRegistry`, `FallbackField`, errors.
- Engine: **TanStack Form only**. `FormEngine` interface present; second adapter deferred.
- Renderer: `SchemaForm`, `LayoutRenderer` (default layout for 95% of forms), `FieldRenderer`.
- Fields: `TextField`, `NumberField`, `SelectField`, `CheckboxField`, `SwitchField`, `RadioGroupField`, `DateField`, `TextareaField`, `FileUploadField`, `ObjectField`, `ArrayField`.
- Meta: `type`, `label`, `helperText`, `placeholder`, `options`, `col`, `componentProps`.
- Demo: one dashboard page with four schemas, a `StatePreview` JSON panel, and a `ValidationPanel`. **No engine toggle in v1.**
- Docs: quickstart + cookbook + JSDoc + Storybook autodocs.
- Nx packaging per Appendix B.

v1.1 (when a real user need appears):

- RHF adapter + `FormEngine` capability probe.
- `useEngineSwitcher` and engine-toggle in demo.
- `asyncValidate`, `dependsOn` full graph analysis, `hidden`, `readOnly`, `clearOnHide`.
- Dynamic `import()` engine splitting if bundle analysis shows it matters.

This shaves the plan by roughly a third while keeping every promise to the consumer intact. Most importantly, **the API a junior dev sees in v1 is the same API they see in v1.1** -- their call-sites do not change when we add the second engine, because the engine choice is an optional prop that defaults to `tanstack`.

### A.8 Sanity checks before we call v1 "junior-friendly"

Run these before shipping:

- [ ] A junior who has never seen the library can build the contact form in Section B.4 in under 10 minutes with only the quickstart open.
- [ ] Their schema has **no `type`** properties -- inference covers every field they used.
- [ ] They never import from `@ibc/schema-forms/core`, `@ibc/schema-forms/engines/*`, or any internal path. Default surface is enough.
- [ ] Every default field has a Storybook page with working Controls they can copy args from.
- [ ] When they break the schema (e.g. pass an unsupported Zod combinator), the dev-mode error names the field and tells them what to do.
- [ ] The public TypeScript surface of `@ibc/schema-forms` has fewer than 20 exported names. (IR types, engine types, and internal helpers are not exported.)

If any of those fails, the abstraction leaked and needs sanding before release.

---

## Appendix B -- Packaging as an Nx Library

Short answer: **yes**, and by design. The folder layout in Section 3 was chosen so that promotion into an Nx workspace is a move + config operation, not a rewrite. This appendix specifies exactly how.

### B.1 Target monorepo layout

Assuming the enterprise layout from `.cursor/skills/frontend-architecture/SKILL.md` (scope-first, type-tagged):

```
apps/
  shell/                               # consumer app that renders forms
  demo/                                # optional: the live dashboard from Section 10

libs/
  ibc/
    schema-forms/                      # ← the framework lives here
      src/
        lib/
          core/                        # compile, meta, registry, types, errors
          engines/
            tanstack/
            rhf/
            switcher.ts
          renderer/
          fields/                      # MUI-backed default field set
          hooks/
          testing/
        index.ts                       # public surface, no sub-barrels
      .storybook/                      # library-scoped Storybook (Section A.6)
      project.json
      package.json                     # exports map (Section A.4)
      vite.config.ts                   # buildable library config
      README.md
    ui/                                # existing atomic design system (optional, separate lib)

  shared/
    tokens/                            # design tokens + MUI theme (dependency)
    data-access/                       # optional: Zod schemas for API + forms (dependency)
```

The library name is `@ibc/schema-forms` (tag it `type:ui, scope:shared`). It depends on `@ibc/tokens` (for the MUI theme bridge) and peer-depends on `react`, `@mui/material`, `zod`, and optionally `@tanstack/react-form` / `react-hook-form`. Consumer apps install whichever engine(s) they use.

### B.2 Generate the library

```bash
# Scaffold a buildable React library inside the scope-first tree
nx g @nx/react:library libs/ibc/schema-forms \
  --bundler=vite \
  --unitTestRunner=vitest \
  --buildable \
  --importPath=@ibc/schema-forms \
  --tags="type:ui,scope:shared" \
  --component=false \
  --directory=libs/ibc/schema-forms
```

Flags that matter:

- `--bundler=vite` aligns with the rest of the stack and produces an ESM-first output with type declarations.
- `--buildable` creates a `build` target. Use `--publishable --importPath=@ibc/schema-forms` instead if you plan to publish to npm or a private registry.
- `--component=false` suppresses the default `<SchemaForms>` stub -- the framework exposes `<SchemaForm>` from its own folder.
- `--tags` are enforced by `@nx/enforce-module-boundaries` so apps can import the library only when their scope permits.

### B.3 `project.json` targets

```jsonc
{
  "name": "ibc-schema-forms",
  "$schema": "../../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "libs/ibc/schema-forms/src",
  "projectType": "library",
  "tags": ["type:ui", "scope:shared"],
  "targets": {
    "build": {
      "executor": "@nx/vite:build",
      "options": {
        "outputPath": "dist/libs/ibc/schema-forms",
        "main": "libs/ibc/schema-forms/src/index.ts",
        "tsConfig": "libs/ibc/schema-forms/tsconfig.lib.json",
        "assets": ["libs/ibc/schema-forms/*.md"]
      }
    },
    "lint":   { "executor": "@nx/eslint:lint" },
    "test":   { "executor": "@nx/vite:test",
                "options": { "config": "libs/ibc/schema-forms/vite.config.ts" } },
    "storybook": {
      "executor": "@nx/storybook:storybook",
      "options": { "port": 6007, "configDir": "libs/ibc/schema-forms/.storybook" }
    },
    "build-storybook": {
      "executor": "@nx/storybook:build",
      "options": { "outputDir": "dist/storybook/ibc-schema-forms",
                   "configDir": "libs/ibc/schema-forms/.storybook" }
    },
    "typecheck": { "executor": "nx:run-commands",
                   "options": { "command": "tsc -p libs/ibc/schema-forms/tsconfig.lib.json --noEmit" } }
  }
}
```

### B.4 `package.json` exports (granular, no barrels)

Per Section 1 of the architecture skill, expose specific entry points instead of a single barrel. This keeps tree-shaking intact even though the library ships both engines and the full default field set:

```jsonc
{
  "name": "@ibc/schema-forms",
  "version": "0.1.0",
  "sideEffects": false,
  "type": "module",
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "@mui/material": "^7.0.0",
    "@emotion/react": "^11.0.0",
    "@emotion/styled": "^11.0.0",
    "zod": "^3.22.0"
  },
  "peerDependenciesMeta": {
    "@tanstack/react-form": { "optional": true },
    "@tanstack/zod-form-adapter": { "optional": true },
    "react-hook-form": { "optional": true },
    "@hookform/resolvers": { "optional": true }
  },
  "exports": {
    ".":                  "./src/index.ts",                       // <SchemaForm>, types, default registry
    "./core":             "./src/lib/core/index.ts",              // compile, ui(), errors, types
    "./registry":         "./src/lib/core/registry.ts",
    "./engines/tanstack": "./src/lib/engines/tanstack/index.ts",  // opt-in
    "./engines/rhf":      "./src/lib/engines/rhf/index.ts",       // opt-in
    "./fields":           "./src/lib/fields/index.ts",            // default MUI fields
    "./testing":          "./src/lib/testing/index.ts"            // renderWithProviders, mock schemas
  }
}
```

Consumers pull what they need:

```ts
import { SchemaForm, ui } from '@ibc/schema-forms'
import { tanstackEngine } from '@ibc/schema-forms/engines/tanstack'
import { MyBrandedTextField } from '@ibc/schema-forms/fields'
```

The two engines are behind their own subpath exports so if an app only installs `@tanstack/react-form` it never pulls `react-hook-form` into its bundle, and vice versa. The `peerDependenciesMeta` block marks both engines optional so `npm install @ibc/schema-forms` does not warn when only one is installed.

### B.5 Module boundary tags

Add these constraints to `eslint.config.mjs` (the skill already defines the structure; `schema-forms` slots in under `type:ui, scope:shared`):

```ts
{ sourceTag: 'type:ui', onlyDependOnLibsWithTags: ['type:ui', 'type:util'] },
{ sourceTag: 'scope:shared', onlyDependOnLibsWithTags: ['scope:shared'] },
```

Consequences:

- `@ibc/schema-forms` may import `@ibc/tokens` (`scope:shared, type:util`) but **not** from any `scope:shell` or `scope:agent` lib. This keeps the framework genuinely shared.
- Apps of any scope may depend on it, because apps have `type:app` which dep-constraints allow to consume shared `type:ui` libs.
- `@ibc/schema-forms` may import `@ibc/ui` (the atomic design system) if you want shared atoms as the fallback for custom field components. Keep that dep one-way and optional.

### B.6 Library-scoped Storybook

Each library gets its own Storybook instance (the skill endorses Storybook composition across the monorepo):

```
libs/ibc/schema-forms/.storybook/
  main.ts       # stories glob: '../src/**/*.stories.@(ts|tsx)'
  preview.ts    # imports @ibc/tokens CSS + MUI ThemeProvider + MSW loader
  theme.ts
```

Root workspace `.storybook/main.ts` composes library Storybooks via `refs`, so `nx storybook shell` opens a combined UI showing `ibc/ui` + `ibc/schema-forms` + feature Storybooks.

Run isolated during development:

```bash
nx storybook ibc-schema-forms         # port 6007
nx run ibc-schema-forms:test          # vitest watch
nx run ibc-schema-forms:build         # emit dist/
```

### B.7 Publishable vs. buildable

Pick one up front; switching later is a small config change but noisy in git.

| Mode | When to use | Effect |
|------|-------------|--------|
| **Buildable** | Monorepo-only consumption. Apps import via TS path alias; Nx caches the build output. | `nx build ibc-schema-forms` produces `dist/libs/ibc/schema-forms` used by app bundlers during dev and build. No version bumps. |
| **Publishable** | Cross-repo or open-sourcing. | Same as buildable, plus `release` target wiring (nx release / changesets) that publishes `@ibc/schema-forms` to a registry with semver versioning and a CHANGELOG. |

Start buildable. If a second repo needs it, promote to publishable with `nx g @nx/react:library ... --publishable --importPath=@ibc/schema-forms` applied as a patch to `package.json` + add `nx release` config.

### B.8 Consumer wiring (app side)

In the consuming app (`apps/shell`), installation is transparent because Nx links the workspace package:

```tsx
// apps/shell/src/pages/SignupPage.tsx
import { SchemaForm } from '@ibc/schema-forms'
import { SignupSchema } from '@ibc/shared/data-access/schemas/signup'

export function SignupPage() {
  return (
    <SchemaForm
      schema={SignupSchema}
      engine="tanstack"
      onSubmit={async (values) => api.signup(values)}
    />
  )
}
```

`@ibc/shared/data-access` hosts the Zod schemas that back both forms (via `@ibc/schema-forms`) and API response validation (via `@ibc/shared/data-access`). Section 8 of the skill already enforces this "one schema, shared for form + API" pattern; `schema-forms` just consumes whatever schemas live there.

### B.9 Affected graph

Because the library is a first-class Nx project, the affected graph reacts correctly:

- A change in `libs/ibc/schema-forms/src/lib/core/compile.ts` invalidates `ibc-schema-forms`, any app importing it (`shell`, `agent`, `demo`), and every feature library that transitively depends on those apps.
- `nx affected -t lint test build` in CI runs only those projects.
- `nx graph` renders `ibc-schema-forms` as a node with edges to `ibc-tokens`, `shared-data-access`, and downstream consumers.

### B.10 Migration from the single-package scaffold

If Phase 0-8 of Section 13 have already been executed in the current single-package repo and you later want to promote the code into an Nx monorepo:

1. `npx create-nx-workspace@latest ibc --preset=apps` in a sibling directory.
2. `nx g @nx/react:library libs/ibc/schema-forms --importPath=@ibc/schema-forms --buildable --bundler=vite --unitTestRunner=vitest --tags=type:ui,scope:shared --component=false`.
3. Move `libs/shared/schema-forms/src/framework/*` → `libs/ibc/schema-forms/src/lib/*` (one-to-one; no restructuring required).
4. Update relative imports: inside the lib use relative paths; across libs use `@ibc/*` path aliases from `tsconfig.base.json`.
5. Copy `libs/shared/schema-forms/src/framework/*.stories.tsx` in place; wire the library Storybook from Section A.6.
6. Port `apps/shell/src/*` to `apps/demo/src/` (or fold into `apps/shell` as a showcase route).
7. Convert the `SignupSchema` / `ProfileSchema` etc. to live in `libs/shared/data-access/schemas/` so both forms and APIs consume them.
8. Update `package.json` exports per Section A.4.
9. Add tags + boundary constraints; run `nx lint` and fix violations until clean.
10. `nx affected -t lint test build storybook` green → done.

Because the single-package scaffold mirrors the lib's internal folder layout (core/engines/renderer/fields/hooks/testing), step 3 is a `git mv` tree, not a rewrite. No import paths above the `framework/` boundary need to change: `@/framework/*` becomes `@ibc/schema-forms`.

### B.11 Acceptance checklist for the Nx packaging

- [ ] `nx build ibc-schema-forms` emits a tree-shakeable ESM dist with `.d.ts` files.
- [ ] `nx test ibc-schema-forms` runs unit + engine-parity contract tests green.
- [ ] `nx storybook ibc-schema-forms` serves stories on :6007 with a11y addon clean.
- [ ] `nx lint ibc-schema-forms` passes with module-boundary constraints active.
- [ ] A consumer app can `import { SchemaForm } from '@ibc/schema-forms'` and `import { tanstackEngine } from '@ibc/schema-forms/engines/tanstack'` with zero barrel imports.
- [ ] Installing only one of the two form engines in the app still builds (peer meta `optional: true`).
- [ ] `nx graph` shows `ibc-schema-forms` as a shared node depended on by shell/agent/demo apps, with no inbound edges from scope-specific libs.

---

## Appendix C -- MUI v7 as the v1 Target (React 18)

Short answer: **MUI v7 is the correct v1 target.** The consuming app is on React 18; MUI v7 is the latest major that fully supports React 18. MUI v9 targets React 19 and can be adopted when/if the app moves to React 19. Design tokens from `libs/shared/tokens/` are bridged into the MUI theme via `createTheme({ cssVariables: true })`.

### C.0 Why v7 on React 18

Three concrete reasons:

1. **MUI v7 is the latest stable major supporting React 18.** MUI v9 (April 2026) targets React 19 as its primary React line. Since we are on React 18, v7 gives us the newest features without a React major upgrade.
2. **`forwardRef` is still the standard pattern on React 18.** Field components use `forwardRef` for ref passing. When React 19 is adopted, this can be simplified to plain `ref` props.
3. **`cssVariables: true` is supported in v7.** Our theme bridge from design tokens works identically on v7 and v9. The `cssVariables` flag was introduced in v6.

Starting on v7 means we get:

- `slots` + `slotProps` API (the modern replacement for `component`/`componentsProps`).
- `cssVariables: true` for CSS custom property integration with our design tokens.
- Grid v2 (`size={{ xs, sm, md, lg, xl }}`) for responsive layouts.
- Full `sx` prop support for one-off styling.

### C.1 What this means for the framework

| Concern | On MUI v7 + React 18 |
|---|---|
| Default field components | Wrap MUI v7 primitives (`TextField`, `Select`, `Checkbox`, etc.) |
| `NumberField` | `TextField type="number"` (Base UI `NumberField` primitive is a v9+ feature) |
| Layout | MUI Grid v2 + `sx` prop |
| Theme bridge | `createTheme({ cssVariables: true })` bridges design tokens from `libs/shared/tokens/` |
| `ref` in field components | `forwardRef` pattern (standard for React 18) |
| Memoization | Manual `useMemo`/`useCallback` where profiling shows need (React Compiler is React 19+) |

### C.2 Why the design absorbs MUI version changes cleanly

Three choices in Sections 5-7 make version churn absorbable:

1. **We don't re-export MUI components.** Every default field is a *wrapper* around MUI primitives. Consumers import `TextField` from `@ibc/schema-forms/fields`, not `@mui/material`. A major MUI bump touches ~10 files in `libs/shared/schema-forms/src/framework/fields/*`, not the consuming app's call-sites.
2. **Styling is theme + `sx`, never deprecated `@mui/system` layout props.** Grid v2 and `sx` are the long-term MUI API. Safe across v7 → v9.
3. **The `FieldBinding` contract is MUI-free.** `{ value, onChange, onBlur, error, touched, dirty, isValidating, name }` is a plain shape. Swapping the rendering layer doesn't touch the engine adapters, the compile step, or the registry.

### C.3 Version matrix

| MUI line | React | Zod | TanStack Form | Framework status |
|---|---|---|---|---|
| **v7.x** | **18.x** | **3.x** (4.x tracked) | **1.x** | **v1 primary target.** Ships here. Uses Grid v2, `cssVariables`, `slots`+`slotProps`. |
| v9.x | 19.x | 3.x | 1.x | **Future upgrade path.** Unlocks Base UI `NumberField`, `color-mix()` derived colors, React Compiler, ~3% smaller bundle. |
| v6.x | 18.x | 3.x | 0.x - 1.x | Best-effort downlevel. Not tested in CI. |

### C.4 Peer-dep declaration

```jsonc
{
  "peerDependencies": {
    "react":            "^18.0.0",
    "react-dom":        "^18.0.0",
    "@mui/material":    ">=6.0.0 <10.0.0",
    "@emotion/react":   "^11.0.0",
    "@emotion/styled":  "^11.0.0",
    "zod":              ">=3.22.0 <5.0.0"
  },
  "peerDependenciesMeta": {
    "@tanstack/react-form":       { "optional": true },
    "@tanstack/zod-form-adapter": { "optional": true },
    "react-hook-form":            { "optional": true },
    "@hookform/resolvers":        { "optional": true }
  }
}
```

**Dev dependencies in the library** resolve to the primary line so we develop, test, and build Storybook against v7 + React 18:

```jsonc
{
  "devDependencies": {
    "react":               "^18.3.0",
    "react-dom":           "^18.3.0",
    "@mui/material":       "^7.0.0",
    "@mui/icons-material": "^7.0.0"
  }
}
```

### C.5 MUI installation as part of Phase 0

MUI is not currently installed in the repo. Installation is part of Phase 0 (Foundations), not a separate phase:

```bash
pnpm add @mui/material@^7 @mui/icons-material@^7 @emotion/react@^11 @emotion/styled@^11
```

Then:
- Create `libs/shared/schema-forms/src/framework/tokens/mui-theme.ts` bridging `libs/shared/tokens/src/tokens/design-tokens.css` into `createTheme({ cssVariables: true, colorSchemes: { light, dark } })`.
- Wrap the app with `<ThemeProvider theme={theme}><CssBaseline />…</ThemeProvider>`.
- Wrap Storybook via `.storybook/preview.ts` using `withThemeFromJSXProvider`.

### C.6 Future upgrade path to MUI v9 + React 19

When the app is ready to move to React 19, the upgrade path is:

1. Bump React: `pnpm add react@^19 react-dom@^19`.
2. Remove `forwardRef` wrappers from field components (React 19 makes `ref` a regular prop).
3. Install React Compiler: `pnpm add -D babel-plugin-react-compiler` → remove manual memoization.
4. Bump MUI: `pnpm add @mui/material@^9 @mui/icons-material@^9`.
5. Run MUI codemod: `npx @mui/codemod@latest v9.0.0/preset-safe libs/`.
6. Swap `NumberField` to wrap Base UI `NumberField` primitive (better a11y + keyboard handling).
7. Remove `MuiTouchRipple` theme overrides if any.

The framework's public API does not change with this upgrade. Consumer call-sites are isolated by our field wrappers.

### C.7 Summary

- **v1 targets MUI v7 + React 18.** This matches the current app stack.
- **MUI install + theme wiring is part of Phase 0**, not a separate prerequisite phase.
- **Design tokens bridge into MUI theme** via `createTheme({ cssVariables: true })`.
- **Future React 19 + MUI v9 upgrade** is additive -- unlocks React Compiler, Base UI `NumberField`, `color-mix()` derived colors, 30% faster `sx`, improved Roving TabIndex.
- **The framework's public API does not change with MUI version.** Consumer call-sites are isolated by field wrappers.
