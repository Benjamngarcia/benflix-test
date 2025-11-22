/**
 * Database Seeding Script
 * Populates Supabase with real TV show data from TMDB API
 * 
 * Usage:
 * 1. Create a .env file with:
 *    SUPABASE_URL=your_supabase_url
 *    SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
 *    TMDB_API_KEY=your_tmdb_api_key
 * 
 * 2. Run: npx ts-node scripts/seed.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const TMDB_API_KEY = process.env.TMDB_API_KEY!;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const TMDB_BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/original';

// Limits
const MAX_SHOWS = 15;
const MAX_EPISODES_PER_SHOW = 10;

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !TMDB_API_KEY) {
  console.error('❌ Missing required environment variables!');
  console.error('Please ensure .env contains:');
  console.error('  - SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  console.error('  - TMDB_API_KEY');
  process.exit(1);
}

// Initialize Supabase client with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Types
interface TMDBGenre {
  id: number;
  name: string;
}

interface TMDBShow {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  genre_ids: number[];
  vote_average: number;
  first_air_date: string;
}

interface TMDBEpisode {
  id: number;
  episode_number: number;
  season_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  runtime: number | null;
}

interface TMDBSeason {
  season_number: number;
  episode_count: number;
}

interface TMDBShowDetail {
  id: number;
  seasons: TMDBSeason[];
}

// Helper function to make TMDB API requests
async function tmdbFetch<T>(endpoint: string): Promise<T> {
  const url = `${TMDB_BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${TMDB_API_KEY}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch from TMDB: ${endpoint}`, error);
    throw error;
  }
}

// Helper to construct full image URLs
function getImageUrl(path: string | null, isBackdrop = false): string {
  if (!path) return '';
  const baseUrl = isBackdrop ? TMDB_BACKDROP_BASE_URL : TMDB_IMAGE_BASE_URL;
  return `${baseUrl}${path}`;
}

// Step 1: Fetch and insert TV genres (categories)
async function seedCategories(): Promise<Map<number, string>> {
  console.log('\n📁 Fetching TV genres from TMDB...');
  
  const { genres } = await tmdbFetch<{ genres: TMDBGenre[] }>('/genre/tv/list');
  console.log(`✓ Found ${genres.length} genres`);
  
  console.log('📝 Inserting categories into Supabase...');
  const genreMap = new Map<number, string>();
  
  for (const genre of genres) {
    // Try to insert, if exists, fetch the existing one
    const { data, error } = await supabase
      .from('categories')
      .insert({ name: genre.name })
      .select('id')
      .single();
    
    if (error) {
      // If duplicate, fetch the existing category
      if (error.code === '23505') {
        const { data: existing } = await supabase
          .from('categories')
          .select('id')
          .eq('name', genre.name)
          .single();
        
        if (existing) {
          genreMap.set(genre.id, existing.id);
          console.log(`  ✓ ${genre.name} (existing)`);
        }
      } else {
        console.error(`Failed to insert category ${genre.name}:`, error);
      }
      continue;
    }
    
    genreMap.set(genre.id, data.id);
    console.log(`  ✓ ${genre.name}`);
  }
  
  console.log(`✅ Mapped ${genreMap.size} categories`);
  return genreMap;
}

// Step 2: Fetch and insert popular TV shows
async function seedShows(genreMap: Map<number, string>): Promise<void> {
  console.log('\n📺 Fetching popular TV shows from TMDB...');
  
  const { results: shows } = await tmdbFetch<{ results: TMDBShow[] }>(
    '/tv/popular?language=en-US&page=1'
  );
  
  const limitedShows = shows.slice(0, MAX_SHOWS);
  console.log(`✓ Found ${shows.length} shows, processing first ${limitedShows.length}`);
  
  console.log('\n📝 Inserting shows and episodes...\n');
  
  for (let i = 0; i < limitedShows.length; i++) {
    const show = limitedShows[i];
    console.log(`[${i + 1}/${limitedShows.length}] Processing: ${show.name}`);
    
    try {
      // Insert the show
      const { data: insertedShow, error: showError } = await supabase
        .from('shows')
        .insert({
          title: show.name,
          synopsis: show.overview || 'No synopsis available.',
          poster_url: getImageUrl(show.poster_path),
          backdrop_url: getImageUrl(show.backdrop_path, true),
        })
        .select('id')
        .single();
      
      if (showError || !insertedShow) {
        console.error(`  ❌ Failed to insert show: ${showError?.message}`);
        continue;
      }
      
      console.log(`  ✓ Inserted show (ID: ${insertedShow.id})`);
      
      // Link show to categories
      const categoryLinks = show.genre_ids
        .map(genreId => genreMap.get(genreId))
        .filter(Boolean)
        .map(categoryId => ({
          show_id: insertedShow.id,
          category_id: categoryId,
        }));
      
      if (categoryLinks.length > 0) {
        const { error: linkError } = await supabase
          .from('show_categories')
          .insert(categoryLinks);
        
        if (linkError) {
          console.error(`  ⚠️  Failed to link categories: ${linkError.message}`);
        } else {
          console.log(`  ✓ Linked to ${categoryLinks.length} categories`);
        }
      }
      
      // Fetch and insert episodes
      await seedEpisodes(show.id, insertedShow.id);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 250));
      
    } catch (error) {
      console.error(`  ❌ Error processing show ${show.name}:`, error);
    }
  }
  
  console.log(`\n✅ Completed processing ${limitedShows.length} shows`);
}

// Step 3: Fetch and insert episodes for a show
async function seedEpisodes(tmdbShowId: number, supabaseShowId: string): Promise<void> {
  try {
    // Get show details to find available seasons
    const showDetails = await tmdbFetch<TMDBShowDetail>(`/tv/${tmdbShowId}`);
    
    // Filter out season 0 (specials) and sort by season number
    const regularSeasons = showDetails.seasons
      .filter(s => s.season_number > 0)
      .sort((a, b) => a.season_number - b.season_number);
    
    if (regularSeasons.length === 0) {
      console.log(`  ⚠️  No regular seasons found`);
      return;
    }
    
    let totalEpisodesInserted = 0;
    
    // Fetch episodes from first season only to keep it manageable
    for (const season of regularSeasons.slice(0, 1)) {
      try {
        const seasonData = await tmdbFetch<{ episodes: TMDBEpisode[] }>(
          `/tv/${tmdbShowId}/season/${season.season_number}`
        );
        
        const episodes = seasonData.episodes.slice(0, MAX_EPISODES_PER_SHOW);
        
        const episodesToInsert = episodes.map(ep => ({
          show_id: supabaseShowId,
          episode_number: ep.episode_number,
          title: ep.name,
          duration: ep.runtime || 45, // Default to 45 minutes if not available
          thumbnail_url: getImageUrl(ep.still_path),
        }));
        
        if (episodesToInsert.length > 0) {
          const { error: episodeError } = await supabase
            .from('episodes')
            .insert(episodesToInsert);
          
          if (episodeError) {
            console.error(`  ⚠️  Failed to insert episodes for season ${season.season_number}: ${episodeError.message}`);
          } else {
            totalEpisodesInserted += episodesToInsert.length;
          }
        }
        
        // Small delay between season requests
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`  ⚠️  Error fetching season ${season.season_number}:`, error);
      }
    }
    
    if (totalEpisodesInserted > 0) {
      console.log(`  ✓ Inserted ${totalEpisodesInserted} episodes`);
    } else {
      console.log(`  ⚠️  No episodes inserted`);
    }
    
  } catch (error) {
    console.error(`  ❌ Error fetching episodes:`, error);
  }
}

// Main seeding function
async function main() {
  console.log('🚀 Starting database seeding process...');
  console.log('━'.repeat(50));
  
  const startTime = Date.now();
  
  try {
    // Step 1: Seed categories
    const genreMap = await seedCategories();
    
    // Step 2: Seed shows and episodes
    await seedShows(genreMap);
    
    // Summary
    console.log('\n' + '━'.repeat(50));
    console.log('📊 Seeding Summary:');
    console.log('━'.repeat(50));
    
    const { count: categoriesCount } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true });
    
    const { count: showsCount } = await supabase
      .from('shows')
      .select('*', { count: 'exact', head: true });
    
    const { count: episodesCount } = await supabase
      .from('episodes')
      .select('*', { count: 'exact', head: true });
    
    const { count: linksCount } = await supabase
      .from('show_categories')
      .select('*', { count: 'exact', head: true });
    
    console.log(`Categories: ${categoriesCount}`);
    console.log(`Shows: ${showsCount}`);
    console.log(`Episodes: ${episodesCount}`);
    console.log(`Category Links: ${linksCount}`);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n⏱️  Completed in ${duration}s`);
    console.log('✅ Seeding completed successfully!\n');
    
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run the seeding
main();
