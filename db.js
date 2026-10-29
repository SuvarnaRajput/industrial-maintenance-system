require("dotenv").config();

let sql = null;
let pool = null;

// Determine connection strategy based on environment variables
const isCloudAuth = Boolean(process.env.DB_USER && process.env.DB_PASSWORD);

/**
 * Returns a singleton connection pool to the SQL Server database.
 * Supports both Cloud (SQL Authentication / tedious) and Local (Windows Authentication / msnodesqlv8).
 */
async function getPool() {
    if (pool) {
        return pool;
    }

    const server = process.env.DB_SERVER || "localhost";
    const database = process.env.DB_NAME || "IndustrialMaintenanceDB";
    const port = parseInt(process.env.DB_PORT, 10) || 1433;

    if (isCloudAuth) {
        // ==========================================
        // 1. Cloud Mode (Azure SQL / AWS RDS / SQL Auth)
        // Uses standard pure-JS 'tedious' driver (works on Linux and Windows)
        // ==========================================
        sql = require("mssql");
        const isEncrypt = process.env.DB_ENCRYPT !== "false"; // Default true for cloud databases
        const isTrustServerCert = process.env.DB_TRUST_SERVER_CERT === "true";

        const cloudConfig = {
            server,
            port,
            database,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            options: {
                encrypt: isEncrypt,
                trustServerCertificate: isTrustServerCert
            },
            pool: {
                max: 10,
                min: 0,
                idleTimeoutMillis: 30000
            }
        };

        try {
            pool = await sql.connect(cloudConfig);
            console.log(`Connected to SQL Server (${database} on ${server}) via SQL Authentication`);
        } catch (error) {
            console.error("Failed to connect to Cloud SQL Server:", error.message);
            throw error;
        }
    } else {
        // ==========================================
        // 2. Local Mode (Windows Authentication / Trusted Connection)
        // Uses 'msnodesqlv8' native driver
        // ==========================================
        if (process.platform !== "win32") {
            throw new Error(
                "Windows Authentication is only supported on Windows. " +
                "For Linux / cloud deployment, please configure DB_USER and DB_PASSWORD."
            );
        }

        sql = require("mssql/msnodesqlv8");
        const driver = process.env.DB_ODBC_DRIVER || "ODBC Driver 18 for SQL Server";
        const connectionString = `Driver={${driver}};Server=${server};Database=${database};Trusted_Connection=yes;TrustServerCertificate=yes;`;

        try {
            pool = await sql.connect({ connectionString });
            console.log(`Connected to SQL Server (${database} on ${server}) via Windows Authentication`);
        } catch (error) {
            console.error("Failed to connect to Local SQL Server:", error.message);
            throw error;
        }
    }

    return pool;
}

/**
 * Closes the SQL Server connection pool cleanly.
 */
async function closePool() {
    if (pool) {
        try {
            await pool.close();
            pool = null;
            console.log("SQL Server connection pool closed cleanly.");
        } catch (error) {
            console.error("Error closing SQL Server pool:", error.message);
        }
    }
}

module.exports = {
    get sql() {
        if (!sql) {
            sql = isCloudAuth ? require("mssql") : require("mssql/msnodesqlv8");
        }
        return sql;
    },
    getPool,
    closePool
};
