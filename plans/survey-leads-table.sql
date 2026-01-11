-- Create survey_leads table for tracking guest emails and their associated surveys
-- This table stores emails from non-logged-in users who request email results
-- When users sign up or log in, their surveys are linked to their account via email matching

-- Create the survey_leads table
CREATE TABLE IF NOT EXISTS survey_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  converted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index on email for fast lookups when checking for existing leads or merging on signup/login
CREATE INDEX IF NOT EXISTS idx_survey_leads_email ON survey_leads(email);

-- Create index on converted flag to quickly find unconverted leads for merging
CREATE INDEX IF NOT EXISTS idx_survey_leads_converted ON survey_leads(converted) WHERE converted = false;

-- Create index on property_id for quick lookups when linking surveys
CREATE INDEX IF NOT EXISTS idx_survey_leads_property_id ON survey_leads(property_id);

-- Create unique constraint to prevent duplicate entries for same email + property_id combination
-- This ensures we don't create duplicate leads if someone requests email multiple times
CREATE UNIQUE INDEX IF NOT EXISTS idx_survey_leads_email_property_unique ON survey_leads(email, property_id);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_survey_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists (to allow re-running the script)
DROP TRIGGER IF EXISTS update_survey_leads_updated_at ON survey_leads;

-- Create trigger to automatically update updated_at on row update
CREATE TRIGGER update_survey_leads_updated_at
  BEFORE UPDATE ON survey_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_survey_leads_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE survey_leads ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist (to allow re-running the script)
DROP POLICY IF EXISTS "Service role can manage survey_leads" ON survey_leads;
DROP POLICY IF EXISTS "Users can view their own survey leads" ON survey_leads;

-- Create policy to allow service role (backend) to perform all operations
-- In production, you'll want more restrictive policies
CREATE POLICY "Service role can manage survey_leads"
  ON survey_leads
  FOR ALL
  USING (auth.role() = 'service_role');

-- Optional: Create policy for authenticated users to view their own leads (if needed in future)
-- This allows users to see if they have any unconverted surveys
CREATE POLICY "Users can view their own survey leads"
  ON survey_leads
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = survey_leads.property_id
      AND properties.user_id = auth.uid()
    )
  );

-- Add comments for documentation
COMMENT ON TABLE survey_leads IS 'Stores email addresses from guest users who request survey results via email. When users sign up or log in, surveys are linked to their accounts and this record is marked as converted.';
COMMENT ON COLUMN survey_leads.id IS 'Primary key - unique identifier for each lead record';
COMMENT ON COLUMN survey_leads.email IS 'Email address provided by guest user. Used to match with auth.users and merge surveys on signup/login.';
COMMENT ON COLUMN survey_leads.property_id IS 'Foreign key to properties table. References the survey/property record that was emailed to the guest.';
COMMENT ON COLUMN survey_leads.converted IS 'Flag indicating if this lead has been converted to a user account. Set to true when survey is linked to user_id on signup/login.';
COMMENT ON COLUMN survey_leads.created_at IS 'Timestamp when the lead was created (when guest requested email results)';
COMMENT ON COLUMN survey_leads.updated_at IS 'Timestamp when the lead was last updated (automatically updated by trigger)';


