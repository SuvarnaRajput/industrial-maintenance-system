require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const { sql, getPool, closePool } = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";

// ==========================================
// Middleware & Security
// ==========================================
// Set security HTTP headers with safe CSP for UI elements
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:"],
                connectSrc: ["'self'"]
            }
        }
    })
);

app.use(cors());
app.use(express.json());

// Serve static frontend files exclusively from the public/ directory
app.use(express.static(path.join(__dirname, "public")));

// ==========================================
// Health-Check Endpoint (For Cloud Monitors)
// ==========================================
app.get("/api/health", async (req, res) => {
    try {
        const pool = await getPool();
        await pool.request().query("SELECT 1 AS healthy");
        res.json({
            status: "healthy",
            uptime: Math.floor(process.uptime()),
            database: "connected",
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(503).json({
            status: "unhealthy",
            uptime: Math.floor(process.uptime()),
            database: "disconnected",
            error: process.env.NODE_ENV === "production" ? "Database connection unavailable" : error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// ==========================================
// REST API Routes for Equipment
// ==========================================

/**
 * 1. GET /api/equipment
 * Returns all equipment ordered by newest first.
 */
app.get("/api/equipment", async (req, res, next) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT 
                EquipmentID, 
                EquipmentName, 
                Location, 
                Status, 
                CreatedAt 
            FROM Equipment 
            ORDER BY CreatedAt DESC, EquipmentID DESC
        `);

        // Map column names to clean JSON keys
        const equipment = result.recordset.map((item) => ({
            id: item.EquipmentID,
            name: item.EquipmentName,
            location: item.Location,
            status: item.Status || "Active",
            createdAt: item.CreatedAt
        }));

        res.json(equipment);
    } catch (error) {
        next(error);
    }
});

/**
 * 2. POST /api/equipment
 * Creates a new equipment record in SQL Server.
 */
app.post("/api/equipment", async (req, res, next) => {
    try {
        const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
        const location = typeof req.body.location === "string" ? req.body.location.trim() : "";
        const status = typeof req.body.status === "string" && req.body.status.trim() ? req.body.status.trim() : "Active";

        // Input validation
        if (!name || !location) {
            return res.status(400).json({
                error: "Equipment name and location are required."
            });
        }

        if (name.length > 100) {
            return res.status(400).json({
                error: "Equipment name cannot exceed 100 characters."
            });
        }

        if (location.length > 100) {
            return res.status(400).json({
                error: "Location cannot exceed 100 characters."
            });
        }

        const pool = await getPool();
        const request = pool.request();
        request.input("name", sql.VarChar(100), name);
        request.input("location", sql.VarChar(100), location);
        request.input("status", sql.VarChar(30), status);

        const result = await request.query(`
            INSERT INTO Equipment (EquipmentName, Location, Status)
            OUTPUT 
                INSERTED.EquipmentID, 
                INSERTED.EquipmentName, 
                INSERTED.Location, 
                INSERTED.Status, 
                INSERTED.CreatedAt
            VALUES (@name, @location, @status);
        `);

        const created = result.recordset[0];
        res.status(201).json({
            id: created.EquipmentID,
            name: created.EquipmentName,
            location: created.Location,
            status: created.Status,
            createdAt: created.CreatedAt
        });
    } catch (error) {
        next(error);
    }
});

/**
 * 3. PUT /api/equipment/:id
 * Updates an existing equipment record by its ID.
 */
app.put("/api/equipment/:id", async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({ error: "Invalid equipment ID." });
        }

        const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
        const location = typeof req.body.location === "string" ? req.body.location.trim() : "";
        const status = typeof req.body.status === "string" && req.body.status.trim() ? req.body.status.trim() : null;

        // Input validation
        if (!name || !location) {
            return res.status(400).json({
                error: "Equipment name and location are required."
            });
        }

        if (name.length > 100) {
            return res.status(400).json({
                error: "Equipment name cannot exceed 100 characters."
            });
        }

        if (location.length > 100) {
            return res.status(400).json({
                error: "Location cannot exceed 100 characters."
            });
        }

        const pool = await getPool();
        const request = pool.request();
        request.input("id", sql.Int, id);
        request.input("name", sql.VarChar(100), name);
        request.input("location", sql.VarChar(100), location);
        request.input("status", sql.VarChar(30), status);

        const result = await request.query(`
            UPDATE Equipment
            SET 
                EquipmentName = @name,
                Location = @location,
                Status = COALESCE(@status, Status)
            OUTPUT 
                INSERTED.EquipmentID, 
                INSERTED.EquipmentName, 
                INSERTED.Location, 
                INSERTED.Status, 
                INSERTED.CreatedAt
            WHERE EquipmentID = @id;
        `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: "Equipment not found." });
        }

        const updated = result.recordset[0];
        res.json({
            id: updated.EquipmentID,
            name: updated.EquipmentName,
            location: updated.Location,
            status: updated.Status,
            createdAt: updated.CreatedAt
        });
    } catch (error) {
        next(error);
    }
});

/**
 * 4. DELETE /api/equipment/:id
 * Deletes an equipment record by its ID.
 */
app.delete("/api/equipment/:id", async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({ error: "Invalid equipment ID." });
        }

        const pool = await getPool();
        const request = pool.request();
        request.input("id", sql.Int, id);

        const result = await request.query(`
            DELETE FROM Equipment
            OUTPUT DELETED.EquipmentID
            WHERE EquipmentID = @id;
        `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: "Equipment not found." });
        }

        res.json({
            message: "Equipment deleted successfully.",
            id: result.recordset[0].EquipmentID
        });
    } catch (error) {
        next(error);
    }
});

// Explicit route to serve index.html
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ==========================================
// Error Handling Middleware (Production Masking)
// ==========================================
app.use((err, req, res, next) => {
    console.error("Server Error:", err);
    const isProduction = process.env.NODE_ENV === "production";
    res.status(err.status || 500).json({
        error: "Internal Server Error",
        message: isProduction ? "An unexpected error occurred. Please try again later." : err.message
    });
});

// ==========================================
// Server Lifecycle & Graceful Shutdown
// ==========================================
let serverInstance = null;

function startServer(port = PORT, host = HOST) {
    return new Promise((resolve, reject) => {
        serverInstance = app.listen(port, host, async () => {
            console.log(`Industrial Maintenance server running at http://${host}:${port}`);
            try {
                await getPool();
                resolve(serverInstance);
            } catch (err) {
                console.error("Warning: Could not connect to SQL Server on startup:", err.message);
                resolve(serverInstance);
            }
        });
        serverInstance.on("error", reject);
    });
}

async function stopServer() {
    if (serverInstance) {
        await new Promise((resolve) => serverInstance.close(resolve));
        serverInstance = null;
        console.log("HTTP server closed.");
    }
    await closePool();
}

// Graceful signal handlers for Ctrl+C or process termination
process.on("SIGINT", async () => {
    console.log("\nReceived SIGINT. Shutting down gracefully...");
    await stopServer();
});

process.on("SIGTERM", async () => {
    console.log("\nReceived SIGTERM. Shutting down gracefully...");
    await stopServer();
});

// Start automatically when run directly: `node server.js`
if (require.main === module) {
    startServer();
}

module.exports = {
    app,
    startServer,
    stopServer
};
