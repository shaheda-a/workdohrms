# 🏢 WorkDo HRMS - Human Resource Management System

[![Laravel](https://img.shields.io/badge/Laravel-11.x-red.svg)](https://laravel.com)
[![PHP](https://img.shields.io/badge/PHP-8.2+-blue.svg)](https://php.net)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A comprehensive Human Resource Management System API built with Laravel 11 and Spatie Laravel Permission.

## ✨ Features

### 👥 Staff Management

- Complete employee lifecycle management
- Organization structure (locations, divisions, job titles)
- Staff files and documents
- Recognition and awards
- Promotions and transfers
- Warnings and discipline

### ⏰ Attendance & Leave

- Clock in/out functionality
- Work logs with overtime tracking
- Leave categories and requests
- Leave balance management
- Bulk attendance import

### 💰 Payroll

- Salary components (benefits, deductions, bonuses)
- Automated payslip generation
- Tax calculation with slabs
- Salary advances/loans
- Employer contributions

### 📅 Events & Communication

- Company events with RSVP
- Announcements/notices
- Company holidays
- Unified calendar view

### 📊 Reports & Analytics

- Dashboard with key metrics
- Attendance reports
- Leave reports
- Payroll reports
- Headcount analysis

### 🔐 Security

- Role-based access control (RBAC)
- Sanctum API authentication
- IP whitelisting
- Secure password reset

### ⚙️ Administration

- System configurations
- Company policies with acknowledgment
- Letter templates (joining, experience, NOC)
- Data import/export

### 📈 Performance Management

- KPIs and goals
- Appraisal cycles
- Self and manager reviews

---

## 🚀 Quick Start

### Prerequisites

- PHP >= 8.2
- Composer >= 2.0
- MySQL >= 8.0
- Node.js >= 18 (optional)

### Installation

```bash
# Clone repository
git clone https://github.com/01fe23bcs183/workdohrms.git
cd workdohrms/hrms

# Install dependencies
composer install

# Configure environment
cp .env.example .env
php artisan key:generate

# Set database credentials in .env
# DB_DATABASE=hrms
# DB_USERNAME=root
# DB_PASSWORD=your_password

# Run migrations and seed
php artisan migrate
php artisan db:seed --class=AccessSeeder

# Start server
php artisan serve
```

The API is available at: `http://localhost:8000/api`

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [API Documentation](docs/API_DOCUMENTATION.md) | Complete API reference |
| [Frontend Guide](docs/FRONTEND_GUIDE.md) | React/Vue integration examples |
| [Setup Guide](docs/SETUP_GUIDE.md) | Installation & deployment |

---

## 🔑 Default Users

| Role | Email | Password |
|------|-------|----------|
| Administrator | <admin@hrms.local> | password |
| Manager | <manager@hrms.local> | password |
| HR Officer | <hr@hrms.local> | password |
| Staff Member | <staff@hrms.local> | password |

---

## 📡 API Overview

### Authentication

```http
POST /api/auth/sign-up        # Register
POST /api/auth/sign-in        # Login
POST /api/auth/sign-out       # Logout
GET  /api/auth/profile        # Get profile
```

### Core Resources

```http
# Staff Management
GET/POST/PUT/DELETE /api/staff-members

# Attendance
POST /api/clock-in
POST /api/clock-out
GET  /api/work-logs

# Leave Management
GET/POST /api/time-off-requests
POST     /api/time-off-requests/{id}/process

# Payroll
POST /api/salary-slips/generate
POST /api/salary-slips/bulk-generate
```

### Reports

```http
GET /api/dashboard
GET /api/reports/attendance
GET /api/reports/leave
GET /api/reports/payroll
```

---

## 🧪 Testing

```bash
# Run all tests
php artisan test

# Run specific test suite
php artisan test --filter=AuthenticationTest
php artisan test --filter=LeaveManagementTest

# With coverage report
php artisan test --coverage
```

---

## 📊 API Statistics

| Metric | Count |
|--------|-------|
| Total Routes | 288 |
| Controllers | 50+ |
| Models | 50+ |
| Migrations | 45+ |

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Laravel 11 |
| PHP Version | 8.2+ |
| Database | MySQL 8.0 |
| Authentication | Laravel Sanctum |
| Authorization | Spatie Laravel Permission |
| API Format | RESTful JSON |

---

## 📁 Project Structure

```
hrms/
├── app/
│   ├── Http/
│   │   ├── Controllers/Api/    # API Controllers
│   │   └── Resources/          # API Resources
│   └── Models/                 # Eloquent Models
├── database/
│   ├── factories/              # Model Factories
│   ├── migrations/             # Database Migrations
│   └── seeders/                # Database Seeders
├── docs/                       # Documentation
├── routes/
│   └── api.php                 # API Routes
└── tests/
    ├── Feature/                # Feature Tests
    └── Unit/                   # Unit Tests
```

---

## 🔒 Roles & Permissions

| Role | Description |
|------|-------------|
| `administrator` | Full system access |
| `manager` | Department management, approvals |
| `hr_officer` | HR functions, staff management |
| `staff_member` | Self-service functions |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open-sourced software licensed under the [MIT license](LICENSE).

---

## 📞 Support

- **GitHub Issues**: [Create an issue](https://github.com/01fe23bcs183/workdohrms/issues)
- **Email**: <support@hrms.local>

---

## 🙏 Acknowledgments

- [Laravel](https://laravel.com) - The PHP Framework
- [Spatie](https://spatie.be) - Laravel Permission Package
- [WorkDo HRM](https://workdo.io) - Inspiration reference

---

Made with ❤️ using Laravel
