# HRMS - Human Resource Management System

A comprehensive Human Resource Management System built with Laravel (Backend) and React (Frontend).

## Overview

HRMS is a full-featured HR management solution that helps organizations streamline their HR operations, from employee management to payroll processing.

## Features

### Core Modules

- **Employee Management** - Complete employee lifecycle management
- **Attendance Tracking** - Clock in/out, shift management, overtime
- **Leave Management** - Leave requests, approvals, balance tracking
- **Payroll Processing** - Salary setup, payslip generation, pay runs
- **Recruitment** - Job postings, candidate tracking, interviews
- **Performance Management** - Goals, appraisals, reviews

### Additional Modules

- **Asset Management** - Track company assets and assignments
- **Training Management** - Training programs and enrollment
- **Contract Management** - Employee contracts and renewals
- **Meeting Management** - Schedule and track meetings
- **Document Management** - Store and manage documents
- **Event Management** - Company events and holidays
- **Announcements** - Company-wide announcements
- **Reports** - Attendance, leave, payroll, and custom reports

## Tech Stack

### Backend

- **Framework:** Laravel 10+
- **Database:** MySQL 8.0+
- **Authentication:** Laravel Sanctum
- **API:** RESTful API

### Frontend

- **Framework:** React 18+
- **Build Tool:** Vite
- **Routing:** React Router v6
- **Icons:** Lucide React
- **HTTP Client:** Axios

## Quick Start

### Backend Setup

```bash
cd hrms
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## API Documentation

See [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) for complete API reference.

## Postman Collection

Import the Postman collection from `postman/HRMS_API.postman_collection.json` for API testing.

## Default Credentials

```
Email: admin@hrms.local
Password: password
```

## Project Structure

```
hrms/
├── app/
│   ├── Http/Controllers/    # API Controllers
│   ├── Models/              # Eloquent Models
│   └── Services/            # Business Logic
├── database/
│   ├── migrations/          # Database Migrations
│   └── seeders/             # Database Seeders
├── docs/                    # Documentation
├── postman/                 # Postman Collection
├── routes/
│   └── api.php              # API Routes
└── tests/                   # Test Cases

frontend/
├── src/
│   ├── components/          # React Components
│   ├── pages/               # Page Components
│   ├── services/            # API Services
│   └── App.jsx              # Main App
└── public/                  # Static Assets
```

## License

MIT License
