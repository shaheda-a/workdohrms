# RBAC System Testing Documentation

## Overview

This document provides comprehensive testing instructions for the Role-Based Access Control (RBAC) system implemented in the WorkDo HRMS application.

## Prerequisites

### Environment Setup

1. **Backend Server**: Laravel API running on `http://localhost:8000`
2. **Frontend Server**: React application running on `http://localhost:5173`
3. **Database**: SQLite or MySQL with migrations applied

### Setup Commands

```bash
# Backend setup
cd hrms
php artisan migrate
php artisan db:seed --class=AccessSeeder

# Frontend setup
cd frontend-v2
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

### Test User Credentials

- **Email**: admin@test.com
- **Password**: password123

## Test Scenarios

### 1. Roles Page Testing

**Navigation**: Admin > Roles (or `/admin/roles`)

**Expected Results**:
- Page header displays "Roles" with subtitle "Manage user roles and their permissions"
- 4 stat cards showing: Total Roles, Total Permissions, Users Assigned, System Roles
- "Create Role" button in top right corner
- Table displaying all roles with columns: Role Name, Level, Permissions, Users, Type, Actions

**System Roles Verification**:
| Role | Level | Description |
|------|-------|-------------|
| admin | 1 | Full system access - can manage all data across all organizations and companies |
| organisation | 2 | Organization-wide access - manages all companies under their organization |
| company | 3 | Company-level access - manages a single company |
| hr | 4 | HR operations - manages staff, attendance, leave, and payroll |
| staff | 5 | Self-service only - can view own records and apply for leave |

**Verification Steps**:
1. Navigate to Admin > Roles
2. Verify all 5 system roles are displayed
3. Verify each role shows "System" badge
4. Verify permission counts are displayed for each role
5. Verify settings (gear) icon is available for each role

### 2. Edit Permissions Page Testing

**Navigation**: Click settings icon on any role in the Roles page

**Expected Results**:
- Page header displays "Edit Permissions: [role name]"
- "System Role" or "Custom Role" badge displayed
- "Level: X" badge showing hierarchy level
- Permissions count showing total selected
- "Save Changes" button

**Resource Sections**:
- Staff Management (25 permissions)
- Attendance (5 permissions)
- Leave Management (5 permissions)
- Payroll (5 permissions)
- Recruitment (5 permissions)
- Reports (5 permissions)
- Settings (5 permissions)
- Role Management (4 permissions)
- And more...

**Verification Steps**:
1. Click settings icon on "admin" role
2. Verify page loads with "Edit Permissions: admin"
3. Verify "System Role" badge and "Level: 1" are displayed
4. Verify collapsible resource sections are displayed
5. Verify individual permission toggles with checkboxes
6. Verify color-coded action badges (view=blue, create=green, edit=yellow, delete=red, approve=violet, export=cyan)
7. Verify "Select All" button for each resource section
8. Test collapsing/expanding resource sections
9. Verify "Save Changes" button is functional

### 3. Users Page Testing

**Navigation**: Admin > Users (or `/admin/users`)

**Expected Results**:
- Page header displays "Users" with subtitle "Manage system users and their access"
- 4 stat cards showing: Total Users, Administrators, Active, Inactive
- "Add User" button in top right corner
- Search input with "Search" button
- Table displaying users with columns: User, Email, Roles, Status, Created, Actions

**Verification Steps**:
1. Navigate to Admin > Users
2. Verify stat cards display correct counts
3. Verify user table displays with correct columns
4. Verify each user row shows:
   - Avatar with initials
   - User name
   - Email address
   - Role badges
   - Status badge (Active/Inactive)
   - Created date
   - Action menu (three dots)

### 4. Role Assignment Dialog Testing

**Navigation**: Users page > Click action menu (three dots) > Assign Roles

**Expected Results**:
- Dialog title "Assign Roles"
- Description "Select roles for [user name]. Users can have multiple roles."
- List of all available roles with checkboxes
- Each role shows: name, "System" badge (if applicable), "Level X" badge, description
- Currently assigned roles are pre-checked
- "Cancel" and "Save Roles" buttons

**Verification Steps**:
1. Navigate to Admin > Users
2. Click action menu (three dots) on a user row
3. Select "Assign Roles" from dropdown
4. Verify dialog opens with correct title and description
5. Verify all 5 system roles are listed
6. Verify current user's roles are pre-checked
7. Verify each role shows System badge and Level badge
8. Verify role descriptions are displayed
9. Test selecting/deselecting roles
10. Verify "Cancel" closes dialog without saving
11. Verify "Save Roles" saves changes and closes dialog

## API Endpoints

### Roles API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/roles | List all roles with permission counts |
| POST | /api/roles | Create a new role |
| GET | /api/roles/{id} | Get role details with permissions |
| PUT | /api/roles/{id} | Update role |
| DELETE | /api/roles/{id} | Delete role (blocked for system roles) |
| POST | /api/roles/{id}/permissions | Sync permissions to role |
| GET | /api/roles/{id}/permissions | Get role's permissions |

### Permissions API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/permissions | List all permissions |
| GET | /api/permissions/grouped | List permissions grouped by resource |

### Users API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/users | List all users with roles |
| GET | /api/users/{id} | Get user details |
| GET | /api/users/{id}/roles | Get user's roles |
| POST | /api/users/{id}/roles | Assign roles to user |
| POST | /api/users/{id}/roles/add | Add a role to user |
| POST | /api/users/{id}/roles/remove | Remove a role from user |

### Resources API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/resources | List all resources |
| GET | /api/resources/{id} | Get resource details |
| GET | /api/resources/slug/{slug} | Get resource by slug |

## Database Schema

### Enhanced Tables

**roles** (Spatie Permission):
- `is_system` (boolean) - Indicates if role is a system role
- `hierarchy_level` (integer) - Role hierarchy (1=highest, 99=lowest)
- `description` (text) - Role description
- `icon` (varchar) - Role icon

**permissions** (Spatie Permission):
- `resource` (varchar) - Resource name (e.g., "staff", "attendance")
- `action` (varchar) - Action type (e.g., "view", "create", "edit", "delete")
- `description` (text) - Permission description
- `sort_order` (integer) - Display order

### New Tables

**resources**:
- `id`, `name`, `slug`, `icon`, `description`, `sort_order`, `created_at`, `updated_at`

**role_audit_logs**:
- `id`, `user_id`, `action`, `auditable_type`, `auditable_id`, `old_values`, `new_values`, `created_at`

## Permission Naming Convention

Permissions follow the pattern: `{action}_{resource}`

Examples:
- `view_staff`, `create_staff`, `edit_staff`, `delete_staff`, `export_staff`
- `view_time_off`, `create_time_off`, `edit_time_off`, `delete_time_off`, `approve_time_off`
- `view_payslips`, `generate_payslips`
- `view_roles`, `create_roles`, `edit_roles`, `delete_roles`
- `manage_settings`

## Known Limitations

1. System roles (is_system=true) cannot be deleted
2. System role names cannot be changed
3. Admin role has full access via Gate::before() bypass
4. Custom roles start at hierarchy_level 6 or higher

## Troubleshooting

### Common Issues

1. **"Role not found" error on Edit Permissions page**
   - Ensure the role ID exists in the database
   - Check that the API endpoint is returning the role with permissions

2. **Users page shows 0 users**
   - Verify the API response structure matches expected format
   - Check browser console for JavaScript errors

3. **Permissions not saving**
   - Verify the user has permission to edit roles
   - Check API response for error messages

### Debug Commands

```bash
# Check roles in database
php artisan tinker --execute="echo \Spatie\Permission\Models\Role::count();"

# Check permissions in database
php artisan tinker --execute="echo \Spatie\Permission\Models\Permission::count();"

# Check user count
php artisan tinker --execute="echo \App\Models\User::count();"

# Re-run seeder
php artisan db:seed --class=AccessSeeder
```

## Test Results Summary

| Feature | Status | Notes |
|---------|--------|-------|
| Roles Page Display | Pass | All 5 system roles displayed correctly |
| Edit Permissions Page | Pass | Collapsible sections, permission toggles working |
| Users Page Display | Pass | User table with role badges displayed |
| Role Assignment Dialog | Pass | Multi-role selection working |
| API Endpoints | Pass | All CRUD operations functional |
| Permission Sync | Pass | Permissions saved correctly |
| Audit Logging | Pass | Role changes logged to role_audit_logs |

## Version Information

- Laravel: 11.x
- React: 18.x
- Spatie Permission: Latest
- Test Date: December 30, 2025
