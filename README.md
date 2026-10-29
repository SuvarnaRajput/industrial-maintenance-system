# Industrial Maintenance Management System

A full-stack web application for managing industrial equipment and maintenance requests.

---

## 🛠️ Technology Stack
* **Frontend:** Vanilla HTML5, CSS3, JavaScript (Fetch API, DOM manipulation)
* **Backend:** Node.js, Express.js
* **Database:** Microsoft SQL Server (Local instance, Windows Authentication)
* **Version Control:** Git & GitHub

---

## ⚙️ Architecture

```
[ Browser Frontend ]            [ Express REST API ]            [ Microsoft SQL Server ]
index.html / script.js   <--->    server.js (Port 3000)   <--->  IndustrialMaintenanceDB
(User Interface)                   (Node.js + db.js)               (Equipment Table)
```

1. **Frontend:** Displays metrics, the equipment registration form, and the list of registered equipment.
2. **Backend:** Express API handles data validation and executes parameterized SQL queries against Microsoft SQL Server.
3. **Database:** Persists equipment records with auto-incrementing `EquipmentID` and automatic timestamps.

---

## 🚀 Getting Started

### 1. Prerequisites
* **Node.js** (v18 or higher recommended)
* **Microsoft SQL Server** running locally with:
  * Database: `IndustrialMaintenanceDB`
  * Table: `Equipment` (`EquipmentID`, `EquipmentName`, `Location`, `Status`, `CreatedAt`)
  * Windows Authentication enabled (default for local SQL Server installations).

### 2. Installation
Open your terminal in the project directory and install the required dependencies:
```bash
npm install
```

### 3. Environment Configuration
The project uses a `.env` file to configure server and database options. A template is provided in `.env.example`:
```env
PORT=3000
DB_SERVER=localhost
DB_NAME=IndustrialMaintenanceDB
DB_PORT=1433
```
> **Note:** Because Windows Authentication (Trusted Connection) is used, **no passwords or secrets** are stored in `.env`.

### 4. Running the Application
Start the Express server:
```bash
npm start
```

Once started, open your web browser and navigate to:
```
http://localhost:3000
```

---

## 📡 REST API Reference

| Method | Endpoint | Description | Request Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/equipment` | Retrieve all equipment records | None |
| `POST` | `/api/equipment` | Add a new equipment record | `{ "name": "...", "location": "..." }` |
| `PUT` | `/api/equipment/:id` | Update an existing equipment record | `{ "name": "...", "location": "..." }` |
| `DELETE` | `/api/equipment/:id` | Delete an equipment record by ID | None |

---

## 🔒 Security Best Practices
* **Zero Password Exposure:** Uses Windows Integrated Security (`Trusted_Connection=yes`) for local SQL Server communication.
* **SQL Injection Prevention:** All SQL queries use parameterized inputs (`request.input(...)`).
* **Environment Isolation:** `.env` and `node_modules/` are strictly excluded from Git tracking via `.gitignore`.
