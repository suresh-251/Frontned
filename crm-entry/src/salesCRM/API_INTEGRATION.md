# Sales CRM API Integration Guide

## Base URL
```
http://89.116.20.215:9096/api
```

## Swagger Documentation
```
http://89.116.20.215:9096/swagger/index.html
```

---

## 🟢 Working Endpoints (Fully Integrated)

### Accounts Module
| Method | Endpoint | Status | Description |
|--------|----------|--------|-------------|
| GET | `/Accounts` | ✅ Working | Fetch all accounts |
| GET | `/Accounts/{id}` | ✅ Working | Get account by ID |
| POST | `/Accounts` | ✅ Working | Create new account |
| PUT | `/Accounts/{id}` | ✅ Working | Update account |
| DELETE | `/Accounts/{id}` | ✅ Working | Delete account |
| GET | `/Accounts/{id}/deals` | ✅ Working | Get deals for an account |

**Example Response:**
```json
{
  "id": 101,
  "companyName": "Skyline Technologies",
  "website": "www.skyline-tech.com",
  "phone": "9988776655",
  "industry": "Software",
  "createdAt": "2026-03-05T09:15:00Z"
}
```

---

### Activities Module
| Method | Endpoint | Status | Description |
|--------|----------|--------|-------------|
| GET | `/Activities` | ✅ Working | Fetch all activities |
| GET | `/Activities/{id}` | ✅ Working | Get activity by ID |
| POST | `/Activities` | ✅ Working | Create new activity |
| PUT | `/Activities/status/{id}` | ✅ Working | Update activity status |
| DELETE | `/Activities/{id}` | ✅ Working | Delete activity |
| GET | `/Activities/deal/{dealId}` | ✅ Working | Get activities by deal ID |

**Example Response:**
```json
{
  "id": 205,
  "dealId": 320,
  "type": "Meeting",
  "description": "Quarterly review",
  "dueDate": "2026-03-10T11:00:00Z",
  "status": "Pending"
}
```

---

### Deals Module
| Method | Endpoint | Status | Description |
|--------|----------|--------|-------------|
| GET | `/Deals` | ✅ Working | Fetch all deals |
| GET | `/Deals/{id}` | ✅ Working | Get deal by ID |
| POST | `/Deals` | ✅ Working | Create new deal |
| PUT | `/Deals/stage/{id}` | ✅ Working | Update deal stage |
| DELETE | `/Deals/{id}` | ✅ Working | Delete deal |
| GET | `/Deals/pipeline/{stage}` | ✅ Working | Get deals by stage |

**Example Response:**
```json
{
  "id": 320,
  "title": "Cloud Upgrade",
  "value": 275000,
  "stage": "Proposal"
}
```

**Available Stages:**
- Prospecting
- Qualification
- Proposal
- Negotiation
- Closed Won
- Closed Lost

---

### Leads Module
| Method | Endpoint | Status | Description |
|--------|----------|--------|-------------|
| GET | `/Leads` | ✅ Working | Fetch all leads |
| POST | `/Leads` | ✅ Working | Create new lead |

**Example Response:**
```json
{
  "id": 410,
  "name": "Karthik Sharma",
  "email": "karthik.sharma@gmail.com",
  "phone": "9876501234",
  "source": "LinkedIn",
  "status": "New"
}
```

**Available Statuses:**
- New
- Contacted
- Qualified
- Converted
- Lost

---

### Notes Module
| Method | Endpoint | Status | Description |
|--------|----------|--------|-------------|
| GET | `/Notes` | ✅ Working | Fetch all notes |
| GET | `/Notes/{id}` | ✅ Working | Get note by ID |
| POST | `/Notes` | ✅ Working | Create new note |
| DELETE | `/Notes/{id}` | ✅ Working | Delete note |
| GET | `/Notes/related/{id}` | ✅ Working | Get notes by related entity |
| GET | `/Notes/type/{type}` | ✅ Working | Get notes by type |

**Example Response:**
```json
{
  "id": 512,
  "relatedId": 320,
  "type": "Deal",
  "content": "Client approved budget."
}
```

**Available Types:**
- Deal
- Account
- Lead
- Activity

---

### Forecast Module
| Method | Endpoint | Status | Description |
|--------|----------|--------|-------------|
| GET | `/Forecast/monthly` | ✅ Working | Get monthly forecast |

**Example Response:**
```json
{
  "forecastAmount": 875000
}
```

---

## 🔴 Not Working (Authentication Issues)

### Auth Module
| Method | Endpoint | Status | Description |
|--------|----------|--------|-------------|
| POST | `/auth/login` | ❌ Not Working | User login (No valid JWT generated) |

**Note:** Authentication endpoint is currently not functional. The API is accessible without authentication for now.

---

## Integration Status

### ✅ Fully Integrated Pages
1. **Dashboard** - Shows all stats with real API data
2. **Accounts** - Full CRUD operations
3. **Leads** - Create and list leads
4. **Deals** - Full pipeline management
5. **Activities** - Full activity tracking
6. **Notes** - Linked to deals/accounts

### 🎨 Design Enhancements
- ✅ White sidebar with gradient accents
- ✅ Modern topbar with search
- ✅ Toast notifications for user feedback
- ✅ Animated modals and transitions
- ✅ Gradient buttons and cards
- ✅ Professional color scheme (blue-purple)
- ✅ Responsive design

### 📱 User Experience Features
- ✅ Real-time data refresh
- ✅ Loading states and skeletons
- ✅ Error handling with toast messages
- ✅ Success confirmations
- ✅ Smooth animations
- ✅ Intuitive navigation
- ✅ Search functionality in topbar
- ✅ Quick action buttons

---

## How to Use

1. **Start the application:**
   ```bash
   cd crm-entry
   npm run dev
   ```

2. **Access Sales CRM:**
   Navigate to: `http://localhost:5173/crm/sales`

3. **Test API endpoints:**
   Visit Swagger UI: `http://89.116.20.215:9096/swagger/index.html`

---

## Notes
- All endpoints except authentication are working properly
- Data persists in the backend database
- Toast notifications provide user feedback
- All CRUD operations are functional
- Real-time updates on all pages
