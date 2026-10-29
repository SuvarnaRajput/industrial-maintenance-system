-- ==========================================================
-- Industrial Maintenance Management System Database Schema
--
-- Idempotent script: Creates tables only if they do not exist.
-- Safe for fresh cloud databases or existing local databases.
-- Does NOT drop, overwrite, or delete any existing data.
-- ==========================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Equipment')
BEGIN
    CREATE TABLE Equipment (
        EquipmentID INT IDENTITY(1,1) PRIMARY KEY,
        EquipmentName VARCHAR(100) NOT NULL,
        Location VARCHAR(100) NOT NULL,
        Status VARCHAR(30) DEFAULT 'Active',
        CreatedAt DATETIME DEFAULT GETDATE()
    );
    PRINT 'Table Equipment created successfully.';
END
ELSE
BEGIN
    PRINT 'Table Equipment already exists. Skipping creation to preserve data.';
END;
