/**
 * ShowCard Component
 * Optimized card component for displaying show posters
 * Uses React.memo to prevent unnecessary re-renders
 */

import type { Show } from '@/types/database.types';
import React, { memo, useCallback } from 'react';
import { Dimensions, Image, StyleSheet, TouchableOpacity } from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.4;
const CARD_HEIGHT = CARD_WIDTH * 1.5;

interface ShowCardProps {
  show: Show;
  onPress: (show: Show) => void;
}

function ShowCardComponent({ show, onPress }: ShowCardProps) {
  const handlePress = useCallback(() => {
    onPress(show);
  }, [show, onPress]);

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.8}>
      <Image
        source={{ uri: show.poster_url || 'https://via.placeholder.com/300x450' }}
        style={styles.poster}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );
}

export const ShowCard = memo(ShowCardComponent);

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginRight: 12,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  poster: {
    width: '100%',
    height: '100%',
  },
});
