import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Header from '../components/Header';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getProductsByCategory } from '../apis/productApi';

const { width } = Dimensions.get('window');

const CategoryScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { category: routeCategory, categoryName } = route.params || {};
  const { token, isAuthenticated } = useAuth();
  const { addToCart, cartItems } = useCart();
  
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [category, setCategory] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cartLoading, setCartLoading] = useState({});
  const [sortBy, setSortBy] = useState('name');
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);

  const sortOptions = [
    { id: 'name', label: 'Name (A-Z)', icon: 'text' },
    { id: 'price-asc', label: 'Price (Low to High)', icon: 'arrow-up' },
    { id: 'price-desc', label: 'Price (High to Low)', icon: 'arrow-down' },
    { id: 'stock-desc', label: 'Most in Stock', icon: 'trending-up' },
  ];

  useEffect(() => {
    if (routeCategory) {
      loadCategoryProducts();
    }
  }, [routeCategory, sortBy]);

  useEffect(() => {
    // Filter products based on search query
    filterProducts();
  }, [searchQuery, products, sortBy]);

  const loadCategoryProducts = async () => {
    try {
      setLoading(true);
      
      const response = await getProductsByCategory(routeCategory, {
        sort: sortBy,
        limit: 100
      }, token);

      if (response.status === 200) {
        const productsData = response.data.data || [];
        setProducts(productsData);
        setFilteredProducts(productsData); // Initialize filtered products
        setCategory(response.category);
        setStats(response.stats);
      } else {
        Alert.alert('Error', response.message || 'Failed to load products');
      }
    } catch (error) {
      console.error('Error loading category products:', error);
      Alert.alert('Error', 'Failed to load products. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterProducts = () => {
    if (!searchQuery.trim()) {
      setFilteredProducts(products);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const query = searchQuery.toLowerCase().trim();
    
    const filtered = products.filter(product => {
      // Search in name
      if (product.name?.toLowerCase().includes(query)) return true;
      
      // Search in description
      if (product.description?.toLowerCase().includes(query)) return true;
      
      // Search in unit
      if (product.unit?.toLowerCase().includes(query)) return true;
      
      // Search in unit display
      if (product.unitDisplay?.toLowerCase().includes(query)) return true;
      
      // Search in price display
      if (product.priceDisplay?.toLowerCase().includes(query)) return true;
      
      // Search in price value
      if (product.price?.toString().includes(query)) return true;
      
      // Search in categories
      if (product.category?.toLowerCase().includes(query)) return true;
      
      // Search in subcategories
      if (product.subCategory?.toLowerCase().includes(query)) return true;
      
      return false;
    });

    setFilteredProducts(filtered);
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.trim()) {
      // Add to recent searches if not already in list
      const trimmedText = text.trim();
      if (!recentSearches.includes(trimmedText.toLowerCase())) {
        const newSearches = [trimmedText, ...recentSearches.slice(0, 4)]; // Keep last 5 searches
        setRecentSearches(newSearches);
      }
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
    setFilteredProducts(products);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadCategoryProducts();
    clearSearch();
  }, [routeCategory, sortBy]);

  const getQuantityInCart = (productId) => {
    const cartItem = cartItems.find(item => 
      item.product?._id === productId || 
      item.productId === productId
    );
    return cartItem ? cartItem.quantity : 0;
  };

  const handleAddToCart = async (product) => {
    if (!product.inStock || product.countInStock <= 0) {
      Alert.alert('Out of Stock', `${product.name} is currently out of stock.`);
      return;
    }

    if (!isAuthenticated) {
      Alert.alert(
        'Login Required',
        'Please login to add items to cart for syncing across devices.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => navigation.navigate('Login') }
        ]
      );
      return;
    }

    setCartLoading(prev => ({ ...prev, [product.id]: true }));
    try {
      await addToCart(product.id, 1);
      Alert.alert('Added to Cart', `${product.name} added to cart!`);
    } catch (error) {
      console.error('Add to cart error:', error);
      Alert.alert('Error', 'Failed to add item to cart. Please try again.');
    } finally {
      setCartLoading(prev => ({ ...prev, [product.id]: false }));
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'vegetable': 'leaf-outline',
      'fruit': 'nutrition-outline',
      'staple': 'beaker-outline',
      'herb': 'leaf-outline',
      'tuber': 'nutrition-outline',
      'other': 'cube-outline',
    };
    return icons[category] || 'cube-outline';
  };

  const getCategoryColor = (category) => {
    const colors = {
      'vegetable': '#2E7D32',
      'fruit': '#FF9800',
      'staple': '#795548',
      'herb': '#4CAF50',
      'tuber': '#FF5722',
      'other': '#607D8B',
    };
    return colors[category] || '#9C27B0';
  };

  const renderSearchHeader = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchInputContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={`Search in ${category?.displayName || categoryName || routeCategory}...`}
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={handleSearch}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        ) : null}
      </View>
      
      {/* Search Stats */}
      {isSearching && (
        <View style={styles.searchStats}>
          <Text style={styles.searchStatsText}>
            Found {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} for "{searchQuery}"
          </Text>
        </View>
      )}

      {/* Recent Searches */}
      {recentSearches.length > 0 && !searchQuery && (
        <View style={styles.recentSearchesContainer}>
          <Text style={styles.recentSearchesTitle}>Recent Searches</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {recentSearches.map((search, index) => (
              <TouchableOpacity
                key={index}
                style={styles.recentSearchTag}
                onPress={() => handleSearch(search)}
              >
                <Ionicons name="time-outline" size={14} color="#666" />
                <Text style={styles.recentSearchText}>{search}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );

  const renderProductItem = ({ item }) => {
    const quantityInCart = getQuantityInCart(item.id);
    const isInCart = quantityInCart > 0;
    const isLoading = cartLoading[item.id];

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => navigation.navigate('ProductDetail', { 
          productId: item.id,
          product: item
        })}
        activeOpacity={0.7}
      >
        <View style={styles.productImageContainer}>
          <Image
            source={{ uri: item.image || 'https://via.placeholder.com/150' }}
            style={styles.productImage}
            resizeMode="cover"
          />
          {!item.inStock && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>Out of Stock</Text>
            </View>
          )}
          {item.isLowStock && item.inStock && (
            <View style={styles.lowStockBadge}>
              <Text style={styles.lowStockText}>Low Stock</Text>
            </View>
          )}
        </View>

        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.productUnit}>
            {item.unitDisplay || item.unit || 'piece'}
          </Text>
          <Text style={styles.productPrice}>
            {item.priceDisplay || `GH₵ ${item.price}`}
          </Text>
          
          <View style={styles.productFooter}>
            <View style={styles.stockInfo}>
              <Ionicons 
                name={item.inStock ? 'checkmark-circle' : 'close-circle'} 
                size={16} 
                color={item.inStock ? '#4CAF50' : '#F44336'} 
              />
              <Text style={[styles.stockText, { color: item.inStock ? '#4CAF50' : '#F44336' }]}>
                {item.inStock ? `${item.countInStock} in stock` : 'Out of stock'}
              </Text>
            </View>
            
            <TouchableOpacity
              style={[styles.addButton, isInCart && styles.inCartButton, !item.inStock && styles.disabledButton]}
              onPress={() => handleAddToCart(item)}
              disabled={isLoading || !item.inStock}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : isInCart ? (
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              ) : (
                <Ionicons name="cart-outline" size={16} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderStats = () => {
    if (!stats) return null;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Products</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#4CAF50' }]}>{stats.inStock}</Text>
            <Text style={styles.statLabel}>In Stock</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#FF9800' }]}>{stats.lowStock}</Text>
            <Text style={styles.statLabel}>Low Stock</Text>
          </View>
          {stats.priceRange && (
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#2E7D32' }]}>
                GH₵ {Math.round(stats.priceRange.min)}
              </Text>
              <Text style={styles.statLabel}>From</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderSortOptions = () => (
    <View style={styles.sortOptionsContainer}>
      {sortOptions.map((option) => (
        <TouchableOpacity
          key={option.id}
          style={[styles.sortOption, sortBy === option.id && styles.sortOptionActive]}
          onPress={() => {
            setSortBy(option.id);
            setShowSortOptions(false);
          }}
        >
          <Ionicons 
            name={option.icon} 
            size={16} 
            color={sortBy === option.id ? '#4CAF50' : '#666'} 
            style={styles.sortIcon}
          />
          <Text style={[styles.sortOptionText, sortBy === option.id && styles.sortOptionTextActive]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderEmptyState = () => {
    if (isSearching && filteredProducts.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={80} color="#E0E0E0" />
          <Text style={styles.emptyTitle}>No Products Found</Text>
          <Text style={styles.emptyText}>
            No products found for "{searchQuery}". Try different keywords.
          </Text>
          <TouchableOpacity
            style={styles.suggestionsButton}
            onPress={() => {
              setSearchQuery('');
              Alert.alert('Search Suggestions', 
                'Try searching for:\n• Product names\n• Categories\n• Price ranges\n• Units (kg, piece, etc.)'
              );
            }}
          >
            <Text style={styles.suggestionsButtonText}>Search Tips</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backButton}
            onPress={clearSearch}
          >
            <Text style={styles.backButtonText}>Clear Search</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="search-outline" size={80} color="#E0E0E0" />
        <Text style={styles.emptyTitle}>No Products Found</Text>
        <Text style={styles.emptyText}>
          There are no products available in this category at the moment.
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Back to Categories</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading && !refreshing && products.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading {categoryName || routeCategory}...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={category?.displayName || categoryName || routeCategory}
        showBack
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => setShowSortOptions(!showSortOptions)} style={styles.headerButton}>
              <Ionicons name="filter-outline" size={24} color="#2E7D32" />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Category Header */}
      <View style={[styles.categoryHeader, { backgroundColor: getCategoryColor(routeCategory) + '20' }]}>
        <View style={[styles.categoryIconContainer, { backgroundColor: getCategoryColor(routeCategory) }]}>
          <Ionicons name={getCategoryIcon(routeCategory)} size={32} color="#FFFFFF" />
        </View>
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryTitle}>
            {category?.displayName || categoryName || routeCategory}
          </Text>
          <Text style={styles.categoryDescription}>
            {isSearching 
              ? `Search results for "${searchQuery}"` 
              : 'Browse all products in this category'
            }
          </Text>
        </View>
      </View>

      {/* Search Header */}
      {renderSearchHeader()}

      {/* Sort Options */}
      {showSortOptions && renderSortOptions()}

      {/* Stats - Only show when not searching */}
      {!isSearching && renderStats()}

      {/* Products List */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.productsRow}
        contentContainerStyle={styles.productsContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<View style={styles.listHeader} />}
        ListFooterComponent={<View style={styles.listFooter} />}
        extraData={[isSearching, searchQuery]} // Re-render when search state changes
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  categoryIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#666',
  },
  // Search Styles
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  searchStats: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  searchStatsText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  recentSearchesContainer: {
    marginTop: 12,
  },
  recentSearchesTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  recentSearchTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F7F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  recentSearchText: {
    fontSize: 14,
    color: '#2E7D32',
    marginLeft: 6,
  },
  searchTips: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  searchTipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B5E20',
    marginBottom: 6,
  },
  searchTipsText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  // Sort Options
  sortOptionsContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    marginBottom: 8,
  },
  sortOptionActive: {
    backgroundColor: '#E8F5E8',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  sortIcon: {
    marginRight: 12,
  },
  sortOptionText: {
    fontSize: 16,
    color: '#666',
  },
  sortOptionTextActive: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  // Stats
  statsContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  // Products List
  productsContainer: {
    padding: 8,
    paddingHorizontal: 8,
    paddingBottom: 20,
  },
  listHeader: {
    height: 8,
  },
  listFooter: {
    height: 60,
  },
  productsRow: {
    justifyContent: 'space-between',
     gap: 8,
    paddingHorizontal: 8,
  },
  productCard: {
    width: (width - 32) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  productImageContainer: {
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#F5F5F5',
  },
  outOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  lowStockBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF9800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  lowStockText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 2,
  },
  productUnit: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockText: {
    fontSize: 12,
    marginLeft: 4,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inCartButton: {
    backgroundColor: '#2E7D32',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  // Empty States
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1B5E20',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  suggestionsButton: {
    backgroundColor: '#F0F7F0',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  suggestionsButtonText: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CategoryScreen;