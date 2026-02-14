-- Create bookmarks table
CREATE TABLE bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create index on user_id for faster queries
CREATE INDEX bookmarks_user_id_idx ON bookmarks(user_id);

-- Create index on created_at for sorting
CREATE INDEX bookmarks_created_at_idx ON bookmarks(created_at DESC);

-- Enable Row Level Security
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own bookmarks
CREATE POLICY "Users can view their own bookmarks"
  ON bookmarks
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: Users can insert their own bookmarks
CREATE POLICY "Users can insert their own bookmarks"
  ON bookmarks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own bookmarks
CREATE POLICY "Users can update their own bookmarks"
  ON bookmarks
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can delete their own bookmarks
CREATE POLICY "Users can delete their own bookmarks"
  ON bookmarks
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_bookmarks_updated_at
  BEFORE UPDATE ON bookmarks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();