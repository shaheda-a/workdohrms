# Frontend Integration Guide

This guide helps frontend developers integrate with the HRMS API.

## Quick Start

### 1. Authentication Setup

```javascript
// api.js - Axios configuration
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('auth_token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
```

### 2. Authentication Flow

```javascript
// auth.js
import api from './api';

export const authService = {
    async login(email, password) {
        const response = await api.post('/auth/sign-in', { email, password });
        const { token, user } = response.data.data;
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user', JSON.stringify(user));
        return user;
    },

    async register(name, email, password, password_confirmation) {
        const response = await api.post('/auth/sign-up', {
            name, email, password, password_confirmation
        });
        const { token, user } = response.data.data;
        localStorage.setItem('auth_token', token);
        return user;
    },

    async logout() {
        await api.post('/auth/sign-out');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
    },

    async getProfile() {
        const response = await api.get('/auth/profile');
        return response.data.data;
    },

    getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    isAuthenticated() {
        return !!localStorage.getItem('auth_token');
    }
};
```

---

## Service Layer Examples

### Staff Member Service

```javascript
// services/staffMember.js
import api from './api';

export const staffMemberService = {
    async getAll(params = {}) {
        const response = await api.get('/staff-members', { params });
        return response.data.data;
    },

    async getById(id) {
        const response = await api.get(`/staff-members/${id}`);
        return response.data.data;
    },

    async create(data) {
        const response = await api.post('/staff-members', data);
        return response.data.data;
    },

    async update(id, data) {
        const response = await api.put(`/staff-members/${id}`, data);
        return response.data.data;
    },

    async delete(id) {
        await api.delete(`/staff-members/${id}`);
    },

    async getDropdown() {
        const response = await api.get('/staff-members-dropdown');
        return response.data.data;
    }
};
```

### Leave Management Service

```javascript
// services/leave.js
import api from './api';

export const leaveService = {
    async getRequests(params = {}) {
        const response = await api.get('/time-off-requests', { params });
        return response.data.data;
    },

    async createRequest(data) {
        const response = await api.post('/time-off-requests', data);
        return response.data.data;
    },

    async processRequest(id, action, remarks = '') {
        const response = await api.post(`/time-off-requests/${id}/process`, {
            action, // 'approve' or 'decline'
            remarks
        });
        return response.data;
    },

    async getBalance(staffMemberId, year = new Date().getFullYear()) {
        const response = await api.get('/time-off-balance', {
            params: { staff_member_id: staffMemberId, year }
        });
        return response.data.data;
    },

    async getCategories() {
        const response = await api.get('/time-off-categories');
        return response.data.data;
    }
};
```

### Attendance Service

```javascript
// services/attendance.js
import api from './api';

export const attendanceService = {
    async clockIn() {
        const response = await api.post('/clock-in');
        return response.data;
    },

    async clockOut() {
        const response = await api.post('/clock-out');
        return response.data;
    },

    async getWorkLogs(params = {}) {
        const response = await api.get('/work-logs', { params });
        return response.data.data;
    },

    async getSummary(staffMemberId, month) {
        const response = await api.get('/attendance-summary', {
            params: { staff_member_id: staffMemberId, month }
        });
        return response.data.data;
    }
};
```

### Payroll Service

```javascript
// services/payroll.js
import api from './api';

export const payrollService = {
    async generatePayslip(staffMemberId, salaryPeriod) {
        const response = await api.post('/salary-slips/generate', {
            staff_member_id: staffMemberId,
            salary_period: salaryPeriod // Format: 'YYYY-MM'
        });
        return response.data.data;
    },

    async bulkGenerate(salaryPeriod) {
        const response = await api.post('/salary-slips/bulk-generate', {
            salary_period: salaryPeriod
        });
        return response.data;
    },

    async getPayslips(params = {}) {
        const response = await api.get('/salary-slips', { params });
        return response.data.data;
    },

    async markPaid(id) {
        const response = await api.post(`/salary-slips/${id}/mark-paid`);
        return response.data;
    }
};
```

---

## React Component Examples

### Login Component

```jsx
// components/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await authService.login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required 
            />
            <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required 
            />
            {error && <div className="error">{error}</div>}
            <button type="submit" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
            </button>
        </form>
    );
}
```

### Staff Members Table

```jsx
// components/StaffMembersTable.jsx
import { useState, useEffect } from 'react';
import { staffMemberService } from '../services/staffMember';

export default function StaffMembersTable() {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadStaff();
    }, [page, search]);

    const loadStaff = async () => {
        setLoading(true);
        try {
            const response = await staffMemberService.getAll({
                page,
                search,
                per_page: 15
            });
            setStaff(response.data);
            setTotalPages(response.last_page);
        } catch (error) {
            console.error('Failed to load staff:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search staff..."
            />

            {loading ? (
                <div>Loading...</div>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>Staff Code</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Division</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {staff.map((s) => (
                            <tr key={s.id}>
                                <td>{s.staff_code}</td>
                                <td>{s.first_name} {s.last_name}</td>
                                <td>{s.personal_email}</td>
                                <td>{s.division?.title}</td>
                                <td>{s.employment_status}</td>
                                <td>
                                    <button onClick={() => handleEdit(s.id)}>Edit</button>
                                    <button onClick={() => handleDelete(s.id)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <div className="pagination">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                    Previous
                </button>
                <span>Page {page} of {totalPages}</span>
                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                    Next
                </button>
            </div>
        </div>
    );
}
```

### Dashboard Component

```jsx
// components/Dashboard.jsx
import { useState, useEffect } from 'react';
import api from '../services/api';

export default function Dashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const response = await api.get('/dashboard');
            setData(response.data.data);
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!data) return <div>Failed to load dashboard</div>;

    return (
        <div className="dashboard">
            <div className="stats-grid">
                <div className="stat-card">
                    <h3>Total Employees</h3>
                    <p className="stat-value">{data.employees.total}</p>
                    <p className="stat-label">Active: {data.employees.active}</p>
                </div>

                <div className="stat-card">
                    <h3>Today's Attendance</h3>
                    <p className="stat-value">{data.attendance_today.present}</p>
                    <p className="stat-label">
                        Absent: {data.attendance_today.absent} | 
                        Not Marked: {data.attendance_today.not_marked}
                    </p>
                </div>

                <div className="stat-card">
                    <h3>Pending Leaves</h3>
                    <p className="stat-value">{data.leave_requests.pending}</p>
                </div>

                <div className="stat-card">
                    <h3>Payroll Status</h3>
                    <p className="stat-value">{data.payroll.paid}/{data.payroll.generated}</p>
                    <p className="stat-label">Period: {data.payroll.period}</p>
                </div>
            </div>

            <div className="widgets">
                <div className="widget">
                    <h3>Upcoming Events</h3>
                    <ul>
                        {data.upcoming_events.map(event => (
                            <li key={event.id}>{event.title} - {event.event_start}</li>
                        ))}
                    </ul>
                </div>

                <div className="widget">
                    <h3>Recent Announcements</h3>
                    <ul>
                        {data.recent_announcements.map(notice => (
                            <li key={notice.id}>{notice.title}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
```

---

## Calendar Integration

```jsx
// components/Calendar.jsx
import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import api from '../services/api';

export default function HRCalendar() {
    const [events, setEvents] = useState([]);

    const loadEvents = async (fetchInfo) => {
        try {
            const response = await api.get('/calendar-data', {
                params: {
                    start_date: fetchInfo.startStr.split('T')[0],
                    end_date: fetchInfo.endStr.split('T')[0]
                }
            });
            return response.data.data.map(e => ({
                id: e.id,
                title: e.title,
                start: e.start,
                end: e.end,
                backgroundColor: e.color,
                extendedProps: { type: e.type }
            }));
        } catch (error) {
            console.error('Failed to load events:', error);
            return [];
        }
    };

    return (
        <FullCalendar
            plugins={[dayGridPlugin]}
            initialView="dayGridMonth"
            events={loadEvents}
            eventClick={(info) => {
                alert(`${info.event.title} (${info.event.extendedProps.type})`);
            }}
        />
    );
}
```

---

## File Upload Example

```jsx
// components/FileUpload.jsx
import { useState } from 'react';
import api from '../services/api';

export default function FileUpload({ staffMemberId, onUploadComplete }) {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const handleUpload = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('file_category_id', 1);

        setUploading(true);
        try {
            await api.post(`/staff-members/${staffMemberId}/files`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            onUploadComplete?.();
            setFile(null);
        } catch (error) {
            console.error('Upload failed:', error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div>
            <input 
                type="file" 
                onChange={(e) => setFile(e.target.files[0])} 
            />
            <button onClick={handleUpload} disabled={!file || uploading}>
                {uploading ? 'Uploading...' : 'Upload'}
            </button>
        </div>
    );
}
```

---

## Role-Based Access Control

```jsx
// components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { authService } from '../services/auth';

export default function ProtectedRoute({ children, requiredRoles = [] }) {
    const user = authService.getUser();

    if (!authService.isAuthenticated()) {
        return <Navigate to="/login" />;
    }

    if (requiredRoles.length > 0) {
        const hasRole = user?.roles?.some(role => requiredRoles.includes(role));
        if (!hasRole) {
            return <Navigate to="/unauthorized" />;
        }
    }

    return children;
}

// Usage:
// <ProtectedRoute requiredRoles={['administrator', 'hr_officer']}>
//     <AdminPanel />
// </ProtectedRoute>
```

---

## Recommended Tech Stack

| Category | Recommendation |
|----------|---------------|
| Framework | React 18+ or Vue 3+ |
| Routing | React Router v6 / Vue Router |
| State Management | Zustand / Pinia |
| HTTP Client | Axios |
| UI Components | shadcn/ui / Vuetify |
| Calendar | FullCalendar |
| DataTables | TanStack Table |
| Forms | React Hook Form / VeeValidate |
| Charts | Chart.js / Recharts |

---

## Environment Variables

```env
# .env.local
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=HRMS
```
