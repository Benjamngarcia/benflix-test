import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// Supabase credentials
// For production, use expo-constants and app.json extra config
// For now, these are hardcoded from your .env file
const SUPABASE_URL = 'https://jnmyucmxiwgvnhzeecsj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpubXl1Y214aXdndm5oemVlY3NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3Nzg5MzAsImV4cCI6MjA3OTM1NDkzMH0.DGKHn9RsId3tmobgv9T-jfshcUhfg9_KS8CGQ9io08g';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // Disable email confirmation for development
    // In production, configure proper deep links
  },
});
