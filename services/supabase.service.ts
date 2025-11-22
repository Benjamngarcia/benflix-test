import { supabase } from '@/lib/supabase';
import type { Category, CategoryWithShows, Episode, Show } from '@/types/database.types';

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  console.log('fetchCategories data:', data);

  if (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }

  return data || [];
}

export async function fetchShows(): Promise<Show[]> {
  const { data, error } = await supabase
    .from('shows')
    .select('*')
    .order('title');

  if (error) {
    console.error('Error fetching shows:', error);
    throw error;
  }

  return data || [];
}

export async function fetchShowsByCategory(categoryId: string): Promise<Show[]> {
  const { data, error } = await supabase
    .from('show_categories')
    .select(`
      shows (
        id,
        title,
        synopsis,
        poster_url,
        backdrop_url,
        created_at
      )
    `)
    .eq('category_id', categoryId);

  if (error) {
    console.error('Error fetching shows by category:', error);
    throw error;
  }

  return data?.map((item: any) => item.shows).filter(Boolean) || [];
}

export async function fetchCategoriesWithShows(): Promise<CategoryWithShows[]> {
  const categories = await fetchCategories();

  console.log('Fetched categories:', categories);

  const categoriesWithShows = await Promise.all(
    categories.map(async (category) => {
      const shows = await fetchShowsByCategory(category.id);
      return {
        ...category,
        shows,
      };
    })
  );

  return categoriesWithShows.filter((category) => category.shows.length > 0);
}

export async function fetchEpisodesByShow(showId: string): Promise<Episode[]> {
  const { data, error } = await supabase
    .from('episodes')
    .select('*')
    .eq('show_id', showId)
    .order('episode_number');

  if (error) {
    console.error('Error fetching episodes:', error);
    throw error;
  }

  return data || [];
}

export async function fetchShowById(showId: string): Promise<Show | null> {
  const { data, error } = await supabase
    .from('shows')
    .select('*')
    .eq('id', showId)
    .single();

  if (error) {
    console.error('Error fetching show:', error);
    throw error;
  }

  return data;
}

export async function addFavorite(showId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('user_favorites')
    .insert({ user_id: user.id, show_id: showId });

  if (error) {
    console.error('Error adding favorite:', error);
    throw error;
  }
}

export async function removeFavorite(showId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('user_favorites')
    .delete()
    .eq('user_id', user.id)
    .eq('show_id', showId);

  if (error) {
    console.error('Error removing favorite:', error);
    throw error;
  }
}

export async function fetchUserFavorites(): Promise<Show[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('user_favorites')
    .select(`
      shows (
        id,
        title,
        synopsis,
        poster_url,
        backdrop_url,
        created_at
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching favorites:', error);
    throw error;
  }

  return data?.map((item: any) => item.shows).filter(Boolean) || [];
}

export async function checkIsFavorite(showId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('user_favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('show_id', showId)
    .maybeSingle();

  if (error) {
    console.error('Error checking favorite:', error);
    return false;
  }

  return !!data;
}
