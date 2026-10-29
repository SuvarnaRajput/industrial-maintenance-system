require("dotenv").config();
const sql = require("mssql/msnodesqlv8");

// Database configuration using Windows Authentication (Trusted Connection)
const server = process.env.DB_SERVER || "localhost";
const database = process.env.DB_NAME || "IndustrialMaintenanceDB";
const driver = process.env.DB_ODBC_DRIVER || "ODBC Driver 18 for SQL Server";

const connectionString = `Driver={${driver}};Server=${server};Database=${database};Trusted_Connection=yes;TrustServerCertificate=yes;`;

let pool = null;

/**
 * Returns a singleton connection pool to the SQL Server database.
 */
async function getPool() {
    if (!pool) {
        try {
            pool = await sql.connect({ connectionString });
            console.log(`Connected to SQL Server (${database} on ${server}) via Windows Authentication`);
        } catch (error) {
            console.error("Failed to connect to SQL Server:", error.message);
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
    sql,
    getPool,
    closePool
};
