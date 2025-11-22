import {
  addFavorite,
  checkIsFavorite,
  fetchCategoriesWithShows,
  fetchEpisodesByShow,
  fetchShowById,
  fetchUserFavorites,
  removeFavorite,
} from '@/services/supabase.service';
import type { CategoryWithShows, Episode, Show } from '@/types/database.types';
import { useCallback, useEffect, useMemo, useState } from 'react';

export function useCategoriesWithShows() {
  const [categories, setCategories] = useState<CategoryWithShows[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCategoriesWithShows();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { categories, loading, error, refresh };
}

export function useEpisodes(showId: string) {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchEpisodesByShow(showId);
        if (mounted) {
          setEpisodes(data);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      mounted = false;
    };
  }, [showId]);

  const totalDuration = useMemo(() => {
    return episodes.reduce((acc, episode) => acc + (episode.duration || 0), 0);
  }, [episodes]);

  const formattedTotalDuration = useMemo(() => {
    const hours = Math.floor(totalDuration / 60);
    const minutes = totalDuration % 60;
    return `${hours}h ${minutes}m`;
  }, [totalDuration]);

  return { 
    episodes, 
    loading, 
    error, 
    totalDuration, 
    formattedTotalDuration 
  };
}

export function useShow(showId: string) {
  const [show, setShow] = useState<Show | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchShowById(showId);
        if (mounted) {
          setShow(data);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      mounted = false;
    };
  }, [showId]);

  return { show, loading, error };
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Show[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchFavorites = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchUserFavorites();
      setFavorites(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  return { favorites, loading, error, refresh: fetchFavorites };
}

export function useFavoriteStatus(showId: string) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkFavoriteStatus = useCallback(async () => {
    const status = await checkIsFavorite(showId);
    setIsFavorite(status);
  }, [showId]);

  useEffect(() => {
    checkFavoriteStatus();
  }, [checkFavoriteStatus]);

  const toggleFavorite = useCallback(async () => {
    setLoading(true);
    try {
      if (isFavorite) {
        await removeFavorite(showId);
        setIsFavorite(false);
      } else {
        await addFavorite(showId);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [showId, isFavorite]);

  return { isFavorite, loading, toggleFavorite, refresh: checkFavoriteStatus };
}
