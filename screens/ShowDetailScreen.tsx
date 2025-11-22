import { EpisodeItem } from '@/components/episode-item';
import { useAuth } from '@/contexts/AuthContext';
import { useEpisodes, useFavoriteStatus } from '@/hooks/use-data';
import type { Episode } from '@/types/database.types';
import type { ShowDetailScreenProps } from '@/types/navigation.types';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  ListRenderItem,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const BACKDROP_HEIGHT = width * 0.6;

export default function ShowDetailScreen({ route, navigation }: ShowDetailScreenProps) {
  const { show } = route.params;
  const { session } = useAuth();
  const { episodes, loading, error, formattedTotalDuration } = useEpisodes(show.id);
  const { isFavorite, loading: favoriteLoading, toggleFavorite } = useFavoriteStatus(show.id);

  const handleFavoritePress = useCallback(async () => {
    if (!session) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to save your favorite shows',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => navigation.navigate('Login') },
        ]
      );
      return;
    }

    try {
      await toggleFavorite();
    } catch (error) {
      Alert.alert('Error', 'Failed to update favorites. Please try again.');
    }
  }, [session, navigation, toggleFavorite]);

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const keyExtractor = useCallback((item: Episode) => item.id, []);

  const renderItem: ListRenderItem<Episode> = useCallback(
    ({ item }) => <EpisodeItem episode={item} />,
    []
  );

  const episodeCount = useMemo(() => episodes.length, [episodes.length]);

  const ListHeaderComponent = useMemo(
    () => (
      <View>
        <View style={styles.backdropContainer}>
          <Image
            source={{
              uri: show.backdrop_url || show.poster_url || 'https://via.placeholder.com/800x450',
            }}
            style={styles.backdrop}
            resizeMode="cover"
          />
          <View style={styles.backdropGradient} />
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.title}>{show.title}</Text>
          
          {episodeCount > 0 && (
            <Text style={styles.meta}>
              {episodeCount} {episodeCount === 1 ? 'Episode' : 'Episodes'} • {formattedTotalDuration}
            </Text>
          )}

          {show.synopsis && (
            <Text style={styles.synopsis}>{show.synopsis}</Text>
          )}
        </View>

        {episodeCount > 0 && (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Episodes</Text>
          </View>
        )}
      </View>
    ),
    [show, episodeCount, formattedTotalDuration]
  );

  const ListEmptyComponent = useMemo(
    () => (
      <View style={styles.emptyContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#e50914" />
        ) : error ? (
          <>
            <Text style={styles.emptyText}>Error loading episodes</Text>
            <Text style={styles.emptySubtext}>{error.message}</Text>
          </>
        ) : (
          <Text style={styles.emptyText}>No episodes available</Text>
        )}
      </View>
    ),
    [loading, error]
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={handleFavoritePress} 
          style={styles.favoriteButton}
          disabled={favoriteLoading}
        >
          {favoriteLoading ? (
            <ActivityIndicator size="small" color="#E50914" />
          ) : (
            <Ionicons 
              name={isFavorite ? "heart" : "heart-outline"} 
              size={28} 
              color={isFavorite ? "#E50914" : "#fff"} 
            />
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={episodes}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={5}
        windowSize={10}
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
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdropContainer: {
    width: '100%',
    height: BACKDROP_HEIGHT,
    position: 'relative',
  },
  backdrop: {
    width: '100%',
    height: '100%',
  },
  backdropGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  infoContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  meta: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
  },
  synopsis: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 24,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
