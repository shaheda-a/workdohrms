# HRMS API Documentation

## Base URL

```
http://localhost:8000/api
```

## Authentication

All API endpoints (except sign-up, sign-in, forgot-password, reset-password) require Bearer token authentication.

### Headers

```
Authorization: Bearer {token}
Content-Type: application/json
Accept: application/json
```

---

## 1. Authentication Endpoints

### Sign Up

```http
POST /api/auth/sign-up
```

**Request Body:**

```json
{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "Password123!",
    "password_confirmation": "Password123!"
}
```

**Response (201):**

```json
{
    "success": true,
    "message": "User registered successfully",
    "data": {
        "user": { "id": 1, "name": "John Doe", "email": "john@example.com" },
        "token": "1|abc123..."
    }
}
```

### Sign In

```http
POST /api/auth/sign-in
```

**Request Body:**

```json
{
    "email": "john@example.com",
    "password": "Password123!"
}
```

**Response (200):**

```json
{
    "success": true,
    "message": "Login successful",
    "data": {
        "user": { "id": 1, "name": "John Doe", "email": "john@example.com", "roles": ["administrator"] },
        "token": "2|xyz789..."
    }
}
```

### Sign Out

```http
POST /api/auth/sign-out
Authorization: Bearer {token}
```

### Get Profile

```http
GET /api/auth/profile
Authorization: Bearer {token}
```

---

## 2. Organization Structure

### Office Locations

```http
GET    /api/office-locations          # List all
POST   /api/office-locations          # Create
GET    /api/office-locations/{id}     # Show
PUT    /api/office-locations/{id}     # Update
DELETE /api/office-locations/{id}     # Delete
```

**Create Request:**

```json
{
    "title": "Head Office",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "is_headquarters": true
}
```

### Divisions

```http
GET    /api/divisions
POST   /api/divisions
GET    /api/divisions/{id}
PUT    /api/divisions/{id}
DELETE /api/divisions/{id}
POST   /api/fetch-divisions           # Fetch by location (cascading dropdown)
```

**Fetch by Location:**

```json
{ "office_location_id": 1 }
```

### Job Titles

```http
GET    /api/job-titles
POST   /api/job-titles
GET    /api/job-titles/{id}
PUT    /api/job-titles/{id}
DELETE /api/job-titles/{id}
POST   /api/fetch-job-titles          # Fetch by division
```

---

## 3. Staff Member Management

### Staff Members

```http
GET    /api/staff-members                    # List (paginated)
POST   /api/staff-members                    # Create
GET    /api/staff-members/{id}               # Show
PUT    /api/staff-members/{id}               # Update
DELETE /api/staff-members/{id}               # Delete
GET    /api/staff-members-dropdown           # For dropdowns
```

**Create Request:**

```json
{
    "first_name": "John",
    "last_name": "Doe",
    "personal_email": "john@personal.com",
    "phone_number": "+1234567890",
    "date_of_birth": "1990-05-15",
    "gender": "male",
    "hire_date": "2024-01-15",
    "base_salary": 75000,
    "office_location_id": 1,
    "division_id": 1,
    "job_title_id": 1,
    "create_user_account": true,
    "user_email": "john.doe@company.com"
}
```

**Query Parameters:**

- `office_location_id` - Filter by location
- `division_id` - Filter by division
- `status` - Filter by employment_status
- `search` - Search name, email, staff_code
- `per_page` - Items per page (default: 15)
- `paginate` - Set to false for all records

### Staff Files

```http
GET    /api/staff-members/{id}/files         # List files
POST   /api/staff-members/{id}/files         # Upload file (multipart)
GET    /api/staff-members/{id}/files/{fileId}
DELETE /api/staff-members/{id}/files/{fileId}
```

---

## 4. Leave Management

### Time Off Categories

```http
GET    /api/time-off-categories
POST   /api/time-off-categories
GET    /api/time-off-categories/{id}
PUT    /api/time-off-categories/{id}
DELETE /api/time-off-categories/{id}
```

**Create Request:**

```json
{
    "title": "Annual Leave",
    "annual_allowance": 20,
    "is_paid": true,
    "is_carry_forward_allowed": true,
    "max_carry_forward_days": 5
}
```

### Time Off Requests

```http
GET    /api/time-off-requests
POST   /api/time-off-requests
GET    /api/time-off-requests/{id}
PUT    /api/time-off-requests/{id}
DELETE /api/time-off-requests/{id}
POST   /api/time-off-requests/{id}/process   # Approve/Decline
GET    /api/time-off-balance                 # Get leave balance
```

**Create Request:**

```json
{
    "staff_member_id": 1,
    "time_off_category_id": 1,
    "start_date": "2024-12-20",
    "end_date": "2024-12-25",
    "reason": "Family vacation"
}
```

**Process Request:**

```json
{
    "action": "approve",  // or "decline"
    "remarks": "Approved. Enjoy your vacation!"
}
```

**Get Balance:**

```
GET /api/time-off-balance?staff_member_id=1&year=2024
```

---

## 5. Attendance Management

### Work Logs

```http
GET    /api/work-logs
POST   /api/work-logs
GET    /api/work-logs/{id}
PUT    /api/work-logs/{id}
DELETE /api/work-logs/{id}
POST   /api/clock-in                         # Quick clock in
POST   /api/clock-out                        # Quick clock out
POST   /api/work-logs/bulk                   # Bulk create
GET    /api/attendance-summary               # Monthly summary
```

**Clock In/Out Response:**

```json
{
    "success": true,
    "message": "Clocked in successfully",
    "data": {
        "id": 1,
        "log_date": "2024-12-16",
        "clock_in": "09:05",
        "clock_out": null,
        "status": "present"
    }
}
```

**Bulk Create:**

```json
{
    "logs": [
        { "staff_member_id": 1, "log_date": "2024-12-15", "status": "present", "clock_in": "09:00", "clock_out": "18:00" },
        { "staff_member_id": 1, "log_date": "2024-12-14", "status": "absent" }
    ]
}
```

---

## 6. Payroll Management

### Salary Components

```http
# Benefits
GET/POST/PUT/DELETE /api/staff-benefits

# Incentives/Commissions
GET/POST/PUT/DELETE /api/incentive-records

# Salary Advances (Loans)
GET/POST/PUT/DELETE /api/salary-advances
POST /api/salary-advances/{id}/payment       # Record payment

# Recurring Deductions
GET/POST/PUT/DELETE /api/recurring-deductions

# Bonus Payments
GET/POST/PUT/DELETE /api/bonus-payments

# Overtime
GET/POST/PUT/DELETE /api/extra-hours-records

# Employer Contributions
GET/POST/PUT/DELETE /api/employer-contributions
```

### Payslip Generation

```http
GET    /api/salary-slips                     # List
POST   /api/salary-slips/generate            # Generate single
POST   /api/salary-slips/bulk-generate       # Generate for all staff
GET    /api/salary-slips/{id}                # Show with breakdowns
POST   /api/salary-slips/{id}/mark-paid      # Mark as paid
DELETE /api/salary-slips/{id}                # Delete (only if not paid)
```

**Generate Payslip:**

```json
{
    "staff_member_id": 1,
    "salary_period": "2024-12"
}
```

**Response:**

```json
{
    "success": true,
    "data": {
        "id": 1,
        "slip_reference": "SLP-20241216-A1B2",
        "salary_period": "2024-12",
        "basic_salary": 75000,
        "benefits_breakdown": [...],
        "deductions_breakdown": [...],
        "tax_breakdown": {...},
        "total_earnings": 82500,
        "total_deductions": 12500,
        "net_payable": 70000,
        "status": "generated"
    }
}
```

---

## 7. Tax Management

### Tax Slabs

```http
GET    /api/tax-slabs
POST   /api/tax-slabs
PUT    /api/tax-slabs/{id}
DELETE /api/tax-slabs/{id}
POST   /api/tax-slabs/calculate              # Calculate tax
```

**Calculate Tax:**

```json
{ "income": 100000 }
```

### Tax Exemptions & Limits

```http
GET/POST/PUT/DELETE /api/tax-exemptions
GET/POST/PUT/DELETE /api/minimum-tax-limits
```

---

## 8. Events & Calendar

### Company Events

```http
GET    /api/company-events
POST   /api/company-events
GET    /api/company-events/{id}
PUT    /api/company-events/{id}
DELETE /api/company-events/{id}
POST   /api/company-events/{id}/rsvp         # RSVP to event
GET    /api/calendar-data                    # Unified calendar
```

**Calendar Data Query:**

```
GET /api/calendar-data?start_date=2024-12-01&end_date=2024-12-31
```

**Response:**

```json
{
    "success": true,
    "data": [
        { "id": "event_1", "title": "Team Meeting", "start": "2024-12-20", "color": "#3b82f6", "type": "event" },
        { "id": "holiday_1", "title": "Christmas", "start": "2024-12-25", "color": "#dc2626", "type": "holiday" },
        { "id": "leave_1", "title": "John Doe - Annual Leave", "start": "2024-12-23", "color": "#f59e0b", "type": "leave" }
    ]
}
```

---

## 9. Reports & Dashboard

### Dashboard

```http
GET /api/dashboard
```

**Response:**

```json
{
    "success": true,
    "data": {
        "employees": { "total": 150, "active": 145, "new_this_month": 3 },
        "attendance_today": { "present": 120, "absent": 15, "not_marked": 10 },
        "leave_requests": { "pending": 5, "approved_this_month": 12 },
        "payroll": { "period": "2024-12", "generated": 145, "paid": 100 },
        "upcoming_events": [...],
        "recent_announcements": [...]
    }
}
```

### Reports

```http
GET /api/reports/attendance?month=2024-12
GET /api/reports/leave?year=2024&month=12
GET /api/reports/payroll?salary_period=2024-12
GET /api/reports/headcount
```

---

## 10. DataTables (Server-Side)

```http
GET /api/datatables/staff-members
GET /api/datatables/attendance
GET /api/datatables/leave-requests
GET /api/datatables/payslips
```

**Query Parameters:**

- `search` - Global search term
- `sort_column` - Column to sort by
- `sort_direction` - asc/desc
- `per_page` - Items per page
- `page` - Page number
- Filter-specific parameters

---

## 11. Import/Export

### Import

```http
GET    /api/imports                          # List imports
GET    /api/imports/template?type=staff_members
POST   /api/imports/staff-members            # Upload CSV
POST   /api/imports/attendance               # Upload CSV
POST   /api/imports/holidays                 # Upload CSV
GET    /api/imports/{id}                     # Check status
```

### Export

```http
GET /api/exports/staff-members
GET /api/exports/attendance?start_date=2024-12-01&end_date=2024-12-31
GET /api/exports/leaves?year=2024
GET /api/exports/payroll?salary_period=2024-12
```

---

## 12. Performance & Appraisals

### Performance Objectives

```http
GET    /api/performance-objectives
POST   /api/performance-objectives
PUT    /api/performance-objectives/{id}
DELETE /api/performance-objectives/{id}
POST   /api/performance-objectives/{id}/progress
POST   /api/performance-objectives/{id}/rate
```

### Appraisal Cycles

```http
GET    /api/appraisal-cycles
POST   /api/appraisal-cycles
PUT    /api/appraisal-cycles/{id}
DELETE /api/appraisal-cycles/{id}
POST   /api/appraisal-cycles/{id}/activate
POST   /api/appraisal-cycles/{id}/close
```

### Appraisal Records

```http
GET    /api/appraisal-records
GET    /api/appraisal-records/{id}
POST   /api/appraisal-records/{id}/self-review
POST   /api/appraisal-records/{id}/manager-review
GET    /api/my-appraisals
```

---

## Error Responses

### 401 Unauthorized

```json
{ "message": "Unauthenticated." }
```

### 403 Forbidden

```json
{ "success": false, "message": "Unauthorized action." }
```

### 404 Not Found

```json
{ "success": false, "message": "Resource not found." }
```

### 422 Validation Error

```json
{
    "message": "The given data was invalid.",
    "errors": {
        "email": ["The email field is required."],
        "password": ["The password must be at least 8 characters."]
    }
}
```

### 500 Server Error

```json
{ "success": false, "message": "Internal server error." }
```

---

## Pagination

Paginated responses include:

```json
{
    "success": true,
    "data": {
        "current_page": 1,
        "data": [...],
        "first_page_url": "...",
        "last_page": 10,
        "per_page": 15,
        "total": 150
    }
}
```

---

## Rate Limiting

Default rate limits:

- 60 requests per minute for authenticated users
- 10 requests per minute for unauthenticated endpoints

---

## Postman Collection

Import the provided Postman collection for easy API testing:
[Download Collection](./postman_collection.json)
