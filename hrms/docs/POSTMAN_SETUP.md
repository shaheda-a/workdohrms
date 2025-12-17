# Postman Setup Guide

## Quick Import

### Step 1: Import Collection

1. Open Postman
2. Click **Import** button (top left)
3. Drag and drop `HRMS_API.postman_collection.json`
4. Or use: File → Import → Upload Files

### Step 2: Import Environment

1. Click **Import** again
2. Import `HRMS_Local.postman_environment.json`
3. Select **HRMS Local** from environment dropdown (top right)

---

## First Time Setup

### 1. Start Laravel Server

```bash
cd hrms
php artisan serve
```

Server runs at: `http://localhost:8000`

### 2. Get Authentication Token

1. Open Collection → **🔐 Authentication** → **Sign In**
2. Click **Send**
3. Token is automatically saved to `{{auth_token}}` variable

### 3. Test an Endpoint

1. Open **📊 Reports & Dashboard** → **Dashboard**
2. Click **Send**
3. You should see dashboard data

---

## Collection Structure

```
HRMS API Collection
├── 🔐 Authentication
│   ├── Sign Up
│   ├── Sign In          ← Run this first!
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
│   ├── List Staff
│   ├── Create Staff
│   ├── Get/Update/Delete
│   └── Staff Dropdown
│
├── ⏰ Attendance
│   ├── Clock In/Out
│   ├── Work Logs
│   └── Summary
│
├── 🌴 Leave Management
│   ├── Categories
│   ├── Requests
│   └── Approve/Decline
│
├── 💰 Payroll
│   ├── Salary Slips
│   ├── Benefits
│   ├── Deductions
│   └── Tax Slabs
│
├── 📅 Events & Calendar
│   ├── Events
│   ├── Holidays
│   └── Calendar Data
│
├── 📊 Reports & Dashboard
│   ├── Dashboard
│   ├── Attendance Report
│   ├── Leave Report
│   └── Payroll Report
│
├── 📥 Import / Export
│   ├── Export Staff
│   └── Export Attendance
│
└── 📈 Performance
    ├── Objectives
    └── Appraisals
```

---

## Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | <admin@hrms.local> | password |
| Manager | <manager@hrms.local> | password |
| HR | <hr@hrms.local> | password |
| Staff | <staff@hrms.local> | password |

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `base_url` | API base URL (<http://localhost:8000>) |
| `auth_token` | Bearer token (auto-saved on login) |

---

## Auto Token Saving

The **Sign In** request has a test script that automatically saves the token:

```javascript
var jsonData = pm.response.json();
if (jsonData.data && jsonData.data.access_token) {
    pm.collectionVariables.set('auth_token', jsonData.data.access_token);
}
```

All other requests use `{{auth_token}}` in the Authorization header.

---

## Common Workflows

### Create a Staff Member

1. Sign In (get token)
2. Create Office Location
3. Create Division
4. Create Job Title
5. Create Staff Member

### Submit Leave Request

1. Sign In as staff
2. Check Leave Balance
3. Create Leave Request
4. Sign In as manager
5. Approve/Decline Request

### Generate Payroll

1. Sign In as admin
2. Create Benefits for staff
3. Create Deductions
4. Generate Payslip
5. Mark as Paid

---

## Troubleshooting

### "Unauthenticated" Error

- Run **Sign In** request first
- Check if token is saved in environment

### 404 Not Found

- Ensure server is running
- Check `base_url` is correct

### 422 Validation Error

- Check request body format
- Required fields may be missing

---

## Files

| File | Purpose |
|------|---------|
| `HRMS_API.postman_collection.json` | All API endpoints |
| `HRMS_Local.postman_environment.json` | Environment variables |

Happy Testing! 🚀
