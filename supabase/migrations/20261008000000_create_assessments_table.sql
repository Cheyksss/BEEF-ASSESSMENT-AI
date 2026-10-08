-- Migration: 20261008000000_create_assessments_table.sql
-- Description: Beef Quality Assessment System database schema and storage setup (Public Guest Access)

-- 1. Enable uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Assessments table
CREATE TABLE IF NOT EXISTS public.assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  freshness TEXT NOT NULL CHECK (freshness IN ('Fresh', 'Spoiled')),
  freshness_confidence NUMERIC(5, 2) NOT NULL CHECK (freshness_confidence >= 0 AND freshness_confidence <= 100),
  marbling TEXT NOT NULL CHECK (marbling IN ('small', 'slight', 'modest', 'moderate', 'slightly_abundant')),
  marbling_confidence NUMERIC(5, 2) NOT NULL CHECK (marbling_confidence >= 0 AND marbling_confidence <= 100),
  fat_ratio NUMERIC(5, 2) NOT NULL CHECK (fat_ratio >= 0 AND fat_ratio <= 100),
  fat_category TEXT NOT NULL CHECK (fat_category IN ('None', 'Small', 'Large')),
  meat_quality_score NUMERIC(4, 1) NOT NULL CHECK (meat_quality_score >= 0 AND meat_quality_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Indexes for query optimization
CREATE INDEX IF NOT EXISTS idx_user_created ON public.assessments (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_created ON public.assessments (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mqs ON public.assessments (meat_quality_score);
CREATE INDEX IF NOT EXISTS idx_freshness ON public.assessments (freshness);

-- 4. Row Level Security (RLS) on assessments table (allowing public access)
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own assessments" ON public.assessments;
DROP POLICY IF EXISTS "Public can view assessments" ON public.assessments;
CREATE POLICY "Public can view assessments"
  ON public.assessments FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert own assessments" ON public.assessments;
DROP POLICY IF EXISTS "Public can insert assessments" ON public.assessments;
CREATE POLICY "Public can insert assessments"
  ON public.assessments FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can delete own assessments" ON public.assessments;
DROP POLICY IF EXISTS "Public can delete assessments" ON public.assessments;
CREATE POLICY "Public can delete assessments"
  ON public.assessments FOR DELETE
  USING (true);

-- 5. Storage bucket setup ('beef-images', public enabled)
INSERT INTO storage.buckets (id, name, public)
VALUES ('beef-images', 'beef-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 6. Storage bucket policies (public upload, read, and delete)
DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
CREATE POLICY "Allow public uploads"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'beef-images');

DROP POLICY IF EXISTS "Users can view own images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
CREATE POLICY "Allow public reads"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'beef-images');

DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes" ON storage.objects;
CREATE POLICY "Allow public deletes"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'beef-images');
