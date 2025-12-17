# HRMS Setup Guide

## Prerequisites

- **PHP** >= 8.2
- **Composer** >= 2.0
- **MySQL** >= 8.0 (or MariaDB 10.4+)
- **Node.js** >= 18 (for frontend assets)
- **Git**

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/01fe23bcs183/workdohrms.git
cd workdohrms/hrms
```

### 2. Install PHP Dependencies

```bash
composer install
```

### 3. Environment Setup

```bash
# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate
```

### 4. Configure Database

Edit `.env` file:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=hrms
DB_USERNAME=root
DB_PASSWORD=your_password
```

### 5. Create Database

```sql
CREATE DATABASE hrms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 6. Run Migrations and Seeders

```bash
# Run all migrations
php artisan migrate

# Seed default roles and permissions
php artisan db:seed --class=AccessSeeder

# Optionally, seed demo data
php artisan db:seed --class=DemoDataSeeder
```

### 7. Create Storage Link

```bash
php artisan storage:link
```

### 8. Start Development Server

```bash
php artisan serve
```

The API is now available at: `http://localhost:8000/api`

---

## Default Users

After seeding, these accounts are available:

| Role | Email | Password |
|------|-------|----------|
| Administrator | <admin@hrms.local> | password |
| Manager | <manager@hrms.local> | password |
| HR Officer | <hr@hrms.local> | password |
| Staff Member | <staff@hrms.local> | password |

---

## Running Tests

```bash
# Run all tests
php artisan test

# Run specific test file
php artisan test --filter=AuthenticationTest

# Run with coverage
php artisan test --coverage
```

---

## Production Deployment

### 1. Environment Configuration

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.com

# Generate new key for production
php artisan key:generate --force
```

### 2. Optimize Application

```bash
# Cache configuration
php artisan config:cache

# Cache routes
php artisan route:cache

# Cache views
php artisan view:cache

# Optimize autoloader
composer install --optimize-autoloader --no-dev
```

### 3. File Permissions

```bash
chmod -R 755 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

### 4. Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/hrms/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

### 5. Queue Worker (Optional)

For background jobs:

```bash
# Using supervisor
[program:hrms-worker]
command=php /var/www/hrms/artisan queue:work --sleep=3 --tries=3
directory=/var/www/hrms
autostart=true
autorestart=true
user=www-data
numprocs=1
redirect_stderr=true
stdout_logfile=/var/log/hrms-worker.log
```

### 6. Scheduled Tasks

Add to crontab:

```bash
* * * * * cd /var/www/hrms && php artisan schedule:run >> /dev/null 2>&1
```

---

## Docker Deployment

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8000:80"
    volumes:
      - .:/var/www/html
      - storage:/var/www/html/storage
    environment:
      - DB_HOST=db
      - DB_DATABASE=hrms
      - DB_USERNAME=hrms
      - DB_PASSWORD=secret
    depends_on:
      - db

  db:
    image: mysql:8.0
    environment:
      - MYSQL_DATABASE=hrms
      - MYSQL_USER=hrms
      - MYSQL_PASSWORD=secret
      - MYSQL_ROOT_PASSWORD=root
    volumes:
      - db_data:/var/lib/mysql
    ports:
      - "3306:3306"

volumes:
  storage:
  db_data:
```

### Dockerfile

```dockerfile
FROM php:8.2-apache

# Install extensions
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip

RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Enable Apache mod_rewrite
RUN a2enmod rewrite

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy application
COPY . .

# Install dependencies
RUN composer install --optimize-autoloader --no-dev

# Set permissions
RUN chown -R www-data:www-data storage bootstrap/cache

# Configure Apache
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf

EXPOSE 80
```

---

## Troubleshooting

### Common Issues

**1. Permission Denied**

```bash
chmod -R 775 storage bootstrap/cache
```

**2. Class Not Found**

```bash
composer dump-autoload
```

**3. Migration Failed**

```bash
php artisan migrate:fresh --seed
```

**4. Token Mismatch**

```bash
php artisan config:clear
php artisan cache:clear
```

**5. 500 Internal Server Error**
Check `storage/logs/laravel.log` for details.

---

## API Testing with cURL

```bash
# Sign In
curl -X POST http://localhost:8000/api/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hrms.local","password":"password"}'

# Get Staff (with token)
curl http://localhost:8000/api/staff-members \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Support

- GitHub Issues: <https://github.com/01fe23bcs183/workdohrms/issues>
- Documentation: `/docs/API_DOCUMENTATION.md`
- Frontend Guide: `/docs/FRONTEND_GUIDE.md`
