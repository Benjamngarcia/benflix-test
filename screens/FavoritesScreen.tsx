import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/hooks/use-data';
import type { Show } from '@/types/database.types';
import type { MyListScreenProps } from '@/types/navigation.types';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const GRID_SPACING = 8;
const NUM_COLUMNS = 3;
const CARD_WIDTH = (width - (GRID_SPACING * (NUM_COLUMNS + 1))) / NUM_COLUMNS;
const CARD_HEIGHT = CARD_WIDTH * 1.5;

export function FavoritesScreen({ navigation }: MyListScreenProps) {
  const { session } = useAuth();
  const { favorites, loading, error, refresh } = useFavorites();

  useFocusEffect(
    useCallback(() => {
      if (session) {
        refresh();
      }
    }, [session, refresh])
  );

  const handleShowPress = useCallback(
    (show: Show) => {
      navigation.navigate('ShowDetail', { show });
    },
    [navigation]
  );

  const renderItem = useCallback(
    ({ item }: { item: Show }) => (
      <View style={styles.gridItem}>
        <TouchableOpacity 
          style={styles.card} 
          onPress={() => handleShowPress(item)} 
          activeOpacity={0.8}
        >
          <Image
            source={{ uri: item.poster_url || 'https://via.placeholder.com/300x450' }}
            style={styles.poster}
            resizeMode="cover"
          />
        </TouchableOpacity>
      </View>
    ),
    [handleShowPress]
  );

  const keyExtractor = useCallback((item: Show) => item.id, []);

  if (!session) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Sign in to view your favorites</Text>
          <Text style={styles.emptyText}>
            Create an account or sign in to save your favorite shows
          </Text>
          <Pressable
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Ionicons name="log-in-outline" size={20} color="#fff" />
            <Text style={styles.loginButtonText}>Sign In</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (loading && favorites.length === 0) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#E50914" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Error loading favorites</Text>
          <Text style={styles.emptyText}>{error.message}</Text>
          <Pressable style={styles.retryButton} onPress={refresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (favorites.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>MY LIST</Text>
            <Text style={styles.subtitle}>Your favorite shows</Text>
          </View>
        </View>
        
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={80} color="#333" />
          <Text style={styles.emptyTitle}>No favorites yet</Text>
          <Text style={styles.emptyText}>
            Shows you favorite will appear here
          </Text>
          <Pressable
            style={styles.browseButton}
            onPress={() => navigation.navigate('Browse')}
          >
            <Ionicons name="grid-outline" size={20} color="#fff" />
            <Text style={styles.browseButtonText}>Browse Shows</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>MY LIST</Text>
          <Text style={styles.subtitle}>
            {favorites.length} {favorites.length === 1 ? 'show' : 'shows'}
          </Text>
        </View>
      </View>

      <FlatList
        data={favorites}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={3}
        contentContainerStyle={styles.grid}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor="#E50914"
          />
        }
        removeClippedSubviews
        maxToRenderPerBatch={9}
        windowSize={5}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e50914',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  grid: {
    padding: GRID_SPACING,
  },
  gridItem: {
    width: CARD_WIDTH,
    marginBottom: GRID_SPACING,
    marginHorizontal: GRID_SPACING / 2,
  },
  card: {
    width: '100%',
    height: CARD_HEIGHT,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 8,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E50914',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E50914',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#333',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
