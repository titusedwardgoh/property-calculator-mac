-- Add inspected to properties table
-- This tracks whether the user has inspected the property

ALTER TABLE properties
ADD COLUMN IF NOT EXISTS inspected BOOLEAN DEFAULT false;

-- Add comment to inspected
COMMENT ON COLUMN properties.inspected IS 'Indicates whether the user has inspected the property';

