-- Create schemas for each service (Prisma will manage tables within them)
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS orders;
CREATE SCHEMA IF NOT EXISTS inventory;
CREATE SCHEMA IF NOT EXISTS billing;

-- Grant privileges to the app user
GRANT ALL ON SCHEMA auth TO erp_user;
GRANT ALL ON SCHEMA orders TO erp_user;
GRANT ALL ON SCHEMA inventory TO erp_user;
GRANT ALL ON SCHEMA billing TO erp_user;
