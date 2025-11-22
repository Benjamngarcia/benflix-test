/**
 * CategoryRow Component
 * Displays a horizontal scrollable list of shows for a category
 * Optimized with FlatList and proper hooks usage
 */

import type { Show } from '@/types/database.types';
import React, { memo, useCallback, useMemo } from 'react';
import { FlatList, ListRenderItem, StyleSheet, Text, View } from 'react-native';
import { ShowCard } from './show-card';

interface CategoryRowProps {
  categoryName: string;
  shows: Show[];
  onShowPress: (show: Show) => void;
}

function CategoryRowComponent({ categoryName, shows, onShowPress }: CategoryRowProps) {
  const keyExtractor = useCallback((item: Show) => item.id, []);

  const renderItem: ListRenderItem<Show> = useCallback(
    ({ item }) => <ShowCard show={item} onPress={onShowPress} />,
    [onShowPress]
  );

  const hasContent = useMemo(() => shows.length > 0, [shows.length]);

  if (!hasContent) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.categoryTitle}>{categoryName}</Text>
      <FlatList
        data={shows}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        updateCellsBatchingPeriod={50}
        initialNumToRender={3}
        windowSize={5}
        decelerationRate="fast"
      />
    </View>
  );
}

export const CategoryRow = memo(CategoryRowComponent);

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingHorizontal: 16,
  },
});
