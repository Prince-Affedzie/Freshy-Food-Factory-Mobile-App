// src/components/CategoryFilter.js
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

const CategoryFilter = ({ 
  categories, 
  selectedCategory, 
  onSelectCategory,
  loading = false 
}) => {
  // Map category IDs to display names
  const getCategoryDisplay = (categoryId) => {
    if (categoryId === 'all') return 'All';
    const category = categories.find(c => c.id === categoryId || c._id === categoryId);
    return category ? category.name : categoryId;
  };

  // Map category IDs to emoji icons
  const getCategoryIcon = (categoryId) => {
    const icons = {
      'all': '🛒',
      'vegetables': '🥦',
      'fruits': '🍎',
      'staples': '🌾',
      'vegetable': '🥬',
      'fruit': '🍓',
      'staple': '🍚',
      'herb': '🌿',
      'tuber': '🥔',
      'other': '📦',
    };
    return icons[categoryId] || '📦';
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <TouchableOpacity
          key="all"
          style={[
            styles.categoryButton,
            selectedCategory === 'all' && styles.categoryButtonSelected,
            loading && selectedCategory === 'all' && styles.categoryButtonLoading,
          ]}
          onPress={() => onSelectCategory('all')}
          disabled={loading && selectedCategory === 'all'}
        >
          {loading && selectedCategory === 'all' ? (
            <ActivityIndicator size="small" color="#4CAF50" style={styles.loadingIndicator} />
          ) : (
            <Text style={styles.categoryIcon}>
              {getCategoryIcon('all')}
            </Text>
          )}
          <Text
            style={[
              styles.categoryName,
              selectedCategory === 'all' && styles.categoryNameSelected,
            ]}
            numberOfLines={1}
          >
            All
          </Text>
        </TouchableOpacity>
        
        {categories.map((category) => {
          const categoryId = category.id || category._id;
          const isSelected = selectedCategory === categoryId;
          const isLoading = loading && isSelected;
          
          return (
            <TouchableOpacity
              key={categoryId}
              style={[
                styles.categoryButton,
                isSelected && styles.categoryButtonSelected,
                isLoading && styles.categoryButtonLoading,
              ]}
              onPress={() => onSelectCategory(categoryId)}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#4CAF50" style={styles.loadingIndicator} />
              ) : (
                <Text style={styles.categoryIcon}>
                  {category.icon || getCategoryIcon(categoryId)}
                </Text>
              )}
              <Text
                style={[
                  styles.categoryName,
                  isSelected && styles.categoryNameSelected,
                ]}
                numberOfLines={1}
              >
                {category.name || getCategoryDisplay(categoryId)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minWidth: 80,
    maxWidth: 120,
  },
  categoryButtonSelected: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  categoryButtonLoading: {
    opacity: 0.7,
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryName: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    flexShrink: 1,
  },
  categoryNameSelected: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  loadingIndicator: {
    marginRight: 6,
  },
});

export default CategoryFilter;