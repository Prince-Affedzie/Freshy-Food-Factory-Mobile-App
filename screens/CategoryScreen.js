// src/screens/main/CategoryScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Modal,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Header from '../components/Header';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getProductsByCategory } from '../apis/productApi';

const { width } = Dimensions.get('window');

// Category images from Cloudinary
const CATEGORY_IMAGES = {
  vegetables: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1769990080/vegetables_cpp5n5.jpg',
  fruits: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1770885485/colorful-fruits-tasty-fresh-ripe-juicy-white-desk_utdxnl.jpg',
  staples: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1770886305/staple_food_xlgo92.jpg',
  herb: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1770885919/spices_and_herbs_srdlvf.jpg',
  tuber: 'https://res.cloudinary.com/duv3qvvjz/image/upload/fresh-potato-kitchen-ready-be-cooked_jndkde.jpg',
  dairy: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=800&q=80',
  meat: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800&q=80',
  seafood: 'https://images.unsplash.com/photo-1559563458-527698bf5295?w=800&q=80',
  bakery: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
  beverages: 'https://images.unsplash.com/photo-1543255255-b03b8f7a6d39?w=800&q=80',
  organic: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=800&q=80',
  default: 'https://res.cloudinary.com/duv3qvvjz/image/upload/grains_iijbmq.jpg',
};

const CategoryScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { category: routeCategory, categoryName } = route.params || {};
  const { token, isAuthenticated } = useAuth();
  const { addToCart, updateQuantity, removeFromCart, cartItems } = useCart();
  
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [category, setCategory] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addingProductId, setAddingProductId] = useState(null);
  const [updatingProductId, setUpdatingProductId] = useState(null);
  const [sortBy, setSortBy] = useState('name');
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showCartSuccessModal, setShowCartSuccessModal] = useState(false);
  const [addedProductName, setAddedProductName] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  // Add ref for search input
  const searchInputRef = useRef(null);

  const sortOptions = [
    { id: 'name', label: 'Name (A-Z)', icon: 'text' },
    { id: 'price-asc', label: 'Price (Low to High)', icon: 'arrow-up' },
    { id: 'price-desc', label: 'Price (High to Low)', icon: 'arrow-down' },
    { id: 'stock-desc', label: 'Most in Stock', icon: 'trending-up' },
  ];

  // Auto-focus search when expanded
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current.focus();
      }, 100);
    }
  }, [showSearch]);

  // Get category image based on category name
  const getCategoryImage = (categoryKey) => {
    const key = categoryKey?.toLowerCase() || 'default';
    return CATEGORY_IMAGES[key] || CATEGORY_IMAGES.default;
  };

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

    setAddingProductId(product.id);
    setAddedProductName(product.name);
    
    try {
      await addToCart(product.id, 1);
      
      // Show success modal
      setShowCartSuccessModal(true);
      setModalVisible(true);
      
      // Auto-hide modal after 2 seconds
      setTimeout(() => {
        setModalVisible(false);
        setTimeout(() => setShowCartSuccessModal(false), 300);
      }, 2000);
      
    } catch (error) {
      console.error('Add to cart error:', error);
      Alert.alert('Error', 'Failed to add item to cart. Please try again.');
    } finally {
      setAddingProductId(null);
    }
  };

  const handleQuantityUpdate = async (product, action) => {
    try {
      const productId = product.id;
      const currentQuantity = getQuantityInCart(productId);
      
      if (action === 'increase') {
        const availableStock = product.stock || product.countInStock;
        if (currentQuantity >= availableStock) {
          Alert.alert('Stock Limit', `Only ${availableStock} units available.`);
          return;
        }
        
        setUpdatingProductId(productId);
        await addToCart(productId, 1);
        setUpdatingProductId(null);
        
      } else if (action === 'decrease' && currentQuantity > 1) {
        setUpdatingProductId(productId);
        await updateQuantity(productId, currentQuantity - 1);
        setUpdatingProductId(null);
        
      } else if (action === 'decrease' && currentQuantity === 1) {
        Alert.alert(
          'Remove Item?',
          `Remove ${product.name} from cart?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Remove', 
              onPress: async () => {
                setUpdatingProductId(productId);
                await removeFromCart(productId);
                setUpdatingProductId(null);
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Quantity update error:', error);
      Alert.alert('Error', 'Failed to update quantity. Please try again.');
      setUpdatingProductId(null);
    }
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
          ref={searchInputRef}
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
    const isAdding = addingProductId === item.id;
    const isUpdating = updatingProductId === item.id;
    const isLoading = isAdding || isUpdating;
    const isOutOfStock = !item.inStock || item.countInStock <= 0;

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => navigation.navigate('ProductDetail', { 
          productId: item.id,
          product: item
        })}
        activeOpacity={0.7}
        disabled={isLoading}
      >
        <View style={styles.productImageContainer}>
          <Image
            source={{ uri: item.image || 'https://via.placeholder.com/150' }}
            style={styles.productImage}
            resizeMode="cover"
          />
          {isOutOfStock && (
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
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.productUnit}>
            {item.unitDisplay || item.unit || 'piece'}
          </Text>
          
          {/* Price and Add button row */}
          <View style={styles.priceRow}>
            <Text style={styles.productPrice}>
              {item.priceDisplay || `GH₵ ${item.price?.toFixed(2)}`}
            </Text>
            
            {!isInCart && (
              <TouchableOpacity
                style={[
                  styles.addButton,
                  isLoading && styles.addingButton,
                  isOutOfStock && styles.outOfStockButton
                ]}
                onPress={() => handleAddToCart(item)}
                disabled={isLoading || isOutOfStock}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="cart-outline" size={14} color="#FFFFFF" />
                    <Text style={styles.addButtonText}>Add</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Quantity Controls - Show only when item is in cart */}
          {isInCart && (
            <View style={styles.quantityContainer}>
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={[styles.quantityButton, quantityInCart <= 1 && styles.quantityButtonDisabled]}
                  onPress={() => handleQuantityUpdate(item, 'decrease')}
                  disabled={isLoading || isOutOfStock}
                >
                  <Ionicons 
                    name="remove" 
                    size={16} 
                    color={quantityInCart <= 1 ? "#CCCCCC" : "#2E7D32"} 
                  />
                </TouchableOpacity>
                
                <View style={styles.quantityDisplay}>
                  {isUpdating ? (
                    <ActivityIndicator size="small" color="#4CAF50" />
                  ) : (
                    <Text style={styles.quantityText}>{quantityInCart}</Text>
                  )}
                </View>
                
                <TouchableOpacity
                  style={[styles.quantityButton, quantityInCart >= (item.stock || item.countInStock) && styles.quantityButtonDisabled]}
                  onPress={() => handleQuantityUpdate(item, 'increase')}
                  disabled={isLoading || isOutOfStock || quantityInCart >= (item.stock || item.countInStock)}
                >
                  <Ionicons 
                    name="add" 
                    size={16} 
                    color={quantityInCart >= (item.stock || item.countInStock) ? "#CCCCCC" : "#2E7D32"} 
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}
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
            style={styles.clearSearchButton}
            onPress={clearSearch}
          >
            <Text style={styles.clearSearchButtonText}>Clear Search</Text>
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar backgroundColor="#2E7D32" barStyle="light-content" />

      {/* Cart Success Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModal}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={50} color="#4CAF50" />
            </View>
            <Text style={styles.successTitle}>Added to Cart!</Text>
            <Text style={styles.successMessage}>
              {addedProductName} has been added to your cart
            </Text>
            <TouchableOpacity
              style={styles.viewCartButton}
              onPress={() => {
                setModalVisible(false);
                setTimeout(() => setShowCartSuccessModal(false), 300);
                navigation.navigate('MainTabs', { screen: 'Cart' });
              }}
            >
              <Text style={styles.viewCartButtonText}>View Cart</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.continueButtonText}>Continue Shopping</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Custom Header */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>{category?.displayName || categoryName || routeCategory}</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={() => setShowSortOptions(!showSortOptions)}
          >
            <Ionicons name="filter-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={() => navigation.navigate('MainTabs', { screen: 'Cart' })}
          >
            <Ionicons name="cart-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Header with Image */}
      <View style={styles.categoryHeader}>
        <Image
          source={{ uri: getCategoryImage(routeCategory) }}
          style={styles.categoryBackgroundImage}
          resizeMode="cover"
        />
        <View style={styles.categoryOverlay}>
          <View style={styles.categoryContent}>
            <Text style={styles.categoryTitle}>
              {category?.displayName || categoryName || routeCategory}
            </Text>
            <Text style={styles.categoryDescription}>
              {isSearching 
                ? `Search results for "${searchQuery}"` 
                : `Browse our selection of fresh ${category?.displayName || categoryName || routeCategory}`
              }
            </Text>
          </View>
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2E7D32" />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<View style={styles.listHeader} />}
        ListFooterComponent={<View style={styles.listFooter} />}
        extraData={[isSearching, searchQuery, cartItems]} // Re-render when cart changes
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
  
  // Top Bar (like ProductsScreen)
  topBar: {
    backgroundColor: '#2E7D32',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopLeftRadius:12,
    borderTopRightRadius:12,
  },
  backBtn: { padding: 4 },
  topBarTitle: { 
    fontSize: 17, 
    fontWeight: '700', 
    color: '#fff', 
    flex: 1, 
    textAlign: 'center' 
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  
  // Category Header
  categoryHeader: {
    height: 150,
    position: 'relative',
    overflow: 'hidden',
  },
  categoryBackgroundImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  categoryOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  categoryContent: {
    padding: 20,
  },
  categoryTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  
  // Search Styles (Enhanced)
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
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchIcon: {
    marginRight: 10,
    color: '#4CAF50',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#212121',
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
    padding: 16,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
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
  
  // Product Card (Enhanced with new layout)
  productCard: {
    width: (width - 32) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
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
    marginBottom: 4,
    height: 40,
  },
  productUnit: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  
  // Price row with inline Add button (like ProductsScreen)
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1B5E20',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 4,
  },
  addButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  addingButton: {
    backgroundColor: '#81C784',
  },
  outOfStockButton: {
    backgroundColor: '#CCCCCC',
  },
  
  // Quantity Controls (full width below price, like ProductsScreen)
  quantityContainer: {
    width: '100%',
    marginTop: 4,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  quantityButtonDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
    opacity: 0.5,
  },
  quantityDisplay: {
    minWidth: 32,
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2E7D32',
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
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  suggestionsButtonText: {
    color: '#2E7D32',
    fontSize: 15,
    fontWeight: '600',
  },
  clearSearchButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  clearSearchButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
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
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1B5E20',
    marginBottom: 8,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 22,
    lineHeight: 20,
  },
  viewCartButton: {
    backgroundColor: '#4CAF50',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  viewCartButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  continueButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  continueButtonText: {
    color: '#4CAF50',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default CategoryScreen;