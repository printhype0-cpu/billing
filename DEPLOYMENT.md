# Tech Wizardry CRM — Deployment Guide

## Prerequisites
- Node.js 18+
- MySQL 8.x (production) or SQLite (dev only)
- A long, random JWT secret

## Environment Variables
Set these in backend/.env:

```
NODE_ENV=production
JWT_SECRET=<your-long-random-secret>
ALLOWED_ORIGINS=http://your-frontend-domain

# MySQL
MYSQL_HOST=<host>
MYSQL_PORT=3306
MYSQL_USER=<user>
MYSQL_PASSWORD=<password>
MYSQL_DB=<database>

# Bootstrap
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=<strong-password>
```

## Database Setup (MySQL)
1) Create schema/tables:
```
cd backend
npm run db:init:mysql
```

2) Bootstrap the first admin:
```
cd backend
npm run bootstrap:admin
```

## Run Backend (Production)
```
cd backend
npm run build
npm run start:prod
```

## Frontend
Run your frontend build/serve as usual and ensure CORS origin matches ALLOWED_ORIGINS.

## Notes
- No demo data is seeded in production.
- Admin bootstrap resets the admin’s password to ADMIN_PASSWORD if the user exists.
- Update ALLOWED_ORIGINS to include your exact frontend URL(s). 
