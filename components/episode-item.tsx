/**
 * EpisodeItem Component
 * Optimized component for displaying individual episodes
 * Uses React.memo to prevent unnecessary re-renders
 */

import type { Episode } from '@/types/database.types';
import React, { memo } from 'react';
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';

const { width } = Dimensions.get('window');
const THUMBNAIL_WIDTH = width * 0.35;
const THUMBNAIL_HEIGHT = THUMBNAIL_WIDTH * 0.56; // 16:9 aspect ratio

interface EpisodeItemProps {
  episode: Episode;
}

function EpisodeItemComponent({ episode }: EpisodeItemProps) {
  return (
    <View style={styles.container}>
      {episode.thumbnail_url ? (
        <Image
          source={{ uri: episode.thumbnail_url }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
          <Text style={styles.placeholderNumber}>{episode.episode_number}</Text>
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.episodeNumber}>Episode {episode.episode_number}</Text>
          {episode.duration && (
            <Text style={styles.duration}>{episode.duration} min</Text>
          )}
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {episode.title}
        </Text>
      </View>
    </View>
  );
}

export const EpisodeItem = memo(EpisodeItemComponent);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  thumbnail: {
    width: THUMBNAIL_WIDTH,
    height: THUMBNAIL_HEIGHT,
    backgroundColor: '#2a2a2a',
  },
  thumbnailPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  episodeNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  duration: {
    fontSize: 12,
    color: '#666',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    lineHeight: 22,
  },
});
