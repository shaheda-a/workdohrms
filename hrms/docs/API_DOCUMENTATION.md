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

---

## 12. Asset Management

### Asset Types

```http
GET /api/asset-types              # List all asset types
POST /api/asset-types             # Create asset type
GET /api/asset-types/{id}         # Get asset type
PUT /api/asset-types/{id}         # Update asset type
DELETE /api/asset-types/{id}      # Delete asset type
```

**Create Asset Type Request:**

```json
{
    "title": "Laptop",
    "description": "Company laptops and notebooks",
    "depreciation_rate": 20.00
}
```

### Assets

```http
GET /api/assets                       # List all assets
POST /api/assets                      # Create asset
GET /api/assets/{id}                  # Get asset details
PUT /api/assets/{id}                  # Update asset
DELETE /api/assets/{id}               # Delete asset
POST /api/assets/{id}/assign          # Assign asset to employee
POST /api/assets/{id}/return          # Return asset
POST /api/assets/{id}/maintenance     # Mark for maintenance
GET /api/assets-available             # List available assets
GET /api/assets/employee/{id}         # Get assets by employee
```

**Create Asset Request:**

```json
{
    "name": "MacBook Pro 14\"",
    "asset_type_id": 1,
    "serial_number": "C02XL4RSJHD3",
    "purchase_date": "2024-01-15",
    "purchase_cost": 2499.00,
    "condition": "new",
    "location": "Main Office"
}
```

**Assign Asset Request:**

```json
{
    "staff_member_id": 1,
    "notes": "Assigned for development work"
}
```

---

## 13. Training Management

### Training Types

```http
GET /api/training-types              # List training types
POST /api/training-types             # Create training type
GET /api/training-types/{id}         # Get training type
PUT /api/training-types/{id}         # Update training type
DELETE /api/training-types/{id}      # Delete training type
```

### Training Programs

```http
GET /api/training-programs           # List programs
POST /api/training-programs          # Create program
GET /api/training-programs/{id}      # Get program
PUT /api/training-programs/{id}      # Update program
DELETE /api/training-programs/{id}   # Delete program
```

**Create Training Program Request:**

```json
{
    "title": "Leadership Development",
    "training_type_id": 1,
    "description": "Development program for managers",
    "duration": "2 weeks",
    "cost": 1500.00,
    "trainer_name": "John Smith",
    "trainer_type": "external"
}
```

### Training Sessions

```http
GET /api/training-sessions                    # List sessions
POST /api/training-sessions                   # Create session
GET /api/training-sessions/{id}               # Get session
PUT /api/training-sessions/{id}               # Update session
DELETE /api/training-sessions/{id}            # Delete session
POST /api/training-sessions/{id}/enroll       # Enroll employee
POST /api/training-sessions/{id}/complete     # Mark complete
GET /api/training/employee/{id}               # Employee trainings
```

---

## 14. Recruitment - Jobs

### Job Categories

```http
GET /api/job-categories              # List job categories
POST /api/job-categories             # Create category
GET /api/job-categories/{id}         # Get category
PUT /api/job-categories/{id}         # Update category
DELETE /api/job-categories/{id}      # Delete category
```

### Job Stages (Kanban)

```http
GET /api/job-stages                  # List stages
POST /api/job-stages                 # Create stage
PUT /api/job-stages/{id}             # Update stage
DELETE /api/job-stages/{id}          # Delete stage
POST /api/job-stages/reorder         # Reorder stages
```

### Jobs

```http
GET /api/jobs                        # List jobs
POST /api/jobs                       # Create job
GET /api/jobs/{id}                   # Get job details
PUT /api/jobs/{id}                   # Update job
DELETE /api/jobs/{id}                # Delete job
POST /api/jobs/{id}/publish          # Publish job
POST /api/jobs/{id}/close            # Close job
GET /api/jobs/{id}/questions         # Get custom questions
POST /api/jobs/{id}/questions        # Add custom question
```

**Create Job Request:**

```json
{
    "title": "Senior Developer",
    "job_category_id": 1,
    "office_location_id": 1,
    "division_id": 2,
    "positions": 2,
    "description": "We are looking for...",
    "requirements": "5+ years experience...",
    "skills": "PHP, Laravel, React",
    "experience_required": "5+ years",
    "salary_from": 80000,
    "salary_to": 120000,
    "start_date": "2024-01-01",
    "end_date": "2024-02-28"
}
```

---

## 15. Recruitment - Candidates

```http
GET /api/candidates                               # List candidates
POST /api/candidates                              # Create candidate
GET /api/candidates/{id}                          # Get candidate
PUT /api/candidates/{id}                          # Update candidate
DELETE /api/candidates/{id}                       # Delete candidate
POST /api/candidates/{id}/archive                 # Archive candidate
POST /api/candidates/{id}/convert-to-employee     # Convert to employee
```

**Create Candidate Request:**

```json
{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+1234567890",
    "date_of_birth": "1990-05-15",
    "gender": "female",
    "address": "123 Main St",
    "linkedin_url": "https://linkedin.com/in/janesmith",
    "source": "job_portal"
}
```

**Convert to Employee Request:**

```json
{
    "office_location_id": 1,
    "division_id": 2,
    "job_title_id": 3,
    "employee_id": "EMP-001",
    "join_date": "2024-02-01",
    "base_salary": 85000
}
```

---

## 16. Recruitment - Applications

```http
GET /api/job-applications                              # List all applications
POST /api/jobs/{job}/applications                      # Apply to job
GET /api/job-applications/{id}                         # Get application
POST /api/job-applications/{id}/move-stage             # Move to stage
POST /api/job-applications/{id}/rate                   # Rate application
POST /api/job-applications/{id}/notes                  # Add note
POST /api/job-applications/{id}/shortlist              # Shortlist candidate
POST /api/job-applications/{id}/reject                 # Reject application
POST /api/job-applications/{id}/hire                   # Mark as hired
```

**Apply to Job Request:**

```json
{
    "candidate_id": 1,
    "custom_answers": {
        "1": "Yes, I have 5 years experience",
        "2": "Available immediately"
    }
}
```

---

## 17. Recruitment - Interviews

```http
GET /api/interview-schedules                           # List interviews
POST /api/interview-schedules                          # Schedule interview
GET /api/interview-schedules/{id}                      # Get interview
PUT /api/interview-schedules/{id}                      # Update interview
DELETE /api/interview-schedules/{id}                   # Cancel interview
POST /api/interview-schedules/{id}/feedback            # Submit feedback
POST /api/interview-schedules/{id}/reschedule          # Reschedule
GET /api/interviews/calendar                           # Calendar view
GET /api/interviews/today                              # Today's interviews
```

**Schedule Interview Request:**

```json
{
    "job_application_id": 1,
    "interviewer_id": 5,
    "scheduled_date": "2024-01-20",
    "scheduled_time": "14:00",
    "duration_minutes": 60,
    "location": "Meeting Room A",
    "meeting_link": "https://zoom.us/j/123456"
}
```

**Submit Feedback Request:**

```json
{
    "feedback": "Excellent technical skills, good communication",
    "rating": 4,
    "recommendation": "proceed"
}
```

---

## 18. Onboarding Management

### Onboarding Templates

```http
GET /api/onboarding-templates                          # List templates
POST /api/onboarding-templates                         # Create template
GET /api/onboarding-templates/{id}                     # Get template
PUT /api/onboarding-templates/{id}                     # Update template
DELETE /api/onboarding-templates/{id}                  # Delete template
POST /api/onboarding-templates/{id}/tasks              # Add task to template
```

### Employee Onboarding

```http
GET /api/employee-onboardings                          # List all onboardings
POST /api/employee-onboardings                         # Assign onboarding
GET /api/employee-onboardings/{id}                     # Get onboarding details
POST /api/employee-onboardings/{id}/complete-task      # Complete a task
GET /api/onboardings/pending                           # Pending onboardings
```

---

## 19. Contract Management

```http
GET /api/contract-types                                # List contract types
POST /api/contract-types                               # Create type
GET /api/contracts                                     # List contracts
POST /api/contracts                                    # Create contract
GET /api/contracts/{id}                                # Get contract
PUT /api/contracts/{id}                                # Update contract
DELETE /api/contracts/{id}                             # Delete contract
POST /api/contracts/{id}/renew                         # Renew contract
POST /api/contracts/{id}/terminate                     # Terminate contract
GET /api/contracts-expiring                            # Expiring contracts
GET /api/contracts/employee/{staffMemberId}            # Employee contracts
```

**Renew Contract Request:**

```json
{
    "new_end_date": "2025-12-31",
    "new_salary": 95000,
    "notes": "Annual renewal with 10% increase"
}
```

---

## 20. Meeting Management

### Meeting Types & Rooms

```http
GET /api/meeting-types                                 # List meeting types
POST /api/meeting-types                                # Create type
GET /api/meeting-rooms                                 # List rooms
POST /api/meeting-rooms                                # Create room
GET /api/meeting-rooms-available                       # Available rooms
```

### Meetings

```http
GET /api/meetings                                      # List meetings
POST /api/meetings                                     # Create meeting
GET /api/meetings/{id}                                 # Get meeting
PUT /api/meetings/{id}                                 # Update meeting
DELETE /api/meetings/{id}                              # Delete meeting
POST /api/meetings/{id}/attendees                      # Add attendees
POST /api/meetings/{id}/start                          # Start meeting
POST /api/meetings/{id}/complete                       # Complete meeting
POST /api/meetings/{id}/minutes                        # Add minutes
POST /api/meetings/{id}/action-items                   # Add action item
GET /api/meetings-calendar                             # Calendar view
GET /api/my-meetings                                   # Current user's meetings
```

---

## 21. Shifts Management

```http
GET /api/shifts                                        # List shifts
POST /api/shifts                                       # Create shift
GET /api/shifts/{id}                                   # Get shift
PUT /api/shifts/{id}                                   # Update shift
DELETE /api/shifts/{id}                                # Delete shift
POST /api/shifts/{id}/assign                           # Assign to employee
GET /api/shift-roster                                  # Get shift roster
GET /api/shifts/employee/{staffMemberId}               # Employee shifts
```

**Create Shift Request:**

```json
{
    "name": "Morning Shift",
    "start_time": "09:00",
    "end_time": "17:00",
    "break_duration_minutes": 60,
    "is_night_shift": false,
    "overtime_after_hours": 8
}
```

---

## 22. Timesheets

### Projects

```http
GET /api/timesheet-projects                            # List projects
POST /api/timesheet-projects                           # Create project
GET /api/timesheet-projects/{id}                       # Get project
PUT /api/timesheet-projects/{id}                       # Update project
DELETE /api/timesheet-projects/{id}                    # Delete project
```

### Timesheets

```http
GET /api/timesheets                                    # List timesheets
POST /api/timesheets                                   # Create entry
GET /api/timesheets/{id}                               # Get entry
PUT /api/timesheets/{id}                               # Update entry
DELETE /api/timesheets/{id}                            # Delete entry
POST /api/timesheets/bulk                              # Bulk create
POST /api/timesheets/{id}/submit                       # Submit for approval
POST /api/timesheets/{id}/approve                      # Approve timesheet
POST /api/timesheets/{id}/reject                       # Reject timesheet
GET /api/timesheet-summary                             # Get summary
GET /api/timesheets/employee/{staffMemberId}           # Employee timesheets
GET /api/timesheet-report                              # Generate report
```

**Create Timesheet Entry:**

```json
{
    "staff_member_id": 1,
    "timesheet_project_id": 1,
    "date": "2024-01-15",
    "hours": 8,
    "task_description": "Development work on feature X",
    "is_billable": true
}
```
