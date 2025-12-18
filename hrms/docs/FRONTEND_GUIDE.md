# Frontend Development Guide

## Overview

The HRMS frontend is built with React 18+ and Vite, providing a modern and responsive user interface for HR management.

## Technology Stack

- **React 18+** - UI Framework
- **Vite** - Build Tool & Dev Server
- **React Router v6** - Client-side Routing
- **Axios** - HTTP Client
- **Lucide React** - Icon Library
- **CSS Modules** - Styling

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Production Build

```bash
npm run build
```

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI Components
│   │   ├── Layout.jsx       # Main Layout with Sidebar
│   │   ├── Modal.jsx        # Modal Component
│   │   ├── IDCardGenerator.jsx
│   │   └── ...
│   │
│   ├── pages/               # Page Components
│   │   ├── Dashboard.jsx
│   │   ├── StaffMembers.jsx
│   │   ├── Attendance.jsx
│   │   ├── LeaveRequests.jsx
│   │   ├── Payroll.jsx
│   │   ├── Reports.jsx
│   │   ├── Settings.jsx
│   │   └── ...
│   │
│   ├── services/            # API Service Layer
│   │   ├── api.js           # Axios Instance
│   │   ├── authService.js
│   │   ├── staffService.js
│   │   ├── attendanceService.js
│   │   ├── leaveService.js
│   │   ├── salaryService.js
│   │   └── ...
│   │
│   ├── App.jsx              # Main App with Routes
│   ├── main.jsx             # Entry Point
│   └── index.css            # Global Styles
│
├── public/                  # Static Assets
├── .env                     # Environment Variables
├── vite.config.js           # Vite Configuration
└── package.json
```

## Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://127.0.0.1:8000/api
```

## API Configuration

The API client is configured in `src/services/api.js`:

```javascript
import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Request interceptor for auth token
api.interceptors.request.use(config => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
```

## Pages Overview

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | Overview with stats and quick actions |
| Staff Members | `/staff` | Employee list and management |
| Employee Profile | `/staff/:id` | Individual employee details |
| Attendance | `/attendance` | Clock in/out and attendance tracking |
| Shifts | `/shifts` | Shift management |
| Leave Requests | `/leave` | Leave applications and approvals |
| Payroll | `/payroll` | Salary setup and payslips |
| Reports | `/reports` | Various HR reports |
| Holidays | `/holidays` | Holiday calendar |
| Announcements | `/announcements` | Company announcements |
| Settings | `/settings` | System configuration |

## Component Guidelines

### Creating a New Page

1. Create the component file in `src/pages/`:

```jsx
import { useState, useEffect } from 'react';
import { someService } from '../services/someService';
import './NewPage.css';

export default function NewPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const response = await someService.getAll();
            setData(response.data.data || []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="new-page">
            <div className="page-header">
                <h1>Page Title</h1>
            </div>
            {/* Page content */}
        </div>
    );
}
```

2. Add the route in `App.jsx`:

```jsx
import NewPage from './pages/NewPage';

// In Routes
<Route path="new-page" element={<NewPage />} />
```

3. Add navigation in `Layout.jsx`.

### Creating a Service

```javascript
import api from './api';

export const newService = {
    getAll: (params = {}) => api.get('/endpoint', { params }),
    getOne: (id) => api.get(`/endpoint/${id}`),
    create: (data) => api.post('/endpoint', data),
    update: (id, data) => api.put(`/endpoint/${id}`, data),
    delete: (id) => api.delete(`/endpoint/${id}`),
};
```

## Styling Guidelines

### CSS Variables

Use CSS variables defined in `index.css`:

```css
:root {
    --primary: #6366f1;
    --primary-light: #eef2ff;
    --success: #10b981;
    --danger: #ef4444;
    --warning: #f59e0b;
    --text-primary: #1e293b;
    --text-secondary: #64748b;
    --border: #e2e8f0;
    --bg-card: #ffffff;
    --radius: 8px;
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
}
```

### Component Classes

```css
/* Page container */
.page-name {
    max-width: 1400px;
}

/* Header */
.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
}

/* Stats grid */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
}

/* Cards */
.card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: 1.5rem;
}
```

## Best Practices

1. **Use functional components** with hooks
2. **Handle loading and error states** in all async operations
3. **Use services** for all API calls
4. **Follow naming conventions** - PascalCase for components, camelCase for functions
5. **Keep components focused** - one component, one responsibility
6. **Use CSS modules** for component-specific styles

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
