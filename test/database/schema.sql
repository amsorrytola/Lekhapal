-- Create the 'tables' table to store metadata for each extracted table
CREATE TABLE tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  columns JSONB, -- Stores the column headers and types as a flexible JSONB object
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create the 'rows' table to store the actual data from each table
CREATE TABLE rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID REFERENCES public.tables(id) ON DELETE CASCADE,
  data JSONB, -- Stores the entire row as a key-value pair object (e.g., {"Name": "John", "Age": 30})
  row_index INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create the 'scans' table to log each image upload and associate it with a table
CREATE TABLE scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID REFERENCES public.tables(id) ON DELETE CASCADE,
  scanned_at TIMESTAMPTZ DEFAULT now(),
  image_url TEXT -- You can store the image URL here if you save it to Supabase Storage
);

-- Create the 'edit_history' table to track all changes to a row
CREATE TABLE edit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id UUID REFERENCES public.rows(id) ON DELETE CASCADE,
  old_data JSONB,
  new_data JSONB,
  changed_at TIMESTAMPTZ DEFAULT now()
);

-- Set up Row-Level Security (RLS) to ensure data is protected
-- and to allow inserts and updates from your application.
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE edit_history ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert, select, update, and delete
-- You may want to refine these policies based on your exact app logic
CREATE POLICY "Allow all access to tables" ON tables FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow all access to rows" ON rows FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow all access to scans" ON scans FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow all access to edit history" ON edit_history FOR ALL USING (auth.uid() IS NOT NULL);
