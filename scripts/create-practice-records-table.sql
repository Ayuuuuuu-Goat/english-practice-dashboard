-- Create practice_records table
CREATE TABLE IF NOT EXISTS practice_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_name TEXT NOT NULL,
  date DATE NOT NULL,
  duration INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_practice_records_member_name ON practice_records(member_name);
CREATE INDEX IF NOT EXISTS idx_practice_records_date ON practice_records(date);

-- Enable Row Level Security
ALTER TABLE practice_records ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (you can restrict this later)
CREATE POLICY "Enable all operations for all users" ON practice_records
  FOR ALL
  USING (true)
  WITH CHECK (true);
