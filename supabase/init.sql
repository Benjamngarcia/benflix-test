-- =====================================================
-- Benflix - Database Initialization Script
-- Este script crea la base de datos completa desde cero
-- Ejecutar en Supabase SQL Editor una sola vez
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. CATEGORIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. SHOWS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS shows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  synopsis TEXT,
  poster_url TEXT,
  backdrop_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. EPISODES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS episodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  show_id UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  episode_number INTEGER NOT NULL,
  duration INTEGER, -- Duration in minutes
  thumbnail_url TEXT, -- Episode thumbnail/still image
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_episode_per_show UNIQUE (show_id, episode_number)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_episodes_show_id ON episodes(show_id);

-- =====================================================
-- 4. SHOW_CATEGORIES TABLE (Many-to-Many Junction)
-- =====================================================
CREATE TABLE IF NOT EXISTS show_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  show_id UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_show_category UNIQUE (show_id, category_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_show_categories_show_id ON show_categories(show_id);
CREATE INDEX IF NOT EXISTS idx_show_categories_category_id ON show_categories(category_id);

-- =====================================================
-- 5. USER_FAVORITES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  show_id UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_favorite UNIQUE (user_id, show_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_show_id ON user_favorites(show_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE show_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Allow public read access to categories" ON categories;
DROP POLICY IF EXISTS "Allow public read access to shows" ON shows;
DROP POLICY IF EXISTS "Allow public read access to episodes" ON episodes;
DROP POLICY IF EXISTS "Allow public read access to show_categories" ON show_categories;
DROP POLICY IF EXISTS "Users can view their own favorites" ON user_favorites;
DROP POLICY IF EXISTS "Users can add their own favorites" ON user_favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON user_favorites;

-- Public read access for categories (authenticated + anonymous)
CREATE POLICY "Allow public read access to categories"
  ON categories FOR SELECT
  USING (true);

-- Public read access for shows (authenticated + anonymous)
CREATE POLICY "Allow public read access to shows"
  ON shows FOR SELECT
  USING (true);

-- Public read access for episodes (authenticated + anonymous)
CREATE POLICY "Allow public read access to episodes"
  ON episodes FOR SELECT
  USING (true);

-- Public read access for show_categories (authenticated + anonymous)
CREATE POLICY "Allow public read access to show_categories"
  ON show_categories FOR SELECT
  USING (true);

-- User favorites - only authenticated users can manage their own favorites
CREATE POLICY "Users can view their own favorites"
  ON user_favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add their own favorites"
  ON user_favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
  ON user_favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify tables were created successfully
SELECT 
  table_name, 
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('categories', 'shows', 'episodes', 'show_categories', 'user_favorites')
ORDER BY table_name;

-- =====================================================
-- READY FOR SEEDING
-- La base de datos está lista para ser poblada con:
-- npm run seed
-- =====================================================
