-- Initial PostgreSQL setup for FinTrack
-- This script runs when the PostgreSQL container starts for the first time

-- Create the main database if it doesn't exist
-- (This is handled by the POSTGRES_DB environment variable in docker-compose)

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types that might be needed
-- (These will be created by Prisma migrations, but defining here for reference)

-- Set timezone
SET timezone = 'UTC';

-- Create indexes that might be useful for performance
-- (These will be created by Prisma, but can be customized here)

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'FinTrack database initialized successfully!';
    RAISE NOTICE 'UUID extension enabled';
    RAISE NOTICE 'Timezone set to UTC';
END $$;