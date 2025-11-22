/**
 * Home Screen
 * Main catalog screen displaying categories with horizontal carousels
 * Demonstrates proper hooks usage and FlatList optimization
 */

import { CategoryRow } from '@/components/category-row';
import { useAuth } from '@/contexts/AuthContext';
import { useCategoriesWithShows } from '@/hooks/use-data';
import type { CategoryWithShows, Show } from '@/types/database.types';
import type { HomeScreenProps } from '@/types/navigation.types';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { session } = useAuth();
  const { categories, loading, error, refresh } = useCategoriesWithShows();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleShowPress = useCallback(
    (show: Show) => {
      navigation.navigate('ShowDetail', { show });
    },
    [navigation]
  );

  const handleProfilePress = useCallback(() => {
    navigation.navigate('Profile');
  }, [navigation]);

  const handleLogin = useCallback(() => {
    navigation.navigate('Login');
  }, [navigation]);

  const handleCategorySelect = useCallback((categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
    setModalVisible(false);
  }, []);

  const filteredCategories = useMemo(() => {
    if (!selectedCategoryId) {
      return categories;
    }
    return categories.filter((category) => category.id === selectedCategoryId);
  }, [categories, selectedCategoryId]);

  const selectedCategoryName = useMemo(() => {
    if (!selectedCategoryId) {
      return 'All Categories';
    }
    const category = categories.find((cat) => cat.id === selectedCategoryId);
    return category?.name || 'All Categories';
  }, [selectedCategoryId, categories]);

  const keyExtractor = useCallback((item: CategoryWithShows) => item.id, []);

  const renderItem: ListRenderItem<CategoryWithShows> = useCallback(
    ({ item }) => (
      <CategoryRow
        categoryName={item.name}
        shows={item.shows}
        onShowPress={handleShowPress}
      />
    ),
    [handleShowPress]
  );

  const totalShows = useMemo(() => {
    return categories.reduce((acc, category) => acc + category.shows.length, 0);
  }, [categories]);

  if (loading && categories.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#e50914" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error loading content</Text>
        <Text style={styles.errorSubtext}>{error.message}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (categories.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No content available</Text>
        <Text style={styles.emptySubtext}>Check back later for new shows</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>BENFLIX</Text>
          <Text style={styles.subtitle}>
            {totalShows} shows across {categories.length} categories
          </Text>
        </View>
        {session ? (
          <TouchableOpacity onPress={handleProfilePress} style={styles.profileButton}>
            <Ionicons name="person-circle-outline" size={32} color="#E50914" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleLogin} style={styles.loginButton}>
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filter Chip */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={styles.filterChip}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.filterChipText}>{selectedCategoryName}</Text>
          <Ionicons name="chevron-down" size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredCategories}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor="#e50914"
            colors={['#e50914']}
          />
        }
        removeClippedSubviews={true}
        maxToRenderPerBatch={3}
        updateCellsBatchingPeriod={50}
        initialNumToRender={2}
        windowSize={5}
      />

      {/* Category Filter Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Category</Text>

            {/* All Categories Option */}
            <TouchableOpacity
              style={[
                styles.categoryChip,
                !selectedCategoryId && styles.categoryChipSelected,
              ]}
              onPress={() => handleCategorySelect(null)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  !selectedCategoryId && styles.categoryChipTextSelected,
                ]}
              >
                All Categories
              </Text>
            </TouchableOpacity>

            {/* Individual Categories */}
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  selectedCategoryId === category.id && styles.categoryChipSelected,
                ]}
                onPress={() => handleCategorySelect(category.id)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategoryId === category.id && styles.categoryChipTextSelected,
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
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
  profileButton: {
    padding: 4,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    backgroundColor: '#e50914',
  },
  loginText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingVertical: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#e50914',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
  },
  filterChipText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  categoryChipSelected: {
    backgroundColor: '#e50914',
    borderColor: '#e50914',
  },
  categoryChipText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
  categoryChipTextSelected: {
    fontWeight: '700',
  },
});
