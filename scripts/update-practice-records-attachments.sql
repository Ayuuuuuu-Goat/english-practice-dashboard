-- Add attachments column to store file URLs
ALTER TABLE practice_records ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb;

-- Add a comment to describe the attachments structure
COMMENT ON COLUMN practice_records.attachments IS 'Array of file objects with url, filename, size, and type';
