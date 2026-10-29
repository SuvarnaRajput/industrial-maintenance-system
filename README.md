# Industrial Maintenance Management System

A production-ready full-stack web application for managing industrial equipment and maintenance requests.

---

## 🛠️ Technology Stack
* **Frontend:** Vanilla HTML5, CSS3, JavaScript (Served securely from `public/`)
* **Backend:** Node.js, Express.js (Security headers via Helmet, CORS, parameterized queries)
* **Database:** Microsoft SQL Server / Azure SQL Database (Dual-mode driver support)
* **Deployment Ready:** Health-check endpoint, `0.0.0.0` host binding, graceful shutdown, environment isolation

---

## ⚙️ Architecture

```
[ Web Browser ]  ──HTTP/S──>  [ Express Server (server.js) ]  ──SQL (TLS)──>  [ SQL Server Database ]
                                Hosts public/ (UI)                             IndustrialMaintenanceDB
                                REST APIs (/api/equipment)                     (Equipment Table)
                                Health (/api/health)
```

### Dual-Mode Database Support
The database module (`db.js`) automatically detects its runtime environment:
1. **Local Windows Development:** When `DB_USER` is empty, it uses `msnodesqlv8` with zero-password **Windows Integrated Authentication** (`Trusted_Connection=yes`).
2. **Cloud / Production:** When `DB_USER` and `DB_PASSWORD` are provided, it uses the cross-platform, pure-JavaScript `tedious` driver with TLS encryption (`encrypt: true`), running on Linux and Windows alike.

---

## 📁 Project Structure

```
industrial-maintenance-system/
├── public/                 # Static frontend files (secured from backend source code)
│   ├── index.html          # Dashboard & equipment UI
│   ├── style.css           # Responsive styling & themes
│   └── script.js           # Frontend API client & DOM manipulation
├── db.js                   # Dual-mode database connection pool & lifecycle
├── server.js               # Express application, REST endpoints, security & health check
├── schema.sql              # Idempotent database schema script
├── package.json            # Project dependencies & scripts
├── .env.example            # Configuration template (safe for Git)
├── .env                    # Local environment variables (excluded from Git)
├── .gitignore              # Ignores .env and node_modules/
└── README.md               # Documentation
```

---

## 🚀 Local Development Setup

### 1. Prerequisites
* **Node.js** (v18 or higher recommended)
* **Microsoft SQL Server** running locally with:
  * Database: `IndustrialMaintenanceDB`
  * Table: `Equipment` (can be created with `schema.sql`)
  * Windows Authentication enabled.

### 2. Installation
```bash
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env` if not already present:
```bash
cp .env.example .env
```
Default `.env` for local Windows Authentication:
```env
PORT=3000
HOST=0.0.0.0
NODE_ENV=development
DB_SERVER=localhost
DB_NAME=IndustrialMaintenanceDB
DB_PORT=1433
```
*(Leave `DB_USER` and `DB_PASSWORD` blank to use local Windows Authentication).*

### 4. Run the Application
```bash
npm start
```
Open your browser at:
```
http://localhost:3000
```

---

## ☁️ Cloud & Production Deployment Guide

### 1. Database Provisioning (Azure SQL or Cloud SQL Server)
1. In the [Azure Portal](https://portal.azure.com), create an **Azure SQL Database** (Serverless tier recommended).
2. Set the Server Firewall rule to: *"Allow Azure services and resources to access this server"*.
3. Open the built-in Azure Query Editor and run `schema.sql` to initialize the `Equipment` table safely without dropping or overwriting data.

### 2. Cloud Server Environment Variables
Configure these environment variables in your cloud hosting provider (Azure App Service, Render, etc.):

| Variable | Description | Example |
| :--- | :--- | :--- |
| `NODE_ENV` | Environment mode (masks internal SQL errors) | `production` |
| `PORT` | Listening port (assigned automatically by cloud) | `3000` |
| `HOST` | Bind address for container routing | `0.0.0.0` |
| `DB_SERVER` | Cloud SQL Server hostname | `your-server.database.windows.net` |
| `DB_NAME` | Database name | `IndustrialMaintenanceDB` |
| `DB_PORT` | SQL Server TCP port | `1433` |
| `DB_USER` | SQL Server Admin Username | `cloudadmin` |
| `DB_PASSWORD` | SQL Server Admin Password | `YourStrongPassword!` |
| `DB_ENCRYPT` | Enforce TLS Encryption | `true` |

---

## 📡 REST API Reference

| Method | Endpoint | Description | Status Codes |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service & database health check | `200` (OK), `503` (DB offline) |
| `GET` | `/api/equipment` | Retrieve all registered equipment | `200` (OK) |
| `POST` | `/api/equipment` | Add a new equipment record | `201` (Created), `400` (Validation error) |
| `PUT` | `/api/equipment/:id` | Update an existing equipment record | `200` (OK), `400` (Bad ID), `404` (Not found) |
| `DELETE` | `/api/equipment/:id` | Delete an equipment record by ID | `200` (OK), `400` (Bad ID), `404` (Not found) |

---

## 🔒 Security Best Practices
* **Asset Isolation:** Frontend files are isolated in `public/`. Express never serves server source files (`server.js`, `db.js`, `package.json`).
* **Helmet Security Headers:** Defends against XSS, clickjacking, MIME sniffing, and cross-site framing.
* **SQL Injection Prevention:** 100% of queries use parameterized inputs (`request.input(...)`).
* **Production Error Masking:** When `NODE_ENV=production`, internal database error messages are withheld from API responses.
* **Credential Protection:** Secrets are never hardcoded and `.env` is strictly excluded from Git tracking.
