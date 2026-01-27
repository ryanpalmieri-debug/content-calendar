-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- Create the posts table
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  channel TEXT NOT NULL DEFAULT 'twitter',
  scheduled_date DATE,
  scheduled_time TEXT DEFAULT '09:00',
  status TEXT NOT NULL DEFAULT 'draft',
  hashtags TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  pillar TEXT DEFAULT '',
  is_thread BOOLEAN DEFAULT false,
  thread_posts JSONB DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_by_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Create policy: All authenticated users can view all posts (team visibility)
CREATE POLICY "Team members can view all posts" ON posts
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy: All authenticated users can insert posts
CREATE POLICY "Team members can create posts" ON posts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy: All authenticated users can update any post
CREATE POLICY "Team members can update any post" ON posts
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create policy: All authenticated users can delete any post
CREATE POLICY "Team members can delete any post" ON posts
  FOR DELETE
  TO authenticated
  USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for posts table
ALTER PUBLICATION supabase_realtime ADD TABLE posts;
