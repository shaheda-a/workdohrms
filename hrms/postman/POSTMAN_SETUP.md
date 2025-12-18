# Postman API Collection

## Overview

This directory contains the Postman collection and environment files for testing the HRMS API.

## Files

| File | Description |
|------|-------------|
| `HRMS_API.postman_collection.json` | Complete API collection |
| `HRMS_Local.postman_environment.json` | Local development environment |

## Setup Instructions

### 1. Import Collection

1. Open Postman
2. Click **Import** button
3. Select `HRMS_API.postman_collection.json`
4. The collection will appear in your sidebar

### 2. Import Environment

1. Click **Import** button
2. Select `HRMS_Local.postman_environment.json`
3. Select the environment from the dropdown (top-right)

### 3. Configure Environment Variables

The following variables are used:

| Variable | Description | Default |
|----------|-------------|---------|
| `base_url` | API Base URL | `http://localhost:8000` |
| `auth_token` | Bearer Token (auto-set) | - |

### 4. Start Testing

1. Run **Sign In** request first
2. The auth token is automatically saved
3. All subsequent requests will use the token

## Collection Structure

```
HRMS API Collection
├── 🔐 Authentication
│   ├── Sign Up
│   ├── Sign In
│   ├── Sign Out
│   ├── Get Profile
│   └── Forgot Password
│
├── 🏢 Organization
│   ├── Office Locations
│   ├── Divisions
│   └── Job Titles
│
├── 👥 Staff Members
│   ├── List Staff Members
│   ├── Create Staff Member
│   ├── Get Staff Member
│   ├── Update Staff Member
│   └── Delete Staff Member
│
├── ⏰ Attendance
│   ├── Clock In
│   ├── Clock Out
│   ├── List Work Logs
│   ├── Create Work Log
│   └── Bulk Create Work Logs
│
├── 🌴 Leave Management
│   ├── Time Off Categories
│   └── Time Off Requests
│
├── 💰 Payroll
│   ├── Salary Components
│   └── Payslips
│
├── 📊 Reports
│   └── Various Reports
│
├── 📅 Events & Calendar
│   └── Company Events
│
├── 👔 Recruitment
│   ├── Jobs
│   ├── Candidates
│   └── Interviews
│
├── 🎓 Training
│   └── Training Programs
│
├── 📦 Assets
│   └── Asset Management
│
├── 📄 Contracts
│   └── Contract Management
│
├── 🗓️ Meetings
│   └── Meeting Management
│
├── 📢 Announcements
│   └── Announcement Management
│
├── 🎉 Holidays
│   └── Holiday Management
│
└── ⚙️ Settings
    └── System Settings
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer {token}
```

The token is automatically obtained when you run the **Sign In** request and stored in the `auth_token` variable.

## Default Test Credentials

```
Email: admin@hrms.local
Password: password
```

## Common Headers

All requests include:

```
Accept: application/json
Content-Type: application/json
```

## Response Format

### Success Response

```json
{
    "success": true,
    "message": "Operation successful",
    "data": { ... }
}
```

### Error Response

```json
{
    "success": false,
    "message": "Error description",
    "errors": { ... }
}
```

### Paginated Response

```json
{
    "success": true,
    "data": {
        "current_page": 1,
        "data": [...],
        "last_page": 10,
        "per_page": 15,
        "total": 150
    }
}
```

## Testing Workflow

1. **Sign In** to get authentication token
2. **Create** resources (Office Location → Division → Job Title → Staff Member)
3. **Test** CRUD operations on each module
4. **Verify** relationships and validations

## Tips

- Use **Pre-request Scripts** for dynamic data
- Use **Tests** tab to verify responses
- Use **Variables** for reusable values
- Use **Folders** to organize requests
- Use **Runner** for automated testing

## Troubleshooting

### 401 Unauthorized

- Token expired - Run **Sign In** again
- Token missing - Check environment is selected

### 422 Validation Error

- Check request body format
- Verify required fields

### 404 Not Found

- Check resource ID exists
- Verify URL is correct

### 500 Server Error

- Check Laravel logs: `storage/logs/laravel.log`
- Verify database connection
