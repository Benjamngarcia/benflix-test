/**
 * Database Types
 * Strong typing for all database entities
 */

export interface Category {
  id: string;
  name: string;
  created_at: string;
}

export interface Show {
  id: string;
  title: string;
  synopsis: string | null;
  poster_url: string | null;
  backdrop_url: string | null;
  created_at: string;
}

export interface Episode {
  id: string;
  show_id: string;
  title: string;
  episode_number: number;
  duration: number | null;
  thumbnail_url: string | null;
  created_at: string;
}

export interface ShowCategory {
  id: string;
  show_id: string;
  category_id: string;
  created_at: string;
}

/**
 * Extended types for UI components
 */

export interface ShowWithCategories extends Show {
  categories?: Category[];
}

export interface CategoryWithShows extends Category {
  shows: Show[];
}
