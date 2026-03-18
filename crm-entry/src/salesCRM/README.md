# Sales CRM Module

## Active routed screens

The current Sales CRM experience is routed through:

- `layout/DashboardLayout.jsx`
- `pages/Leads.jsx`
- `pages/Deals.jsx`
- `pages/Calendar.jsx`

Route registration lives in `router/AppRouter.jsx`.

## Real folder structure

```text
salesCRM/
|-- api/                 Sales API wrappers
|-- components/          Shared Sales CRM components
|   |-- LeadDetailsModal.jsx
|   `-- ui/
|-- layout/              Dashboard shell, sidebar, topbar
|-- pages/
|   |-- Leads.jsx        Active leads screen
|   |-- Deals.jsx        Active deals screen
|   |-- Calendar.jsx     Active calendar screen
|   |-- SalesLeads.jsx   Legacy screen, not routed
|   `-- leads/           Leads-specific helpers, cells, modals, chart, utils
|-- router/              Route definitions
|-- styles/
|   |-- Leads.css        Leads style import entrypoint
|   `-- leads/           Split CSS by concern
|-- sales-crm.css        Module-level shell styles
`-- utils/               Shared helpers
```

## Styling organization

`styles/Leads.css` is the active leads stylesheet entrypoint. Import order:

1. `base.css`
2. `controls.css`
3. `table.css`
4. `panels.css`
5. `responsive.css`
6. `modals.css`

This order keeps layout/base rules loaded before overrides and modal layers.

## Naming convention for future work

Use explicit, feature-prefixed class names instead of short generic names.

- `sales-leads-*` for active leads screen wrappers
- `sales-calendar-*` for calendar-specific wrappers
- `sales-deals-*` for deals-specific wrappers

Examples:

- `sales-leads-table-shell`
- `sales-leads-filter-chips`
- `sales-calendar-grid`
- `sales-deals-stage-pill`

## Current maintenance notes

- `pages/Leads.jsx` is the source of truth for the active Sales leads UI
- `pages/SalesLeads.jsx` still exists, but it is legacy and not routed
- Some generic CSS classes still remain for backward compatibility
- Clearer semantic aliases have now been added in the active leads screen to make future refactors safer

## Deployment-oriented guidance

Before larger refactors:

1. Change active routed screens first
2. Migrate JSX and CSS together when renaming generic classes
3. Keep backend ids internal unless needed for export, audit, or support
4. Remove legacy files only after confirming they are not imported anywhere
