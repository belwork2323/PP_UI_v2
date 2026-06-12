# PP-Schema UI Standard v1

**Version:** 1.0  
**Status:** Specification (renderer implementation pending)  
**Audience:** Backend schema builders, frontend `schemaManagement` module

This document defines the **single canonical format** for schema-driven manufacturing forms in PP-UI. All modules (raw material prep, case preparation, casting, curing, mock trial, etc.) should converge on this structure.

---

## Table of contents

1. [Design principles](#1-design-principles)
2. [Root document](#2-root-document)
3. [SchemaNode (universal node)](#3-schemanode-universal-node)
4. [Component catalog](#4-component-catalog)
5. [Style block (CSS / design tokens)](#5-style-block-css--design-tokens)
6. [Layout block](#6-layout-block)
7. [Behavior block (dynamic rows, columns, cycles)](#7-behavior-block-dynamic-rows-columns-cycles)
8. [DataSource (dropdowns)](#8-datasource-dropdowns)
9. [Visibility rules](#9-visibility-rules)
10. [Validation](#10-validation)
11. [Runtime values & submission](#11-runtime-values--submission)
12. [Naming conventions](#12-naming-conventions)
13. [Schema fetch request envelope](#13-schema-fetch-request-envelope)
14. [Examples](#14-examples)
15. [Appendix A: Legacy → v1 mapping](#appendix-a-legacy--v1-mapping)
16. [Appendix B: Future UI refactoring roadmap](#appendix-b-future-ui-refactoring-roadmap)

---

## 1. Design principles

| Principle | Description |
|-----------|-------------|
| **One node shape** | Sections, fields, columns, and repeatable blocks all use `SchemaNode`. The `component` property selects the renderer. |
| **Semantic tokens** | Colors, spacing, icons, and typography use named tokens (`primary`, `md`, `thermostat`). Raw hex/px only when necessary via `style.sx`. |
| **Declarative behavior** | Add/delete rows, cycles, and columns are configuration — not hardcoded per module. |
| **Stable IDs** | `id` is the persistence key in saved form data. Labels may change freely. |
| **Backward compatibility** | Legacy API shapes (`fieldId`, `sectionName`, `tables[]`) normalize into v1 via a future `normalizeToV1()` layer. |

```
Backend Schema Builder
        │
        ▼
   PP-Schema v1 (data.nodes[])
        │
        ▼
  normalizeToV1()  ◄── Legacy aliases (optional)
        │
        ▼
  ComponentRegistry → SchemaNodeRenderer
        ▲
  resolveDesignTokens()
```

---

## 2. Root document

**All schema documents use the same envelope.** UI content lives inside `data`; identification fields stay at the root.

### Schema envelope (required for every module)

```json
{
  "schemaVersion": "1.0",
  "schemaType": "CURING",
  "functionality": "CREATE_CURING_FORM",
  "data": {
    "layout": {
      "type": "flat",
      "gap": "md",
      "sectionVariant": "card"
    },
    "designSystem": { },
    "meta": { },
    "context": { },
    "nodes": [ ]
  }
}
```

### HTTP response wrapper (API fetch)

When returned from a schema endpoint, the same envelope is nested inside the standard API response:

```json
{
  "success": true,
  "statusCode": 200,
  "schemaVersion": "1.0",
  "schemaType": "CURING",
  "functionality": "CREATE_CURING_FORM",
  "message": "Schema fetched successfully",
  "timestamp": "2026-06-05T10:00:00Z",
  "data": {
    "layout": { "type": "flat", "gap": "md", "sectionVariant": "card" },
    "designSystem": { },
    "meta": { },
    "context": { },
    "nodes": [ ]
  }
}
```

`schemaVersion`, `schemaType`, and `functionality` may appear at both the HTTP root and inside `data` for backward compatibility; the UI normalizer reads root first, then `data`.

### Root-level properties

| Property | Required | Description |
|----------|----------|-------------|
| `schemaVersion` | Yes | Spec version. Use `"1.0"` for PP-Schema v1. |
| `schemaType` | Yes | Domain identifier: `RAW_MATERIALS`, `CASE_PREPARATION`, `CASTING`, `CURING`, `MOCK_TRIAL`, etc. |
| `functionality` | Yes | Action key, e.g. `CREATE_CURING_FORM`. |
| `data` | Yes | Payload object — see below. |

### `data` payload properties

| Property | Required | Description |
|----------|----------|-------------|
| `data.layout` | No | Page-level layout. Default: `{ "type": "flat" }`. |
| `data.designSystem` | No | Document-level design tokens. Cascades to all nodes. |
| `data.meta` | No | Title, description (shown when `data.nodes` is empty). |
| `data.context` | No | Non-UI metadata (`motorStage`, `subDepartmentId`, `batchType`). |
| `data.nodes` | Yes | Top-level array of `SchemaNode` trees. |

All schema endpoints must return `data.nodes[]`. The UI normalizer accepts PP-Schema v1 only.

### `data.designSystem`

```json
{
  "colors": {
    "primary": "#1565C0",
    "primaryLight": "#1976D2",
    "surface": "#F4F6F8",
    "border": "#D5D8DC",
    "text": "#1C2833",
    "textSub": "#5D6D7E",
    "danger": "#C62828",
    "success": "#2E7D32",
    "warn": "#D4AC0D"
  },
  "typography": {
    "fontFamily": "'DM Sans', sans-serif",
    "scale": {
      "xs": "0.68rem",
      "sm": "0.78rem",
      "md": "0.86rem",
      "lg": "0.98rem"
    },
    "label": {
      "size": "xs",
      "weight": 700,
      "transform": "uppercase",
      "letterSpacing": "0.04em"
    }
  },
  "spacing": { "xs": 4, "sm": 8, "md": 12, "lg": 16, "xl": 24 },
  "radius": { "sm": 7, "md": 11, "lg": 16 },
  "icons": {
    "sectionDefault": "description",
    "casting": "precision_manufacturing",
    "curing": "thermostat"
  }
}
```

Document-level `data.designSystem` overrides app defaults. Child nodes may override individual tokens in their `style` block.

### `data.meta`

```json
{
  "title": "Case Preparation",
  "description": "Schema for this batch type is not yet configured."
}
```

Use when `data.nodes` is empty to show a placeholder screen instead of a blank form.

### `data.context`

```json
{
  "motorStage": 1,
  "subDepartmentId": 111,
  "batchType": "MAIN_BATCH"
}
```

Not rendered directly. Used for schema fetch requests and `{{token}}` injection in API dropdowns.

---

## 3. SchemaNode (universal node)

Every UI element is a node:

```json
{
  "id": "TEMPERATURE",
  "component": "field",
  "fieldType": "number",
  "label": "Temperature",
  "unit": "°C",
  "required": true,
  "style": { "colSpan": { "xs": 12, "sm": 6, "md": 4 } },
  "layout": { "order": 2 },
  "behavior": { },
  "validation": { "min": 0, "max": 200 },
  "visibility": { "when": [{ "field": "STATION", "op": "NOT_EMPTY" }], "logic": "AND" },
  "dataSource": null,
  "children": []
}
```

### Node properties

| Property | Required | Description |
|----------|----------|-------------|
| `id` | Yes* | Stable persistence key. *Auto-increment columns use `srNo`. |
| `component` | Yes | Renderer selector (see [§4](#4-component-catalog)). |
| `fieldType` | When `component` is `field` or `column` | Input control type. |
| `label` | Recommended | Visible title / column header. |
| `unit` | No | Appended to label, e.g. `Temperature (°C)`. |
| `required` | No | Shows required indicator; validated on submit. |
| `style` | No | Visual and placement tokens ([§5](#5-style-block-css--design-tokens)). |
| `layout` | No | Grid/flex placement within parent ([§6](#6-layout-block)). |
| `behavior` | No | Dynamic rows/columns/cycles ([§7](#7-behavior-block-dynamic-rows-columns-cycles)). |
| `validation` | No | Min, max, pattern ([§10](#10-validation)). |
| `visibility` | No | Conditional show/hide ([§9](#9-visibility-rules)). |
| `dataSource` | No | Static or API dropdown options ([§8](#8-datasource-dropdowns)). |
| `children` | No | Nested nodes (sections, columns, groups). |
| `groupKey` | No | For `nestedGroup`: `"lots"` or `"drums"`. |

---

## 4. Component catalog

### 4.1 Field primitives

`component: "field"` (or `component: "column"` inside tables).

| `fieldType` | UI control | Stored value format |
|-------------|------------|---------------------|
| `text` | Single-line input | `string` |
| `number` | Number input | `string` |
| `decimal` | Number input | `string` |
| `textarea` | Multiline input | `string` |
| `date` | Date picker | `DD-MM-YYYY` |
| `time` | Time picker | `HH:mm` |
| `datetime` | Date-time picker | `DD-MM-YYYY HH:mm` |
| `dropdown` | Select (static or API) | option `value` |
| `radio` | Radio group | `string` (defaults: `yes` / `no` if no options) |
| `file` | File input | comma-separated filenames |
| `formula` | Read-only computed | auto-calculated `string` |
| `autoIncrement` | Read-only serial number | number (key: `srNo`) |
| `dynamic` | Type resolved per table row | see row `fieldType` |

### 4.2 Container primitives

| `component` | Purpose |
|-------------|---------|
| `section` | Titled card wrapping `children` (fields, tables, groups). |
| `group` | Bordered container with nested `children`. |
| `stack` | Flex list of children (`layout.direction`: `row` \| `column`). *Renderer: future.* |
| `grid` | Responsive grid of children. *Renderer: future.* |

### 4.3 Data primitives

| `component` | Purpose |
|-------------|---------|
| `table` | Editable data table. `children` are `column` and `columnGroup` nodes. |
| `column` | Single table column definition. |
| `columnGroup` | Grouped table header with nested `column` children. |
| `repeatable` | Repeatable block (cycles). Contains one `table` child. `behavior.repeat.mode: "cycle"`. |
| `dynamicGroup` | Repeatable flat field rows. `behavior.repeat.mode: "group"`. |
| `nestedGroup` | Lots/drums-style grouped fields with `groupKey`. |

### 4.4 Display primitives

*Spec'd now; renderer may implement later.*

| `component` | Purpose |
|-------------|---------|
| `header` | Non-editable title row inside a table. |
| `divider` | Visual separator between sections. |
| `alert` | Info/warning banner. |
| `badge` | Read-only status chip. |

### 4.5 Component tree patterns

**Form section (flat fields):**
```
section
  └── field (text)
  └── field (dropdown)
  └── field (date)
```

**Table:**
```
section
  └── table
        ├── column (autoIncrement → srNo)
        ├── columnGroup
        │     ├── column (number)
        │     └── column (number)
        └── column (formula)
```

**Repeatable curing cycles:**
```
section
  └── repeatable  [behavior.repeat.mode: "cycle"]
        └── table
              ├── column (autoIncrement)
              ├── column (number)
              └── column (date)
```

**Form + table in one section:**
```
section
  ├── field (config fields)
  └── table (measurement rows)
```

---

## 5. Style block (CSS / design tokens)

Prefer semantic tokens. Use `style.sx` only for edge cases.

```json
{
  "variant": "card",
  "density": "comfortable",
  "icon": "thermostat",
  "iconPosition": "left",
  "iconColor": "primary",
  "color": "text",
  "background": "surface",
  "border": true,
  "borderColor": "border",
  "borderRadius": "md",
  "shadow": "sm",
  "padding": "md",
  "gap": "sm",
  "fontSize": "sm",
  "fontWeight": 700,
  "textAlign": "left",
  "width": "180px",
  "minWidth": "120px",
  "maxWidth": "320px",
  "colSpan": { "xs": 12, "sm": 6, "md": 4 },
  "rowSpan": 1,
  "flex": "1 1 180px",
  "sx": { }
}
```

### Style property reference

| Property | Values | Description |
|----------|--------|-------------|
| `variant` | `card`, `plain`, `outlined` | Section container style. |
| `density` | `compact`, `comfortable` | Input/row padding scale. |
| `icon` | Material icon name | e.g. `thermostat`, `precision_manufacturing`. |
| `iconPosition` | `left`, `right` | Icon placement relative to label. |
| `iconColor` | color token | e.g. `primary`, `textSub`. |
| `color` | color token | Text color. |
| `background` | color token | Background fill. |
| `border` | `boolean` | Show border. |
| `borderColor` | color token | Border color. |
| `borderRadius` | `sm`, `md`, `lg` | Corner radius from `designSystem.radius`. |
| `shadow` | `none`, `sm` | Box shadow. |
| `padding` | spacing token | Internal padding. |
| `gap` | spacing token | Gap between children. |
| `fontSize` | typography scale | `xs`, `sm`, `md`, `lg`. |
| `fontWeight` | number | e.g. `400`, `700`. |
| `textAlign` | `left`, `center`, `right` | Text alignment. |
| `width` | CSS width | e.g. `100%`, `180px`, `auto`. |
| `minWidth` | CSS width | Minimum width. |
| `maxWidth` | CSS width | Maximum width. |
| `colSpan` | `{ xs, sm, md, lg }` | Responsive grid columns (12-col grid). |
| `rowSpan` | number | Grid row span. |
| `flex` | CSS flex shorthand | e.g. `1 1 180px`. |
| `sx` | object | MUI-compatible override (escape hatch). |

### Schema builder rules

1. Use color/spacing token names from `designSystem` — not raw hex unless branding requires it.
2. Icons must be valid [Material Icons](https://mui.com/material-ui/material-icons/) names.
3. Label styling inherits `designSystem.typography.label` unless overridden per node.
4. Table column `style.width` sets column min-width in the table header.

---

## 6. Layout block

### Page-level (`layout` on root)

```json
{
  "type": "flat",
  "gap": "md",
  "sectionVariant": "card"
}
```

| `layout.type` | Behavior |
|---------------|----------|
| `flat` | Vertical stack of section cards (current default). |
| `tabs` | Each top-level `section` node becomes a tab. *Future.* |
| `accordion` | Collapsible section panels. *Future.* |
| `wizard` | Step-by-step sections. *Future.* |

### Node-level (`layout` on SchemaNode)

```json
{
  "direction": "row",
  "gap": "md",
  "wrap": true,
  "alignItems": "flex-end",
  "justifyContent": "flex-start",
  "columns": 12,
  "order": 1,
  "sticky": false
}
```

| Property | Values | Description |
|----------|--------|-------------|
| `direction` | `row`, `column` | Flex direction for `stack` / `section` children. |
| `gap` | spacing token | Gap between child nodes. |
| `wrap` | boolean | Allow flex wrap. |
| `alignItems` | flex align value | Cross-axis alignment. |
| `justifyContent` | flex justify value | Main-axis alignment. |
| `columns` | number | Grid column count (default 12). |
| `order` | number | Render order within parent. |
| `sticky` | boolean | Sticky header/footer. *Future.* |

---

## 7. Behavior block (dynamic rows, columns, cycles)

```json
{
  "repeat": {
    "enabled": true,
    "mode": "cycle",
    "min": 1,
    "max": 20,
    "defaultCount": 1,
    "allowAdd": true,
    "allowDelete": true,
    "labelPattern": "Cycle {index}",
    "addLabel": "Add Cycle",
    "deleteLabel": "Remove"
  },
  "table": {
    "defaultRows": 10,
    "minRows": 0,
    "maxRows": 100,
    "allowAddRow": true,
    "allowDeleteRow": true,
    "allowAddColumn": false,
    "allowDeleteColumn": false,
    "autoIncrementKey": "srNo"
  },
  "readonly": false,
  "formula": {
    "expression": "aMock - bMock",
    "dependencies": ["aMock", "bMock"]
  }
}
```

### `behavior.repeat`

| Property | Description |
|----------|-------------|
| `enabled` | Enable repeatable behavior. |
| `mode` | `cycle` (repeatable-table), `row` (table add-row), `group` (dynamic-group). |
| `min` / `max` | Minimum / maximum instances. |
| `defaultCount` | Initial instance count. |
| `allowAdd` / `allowDelete` | Show add/remove controls. |
| `labelPattern` | Instance label. `{index}` is 1-based. |
| `addLabel` / `deleteLabel` | Button labels. |

### `behavior.table`

| Property | Description |
|----------|-------------|
| `defaultRows` | Initial row count (pre-filled empty rows). |
| `minRows` / `maxRows` | Row count limits. |
| `allowAddRow` / `allowDeleteRow` | Row add/delete controls. |
| `allowAddColumn` / `allowDeleteColumn` | Column add/delete. *Spec only; renderer future.* |
| `autoIncrementKey` | Serial number field key (default `srNo`). |

### `behavior.formula`

| Property | Description |
|----------|-------------|
| `expression` | Arithmetic expression using row field keys, e.g. `aMock - bMock`. |
| `dependencies` | Field keys referenced (documentation / validation). |

Formula columns are read-only. The UI recalculates on dependency change.

### Preset table rows

For read-only label rows inside tables, include in `behavior.table.presetRows`:

```json
{
  "presetRows": [
    { "type": "header", "label": "Important Measurements" },
    { "readonly": true, "parameter": "Fixed label", "value": "preset text" }
  ]
}
```

| Row property | Effect |
|--------------|--------|
| `type: "header"` | Full-width section header row. |
| `readonly: true` | Cells in `value` / `parameter` columns are display-only. |
| `fieldType` on row | Used when column `fieldType` is `dynamic`. |

---

## 8. DataSource (dropdowns)

### Static options

```json
{
  "type": "static",
  "options": [
    "ON",
    "OFF",
    "NOT_APPLICABLE"
  ]
}
```

Or labeled options:

```json
{
  "type": "static",
  "options": [
    { "label": "Single", "value": "Single" },
    { "label": "Pair", "value": "Pair" }
  ]
}
```

### API options

```json
{
  "type": "api",
  "api": {
    "endpoint": "BUILDING_MASTER",
    "method": "POST",
    "requestBody": {
      "subDepartmentId": "{{subDepartmentId}}",
      "batchId": "{{batchId}}"
    },
    "responsePath": "data.buildings",
    "displayKey": "buildingName",
    "valueKey": "buildingId"
  }
}
```

### Known endpoint aliases

| Alias | Resolves to |
|-------|-------------|
| `casting-station` | Casting station list (GET) |
| `material-lots` | Material lots (POST) |
| `BUILDING_MASTER` | Building master (configure in `schemaApiDataSource`) |

### Template injection

`{{subDepartmentId}}` and `{{batchId}}` are replaced at runtime from form `apiContext`.

---

## 9. Visibility rules

```json
{
  "when": [
    { "field": "CASTING_TYPE", "op": "EQ", "value": "Pair" },
    { "field": "STATION", "op": "NOT_EMPTY" }
  ],
  "logic": "AND"
}
```

### Operators

| `op` | Aliases | True when |
|------|---------|-----------|
| `EQ` | `EQUAL`, `EQUALS` | Field value equals `value`. |
| `NEQ` | `NOT_EQUAL`, `NOT_EQ` | Field value does not equal `value`. |
| `EMPTY` | `IS_EMPTY` | Field value is blank. |
| `NOT_EMPTY` | `IS_NOT_EMPTY` | Field value is not blank. |
| `IN` | — | Field value is in `value` array. |

### Logic

| `logic` | Behavior |
|---------|----------|
| `AND` | All conditions must pass (default). |
| `OR` | Any condition passes. |

Visibility context is built from all form field values (flat merge across sections). Hidden field values are cleared on change.

---

## 10. Validation

```json
{
  "required": true,
  "min": 0,
  "max": 200,
  "pattern": "^[A-Z0-9-]+$",
  "message": "Enter a valid motor ID"
}
```

| Property | Applies to |
|----------|------------|
| `required` | All field types |
| `min` / `max` | `number`, `decimal` |
| `pattern` | `text` (regex) |
| `message` | Custom error message |

Node-level `required: true` is shorthand for `validation.required: true`.

---

## 11. Runtime values & submission

### Runtime form state

Values are keyed by node `id`:

```json
{
  "POST_CURING_DETAILS": [
    {
      "OTHER_OBSERVATIONS": "None",
      "SHORE_A_HARDNESS": "72"
    }
  ],
  "CURING_CYCLES": [
    {
      "_cycleKey": "cycle-1",
      "rows": [
        {
          "srNo": 1,
          "TEMPERATURE": "65",
          "DURATION": "120",
          "START_DATE": "05-06-2026",
          "START_TIME": "09:00"
        }
      ]
    }
  ]
}
```

### Value shape by component

| Component | Runtime shape |
|-----------|---------------|
| `section` + `field` children | `{ [nodeId]: [ { fieldKey: value, ... } ] }` — single object in array |
| `table` | `{ [nodeId]: [ row, row, ... ] }` |
| `repeatable` | `{ [nodeId]: [ { _cycleKey, rows: [...] }, ... ] }` |
| `dynamicGroup` | `{ [nodeId]: [ row, row, ... ] }` |
| `nestedGroup` | `{ [nodeId]: [ groupRow, ... ] }` |

### Submission payload

```json
{
  "schemaVersion": "1.0",
  "schemaType": "CURING",
  "sections": [
    {
      "sectionId": "CURING_CYCLES",
      "sectionData": [ ]
    },
    {
      "sectionId": "POST_CURING_DETAILS",
      "sectionData": [ ]
    }
  ]
}
```

`sectionId` in submissions equals node `id` for backward compatibility.

### Per-motor wrapping (case preparation)

```json
{
  "motors": [
    {
      "motorId": "MTR-A-001",
      "prrcClearanceDate": "01-06-2026",
      "sections": [
        { "sectionId": "LINEAR_COATING", "sectionData": [ ] }
      ]
    }
  ]
}
```

### Casting & curing combined payload

```json
{
  "castingCuringDetails": {
    "castingType": "Pair",
    "castingStation": "15A",
    "motors": [
      {
        "motorId": "MTR-001",
        "motorReceivedAt": "05-06-2026 10:00",
        "sections": [ ]
      }
    ],
    "curingSections": [ ]
  }
}
```

---

## 12. Naming conventions

| Rule | Example |
|------|---------|
| Node `id` | `SCREAMING_SNAKE_CASE` — `CURING_CYCLES`, `POST_CURING_DETAILS` |
| Field keys inside rows | `SCREAMING_SNAKE_CASE` or consistent `camelCase` per module |
| Serial number key | Always `srNo` (or set `behavior.table.autoIncrementKey`) |
| Date values | `DD-MM-YYYY` |
| Time values | `HH:mm` |
| DateTime values | `DD-MM-YYYY HH:mm` |
| Dropdown stored value | Option `value`, not display label |
| `schemaType` | `SCREAMING_SNAKE_CASE` |
| `functionality` | `CREATE_<MODULE>_FORM` |

---

## 13. Schema fetch request envelope

```json
{
  "schemaVersion": "1.0",
  "schemaType": "CURING",
  "functionality": "CREATE_CURING_FORM",
  "layout": { "type": "flat" },
  "subdepartmentId": 111,
  "motorStage": 1
}
```

Include only fields relevant to the module:

| Module | Extra request fields |
|--------|---------------------|
| Raw material | `materialId`, `gradeId`, `materialCode` |
| Case preparation | `batchType` (`MAIN_BATCH`, `SUBSCALE_BATCH`) |
| Casting / curing | `motorStage`, `subdepartmentId` |
| Mock trial | `motorStage` |

### Response envelope

Same as [§2 HTTP response wrapper](#http-response-wrapper-api-fetch). Every schema fetch response must use:

- Root: `success`, `statusCode`, `schemaVersion`, `schemaType`, `functionality`, `message`, `timestamp`
- `data`: `layout`, `designSystem`, `meta`, `context`, `nodes`

All responses must use `data.nodes[]` (see examples in `docs/examples/`).

---

## 14. Examples

Full JSON examples are in `docs/examples/`:

| File | Description |
|------|-------------|
| [`curing-schema.v1.json`](examples/curing-schema.v1.json) | Curing cycles (repeatable table), post-curing fields, de-coring with API dropdown |
| [`casting-measurements.v1.json`](examples/casting-measurements.v1.json) | Grouped-column measurement table with formula columns |
| [`case-prep-form.v1.json`](examples/case-prep-form.v1.json) | Form section, dynamic group, nested group |

---

## Appendix A: Legacy → v1 mapping

Historical reference for backend migration. The UI normalizer no longer accepts legacy `data.sections[]` or casting/curing shorthand payloads.

### Root document

| Legacy | PP-Schema v1 |
|--------|--------------|
| `sections[]` at `data` root | `data.nodes[]` |
| `data.sections[]` | `data.nodes[]` |
| `data.formDetails` | `data.meta` |
| `data.rawMaterialDetails` | `data.context` + `data.meta` (material name in title) |
| `layout` at HTTP root | `data.layout` |
| UI `themeTokens` prop | `data.designSystem.colors` |

### Section mapping

| Legacy `type` / shape | PP-Schema v1 |
|-----------------------|--------------|
| `sectionId` | `id` |
| `sectionName` / `title` | `label` |
| `type: "form"` | `component: "section"` with `field` children |
| `type: "table"` | `component: "table"` with `column` children |
| `type: "complex-table"` | `component: "table"` + `columnGroup` children |
| `type: "repeatable-table"` | `component: "repeatable"` + `table` child |
| `type: "dynamic-group"` | `component: "dynamicGroup"` |
| `type: "group"` | `component: "group"` or `section` |
| `fields[]` | `children[]` with `component: "field"` |
| `columns[]` | `children[]` with `component: "column"` |
| `groupedColumns[]` | `children[]` with `component: "columnGroup"` |
| `lots` / `drums` | `component: "nestedGroup"`, `groupKey: "lots"` \| `"drums"` |
| `table: { columns, defaultRows }` | `component: "table"` child on `section` |
| `repeatable: true` + `tables[]` | `component: "repeatable"` |
| `tables[]` (non-repeatable) | `component: "table"` |

### Field / column mapping

| Legacy | PP-Schema v1 |
|--------|--------------|
| `key` | `id` |
| `fieldId` | `id` |
| `type` (on field) | `fieldType` |
| `options[]` | `dataSource: { type: "static", options }` |
| `dataSource: "BUILDING_MASTER"` | `dataSource: { type: "api", api: { endpoint: "BUILDING_MASTER" } }` |
| `visibleWhen` | `visibility.when` |
| `addRowAllowed` | `behavior.table.allowAddRow` |
| `defaultRowCount` | `behavior.table.defaultRows` or `behavior.repeat.defaultCount` |
| `repeatConfig` | `behavior.repeat` |
| `rowConfig.defaultRows` | `behavior.table.defaultRows` |
| `rowConfig.allowAddRow` | `behavior.table.allowAddRow` |
| `rowConfig.allowDeleteRow` | `behavior.table.allowDeleteRow` |
| `repeatConfig.allowAddCycle` | `behavior.repeat.allowAdd` |
| `repeatConfig.allowDeleteCycle` | `behavior.repeat.allowDelete` |
| `repeatConfig.labelPattern` | `behavior.repeat.labelPattern` |
| `formula` on column | `behavior.formula` |
| `readonly` on column | `behavior.readonly: true` |
| `autoIncrement` type | `fieldType: "autoIncrement"` → `id: "srNo"` |

### Casting/curing API shorthand (Format B)

This is the shape currently returned by `POST .../schema/curing`:

```json
{
  "sectionId": "CURING_CYCLES",
  "sectionName": "Curing Cycles",
  "repeatable": true,
  "repeatConfig": { "allowAddCycle": true, "labelPattern": "Cycle {index}" },
  "tables": [{
    "tableId": "CURING_CYCLE_TABLE",
    "rowConfig": { "defaultRows": 10, "allowAddRow": true },
    "columns": [{ "fieldId": "TEMPERATURE", "type": "number", "unit": "°C" }]
  }]
}
```

Normalizes to:

```json
{
  "id": "CURING_CYCLES",
  "component": "repeatable",
  "label": "Curing Cycles",
  "behavior": { "repeat": { "mode": "cycle", "labelPattern": "Cycle {index}" } },
  "children": [{
    "id": "CURING_CYCLE_TABLE",
    "component": "table",
    "behavior": { "table": { "defaultRows": 10, "allowAddRow": true } },
    "children": [{
      "id": "TEMPERATURE",
      "component": "column",
      "fieldType": "number",
      "label": "Temperature",
      "unit": "°C"
    }]
  }]
}
```

---

## Appendix B: Future UI refactoring roadmap

*Not implemented in v1 spec phase. For planning only.*

| Phase | Work | Key files |
|-------|------|-----------|
| 1 | Add `SchemaNode` TypeScript types + `normalizeToV1()` | `schema.types.ts`, `normalizeSchemaV1.ts` |
| 2 | `resolveStyleTokens()` + `resolveIcon()` | `utils/schemaStyle.ts` |
| 3 | `ComponentRegistry` — map `component` → React | `ui/registry/` |
| 4 | Replace `FieldRenderer` if-chain with registry | `SchemaNodeRenderer.tsx` |
| 5 | Remove hardcoded `sx` from section components | `FormSection`, `TableSection`, `SchemaFormRenderer` |
| 6 | Single normalizer entry; deprecate dual formats | `normalizeSchema.ts` |

### Component registry (planned)

```
component     →  React component
─────────────────────────────────
field         →  FieldRenderer
column        →  (table cell via SchemaTableCellInput)
columnGroup   →  (table header group)
table         →  TableSection
repeatable    →  RepeatableTableSection
dynamicGroup  →  DynamicGroupSection
nestedGroup   →  NestedGroupSection
section       →  SectionCard + children
group         →  GroupSection
stack         →  StackLayout (new)
grid          →  GridLayout (new)
header        →  TableHeaderRow (new)
divider       →  Divider (new)
alert         →  Alert (new)
badge         →  Chip (new)
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-06-12 | Initial PP-Schema UI Standard specification |
| 1.0.1 | 2026-06-12 | All schema payloads nested under `data` (`layout`, `designSystem`, `meta`, `context`, `nodes`) |
