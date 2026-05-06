-- Timeless Series — Supabase Schema
-- Run this in the Supabase SQL editor

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  medium TEXT NOT NULL CHECK (medium IN ('book', 'film', 'tv show')),
  category TEXT NOT NULL CHECK (category IN (
    'How to Think',
    'How to Survive',
    'How to Thrive & Build',
    'How to Love & Be Loved',
    'How to Grieve & Face Loss',
    'How to Know Yourself',
    'How to be Human & Kind',
    'How to Lead & Serve',
    'How to Stay Alive Inside',
    'How to Face Power & Injustice'
  )),
  cover_image TEXT,
  timelessness_note TEXT NOT NULL,
  human_moment TEXT NOT NULL,
  contributor_name TEXT NOT NULL DEFAULT 'Anonymous',
  article_link TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX idx_entries_status_created ON entries (status, created_at DESC);
CREATE INDEX idx_entries_category ON entries (category) WHERE status = 'approved';
CREATE INDEX idx_entries_medium ON entries (medium) WHERE status = 'approved';

-- Row Level Security
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

-- Public: read approved entries only
CREATE POLICY "Public read approved"
  ON entries FOR SELECT
  USING (status = 'approved');

-- Allow inserts with pending status (API layer validates ACCESS_CODE)
CREATE POLICY "Insert as pending"
  ON entries FOR INSERT
  WITH CHECK (status = 'pending');

-- Allow status updates (API layer validates admin JWT cookie)
CREATE POLICY "Update status"
  ON entries FOR UPDATE
  USING (true)
  WITH CHECK (status IN ('pending', 'approved', 'rejected'));

-- Service role bypasses RLS automatically — the policies above are a safety
-- net for when the publishable key is used instead of the service role key.
