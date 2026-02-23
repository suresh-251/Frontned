# Sales CRM Documentation

## Overview
A complete Sales CRM module built with React, featuring comprehensive sales pipeline management, lead tracking, account management, and activity scheduling.

## Features

### 1. **Dashboard**
- Real-time sales metrics and KPIs
- Total deals, deal value, leads, and accounts
- Monthly sales forecast
- Quick action buttons
- Beautiful card-based layout with gradient designs

### 2. **Leads Management**
- Create and track sales leads
- Lead source tracking (Website, Referral, Email, Social Media, etc.)
- Status management (New, Contacted, Qualified, Converted, Lost)
- Email and phone tracking
- Color-coded status badges

### 3. **Deals Management**
- Complete sales pipeline management
- Deal stages: Prospecting → Qualification → Proposal → Negotiation → Closed Won/Lost
- Real-time stage updates via dropdown
- Deal value tracking with currency formatting
- Quick stage transitions

### 4. **Accounts Management**
- Company account tracking
- Industry categorization (Healthcare, Technology, Finance, etc.)
- Contact information (website, phone)
- Full CRUD operations (Create, Read, Update, Delete)
- Associated deals tracking

### 5. **Activities Management**
- Task and activity scheduling
- Activity types: Call, Email, Meeting, Task, Reminder
- Due date tracking
- Deal-linked activities
- Status management (Pending, Completed, Cancelled)

## API Integration

### Base URL
```
http://89.116.20.215:9096/api
```

### API Services

#### **accountsAPI**
- `getAll()` - Get all accounts
- `getById(id)` - Get account by ID
- `create(data)` - Create new account
- `update(id, data)` - Update account
- `delete(id)` - Delete account
- `getDeals(id)` - Get account's deals

#### **leadsAPI**
- `getAll()` - Get all leads
- `create(data)` - Create new lead

#### **dealsAPI**
- `getAll()` - Get all deals
- `getById(id)` - Get deal by ID
- `create(data)` - Create new deal
- `updateStage(id, stage)` - Update deal stage
- `delete(id)` - Delete deal
- `getByStage(stage)` - Get deals by stage

#### **activitiesAPI**
- `getAll()` - Get all activities
- `getById(id)` - Get activity by ID
- `create(data)` - Create new activity
- `updateStatus(id, status)` - Update activity status
- `delete(id)` - Delete activity
- `getByDealId(dealId)` - Get activities for a deal

#### **forecastAPI**
- `getMonthly()` - Get monthly sales forecast

#### **notesAPI**
- `getAll()` - Get all notes
- `getById(id)` - Get note by ID
- `create(data)` - Create new note
- `delete(id)` - Delete note
- `getByRelatedId(id)` - Get notes by related entity
- `getByType(type)` - Get notes by type

## Project Structure

```
salesCRM/
├── api/
│   ├── apiClient.js          # Axios instance with interceptors
│   ├── accounts.api.js       # Account service methods
│   ├── activities.api.js     # Activity service methods
│   ├── deals.api.js          # Deal service methods
│   ├── leads.api.js          # Lead service methods
│   ├── notes.api.js          # Note service methods
│   ├── forecast.api.js       # Forecast service methods
│   └── index.js              # API exports
│
├── components/
│   ├── common/
│   │   ├── Button.jsx        # Reusable button component
│   │   ├── Card.jsx          # Card container component
│   │   ├── Input.jsx         # Form input component
│   │   ├── Select.jsx        # Dropdown select component
│   │   ├── Table.jsx         # Data table component
│   │   ├── Modal.jsx         # Modal dialog component
│   │   └── index.js          # Component exports
│   │
│   └── sales/                # Sales-specific components
│
├── pages/
│   ├── Dashboard.jsx         # Main dashboard with stats
│   ├── Leads.jsx            # Lead management page
│   ├── Deals.jsx            # Deal pipeline page
│   ├── Accounts.jsx         # Account management page
│   └── Activities.jsx       # Activity scheduler page
│
├── layout/
│   ├── DashboardLayout.jsx  # Main layout wrapper
│   ├── Sidebar.jsx          # Navigation sidebar
│   └── Topbar.jsx           # Top navigation bar
│
├── router/
│   └── AppRouter.jsx        # Route configuration
│
├── App.jsx                  # Main app component
├── SalesEntry.jsx           # Entry point
└── sales-crm.css           # Global styles
```

## Components

### Common Components

#### **Button**
```jsx
<Button variant="primary" size="md" onClick={handleClick}>
  Click Me
</Button>
```
- Variants: primary, secondary, success, danger, warning, outline, ghost
- Sizes: sm, md, lg
- Props: loading, fullWidth, icon, disabled

#### **Card**
```jsx
<Card title="Title" subtitle="Subtitle" headerAction={<Button />}>
  Content
</Card>
```
- Props: title, subtitle, headerAction, padding, hover, onClick

#### **Input**
```jsx
<Input
  label="Email"
  name="email"
  type="email"
  value={value}
  onChange={handleChange}
  required
/>
```
- Props: label, type, error, required, disabled, icon, helperText

#### **Select**
```jsx
<Select
  label="Status"
  name="status"
  value={value}
  onChange={handleChange}
  options={[{value: '1', label: 'Option 1'}]}
/>
```

#### **Table**
```jsx
<Table
  columns={[
    { header: 'Name', accessor: 'name' },
    { header: 'Actions', render: (row) => <Button /> }
  ]}
  data={data}
  loading={loading}
  onRowClick={handleRowClick}
/>
```

#### **Modal**
```jsx
<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Modal Title"
  size="md"
  footer={<div>Footer content</div>}
>
  Modal content
</Modal>
```

## Styling

### Design System
- **Primary Color:** Blue (#2563EB)
- **Success Color:** Green (#10B981)
- **Danger Color:** Red (#EF4444)
- **Warning Color:** Yellow (#F59E0B)

### Tailwind CSS
The project uses Tailwind CSS for styling with custom configurations.

## Usage

### Adding to Main App

The Sales CRM is integrated into the main CRM shell:

```jsx
// CrmShell.jsx
import SalesEntry from "../../salesCRM/SalesEntry";

case "sales":
  return <SalesEntry />;
```

### Routing

Sales CRM routes are accessible at:
- `/crm/sales` - Dashboard
- `/crm/sales/leads` - Leads page
- `/crm/sales/deals` - Deals page
- `/crm/sales/accounts` - Accounts page
- `/crm/sales/activities` - Activities page

### Authentication

The API client automatically handles authentication tokens:
```javascript
const token = localStorage.getItem('salesCrmToken');
```

## API Error Handling

The API client includes global error handling:
- **401 Unauthorized:** Redirects to login
- **403 Forbidden:** Permission denied
- **404 Not Found:** Resource not found
- **500 Server Error:** Server error message

## Future Enhancements

1. **Notes Module Integration** - Add notes to deals and accounts
2. **Reports & Analytics** - Advanced reporting dashboard
3. **Email Integration** - Send emails directly from CRM
4. **Calendar View** - Calendar view for activities
5. **Pipeline Visualization** - Visual kanban board for deals
6. **Advanced Filtering** - Filter and search capabilities
7. **Export Functionality** - Export data to CSV/Excel
8. **User Permissions** - Role-based access control
9. **Notifications** - Real-time notifications for activities
10. **Mobile Responsive** - Enhanced mobile experience

## Known Issues

### API Limitations (as per documentation):
- **POST /api/Accounts** - Currently not working
- **POST /api/Activities** - Currently not working
- **POST /api/Deals** - Currently not working
- **POST /api/Notes** - Currently not working

These POST endpoints will need to be fixed on the backend before full CRUD functionality is available.

## Development

### Running the Application
The Sales CRM is automatically loaded when accessing `/crm/sales` route in the main application.

### Making Changes
1. API services are in `api/` folder
2. UI components are in `components/common/`
3. Pages are in `pages/`
4. Routes are defined in `router/AppRouter.jsx`

## Support

For issues or questions, please refer to the API documentation at:
http://89.116.20.215:9096/swagger/index.html
