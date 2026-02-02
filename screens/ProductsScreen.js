import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Dimensions,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HeroSection from '../components/HeroSection';
import FullScreenLoader from '../components/FullScreenLoader';
import Header from '../components/Header';
import productService from '../services/productService';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const ITEM_MARGIN = 8;
const ITEM_WIDTH = (width - (ITEM_MARGIN * (COLUMN_COUNT + 1))) / COLUMN_COUNT;

const ProductsScreen = ({ navigation, route }) => {
  const { addToCart, updateQuantity, removeFromCart, cartCount, cartItems } = useCart();
  const { isAuthenticated } = useAuth();
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [totalProducts, setTotalProducts] = useState(0);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    inStockOnly: false,
    sortBy: 'name',
    minPrice: '',
    maxPrice: '',
    page: 1,
    limit: 20,
  });
  const [viewMode, setViewMode] = useState('grid');
  const [showSearch, setShowSearch] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  
  // Track individual product loading states
  const [addingProductId, setAddingProductId] = useState(null);
  const [updatingProductId, setUpdatingProductId] = useState(null);
  const [showCartSuccessModal, setShowCartSuccessModal] = useState(false);
  const [addedProductName, setAddedProductName] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  
  // Check for initial category from navigation params
  useEffect(() => {
    if (route.params?.category) {
      setSelectedCategory(route.params.category.toLowerCase());
    }
  }, [route.params?.category]);

  const mapCategoryForBackend = (categoryId) => {
    if (categoryId === 'all') return undefined;
    
    const categoryMap = {
      'vegetables': 'vegetable',
      'fruits': 'fruit',
      'staples': 'staple',
      'herb': 'herb',
      'tuber': 'tuber',
      'other': 'other',
    };
    
    return categoryMap[categoryId] || categoryId;
  };

  const loadCategories = async () => {
    try {
      const response = await productService.getCategories();
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadProducts = useCallback(async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setFilters(prev => ({ ...prev, page: 1 }));
      }
      
      const backendCategory = mapCategoryForBackend(selectedCategory);
      
      const params = {
        category: backendCategory,
        search: searchQuery || undefined,
        ...filters,
      };

      const response = await productService.getProducts(params);
      
      if (response.success) {
        if (reset || filters.page === 1) {
          setProducts(response.data);
        } else {
          setProducts(prev => [...prev, ...response.data]);
        }
        setTotalProducts(response.total || 0);
        setPagination(response.pagination || {});
      } else {
        console.error('Failed to load products:', response.error);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setCategoryLoading(false);
      setSearchLoading(false);
    }
  }, [selectedCategory, searchQuery, filters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [selectedCategory]);

  useEffect(() => {
    if (!loading) {
      loadProducts(true);
    }
  }, [filters.inStockOnly, filters.sortBy, filters.minPrice, filters.maxPrice, filters.limit]);

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProducts();
  }, []);

  const handleSearch = useCallback(() => {
    if (searchQuery.trim().length >= 2 || searchQuery.trim() === '') {
      setSearchLoading(true);
      loadProducts(true);
      setShowSearch(false);
    }
  }, [searchQuery]);

  const handleCategorySelect = useCallback((categoryId) => {
    setCategoryLoading(true);
    setSelectedCategory(categoryId);
  }, []);

  const handleAddToCart = async (product) => {
    try {
      if (product.stock <= 0 || product.countInStock <= 0) {
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
      
      // Set loading state for this specific product
      setAddingProductId(product.id || product._id);
      setAddedProductName(product.name);
      
      await addToCart(product.id || product._id, 1);
      
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
      // Clear loading state for this product
      setAddingProductId(null);
    }
  };

  const handleQuantityUpdate = async (product, action) => {
    try {
      const productId = product.id || product._id;
      const currentQuantity = getQuantityInCart(productId);
      
      if (action === 'increase') {
        const availableStock = product.stock || product.countInStock;
        if (currentQuantity >= availableStock) {
          Alert.alert('Stock Limit', `Only ${availableStock} units available.`);
          return;
        }
        
        // Set updating state for this specific product
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

  const getQuantityInCart = (productId) => {
    const cartItem = cartItems.find(item => 
      item.product?._id === productId || 
      item.productId === productId
    );
    return cartItem ? cartItem.quantity : 0;
  };

  const handleProductPress = (product) => {
    navigation.navigate('ProductDetail', { 
      productId: product.id || product._id,
      product
    });
  };

  const handleLoadMore = () => {
    if (!loading && pagination.hasNextPage) {
      const nextPage = filters.page + 1;
      setFilters(prev => ({ ...prev, page: nextPage }));
      loadMoreProducts(nextPage);
    }
  };

  const loadMoreProducts = async (page) => {
    try {
      const backendCategory = mapCategoryForBackend(selectedCategory);
      
      const params = {
        category: backendCategory,
        search: searchQuery || undefined,
        ...filters,
        page,
      };

      const response = await productService.getProducts(params);
      
      if (response.success) {
        setProducts(prev => [...prev, ...response.data]);
        setPagination(response.pagination || {});
      }
    } catch (error) {
      console.error('Error loading more products:', error);
    }
  };

  const sortOptions = [
    { id: 'name', label: 'Name A-Z', icon: 'text' },
    { id: 'name-desc', label: 'Name Z-A', icon: 'text' },
    { id: 'price', label: 'Price Low to High', icon: 'arrow-up' },
    { id: 'price-desc', label: 'Price High to Low', icon: 'arrow-down' },
    { id: 'newest', label: 'Newest First', icon: 'time' },
    { id: 'popular', label: 'Most Popular', icon: 'trending-up' },
  ];

  const handleSortSelect = (sortId) => {
    setFilters(prev => ({ ...prev, sortBy: sortId }));
    setSortModalVisible(false);
  };

  const renderProductGridItem = ({ item }) => {
    const quantityInCart = getQuantityInCart(item.id || item._id);
    const isInCart = quantityInCart > 0;
    const isAdding = addingProductId === (item.id || item._id);
    const isUpdating = updatingProductId === (item.id || item._id);
    const isLoading = isAdding || isUpdating;
    
    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => handleProductPress(item)}
        activeOpacity={0.7}
        disabled={isLoading}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.image || 'https://via.placeholder.com/150' }}
            style={styles.productImage}
            resizeMode="cover"
          />
          
          {(item.stock <= 0 || item.countInStock <= 0) && (
            <View style={styles.outOfStockBadge}>
              <Text style={styles.outOfStockText}>Out of Stock</Text>
            </View>
          )}
          
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>
              {item.category?.charAt(0).toUpperCase() + item.category?.slice(1) || 'Product'}
            </Text>
          </View>
        </View>

        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>
          
          <Text style={styles.productUnit}>
            /{item.unit || 'piece'}
          </Text>
          
          <View style={styles.priceContainer}>
            <Text style={styles.productPrice}>
              GH₵ {typeof item.price === 'number' ? item.price.toFixed(2) : '0.00'}
            </Text>
            
            {isInCart ? (
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={[styles.quantityButton, quantityInCart <= 1 && styles.quantityButtonDisabled]}
                  onPress={() => handleQuantityUpdate(item, 'decrease')}
                  disabled={isLoading || (item.stock <= 0 || item.countInStock <= 0)}
                >
                  <Ionicons 
                    name="remove" 
                    size={16} 
                    color={quantityInCart <= 1 ? "#CCCCCC" : "#2E7D32"} 
                  />
                </TouchableOpacity>
                
                <View style={styles.quantityDisplay}>
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#4CAF50" />
                  ) : (
                    <Text style={styles.quantityText}>{quantityInCart}</Text>
                  )}
                </View>
                
                <TouchableOpacity
                  style={[styles.quantityButton, quantityInCart >= (item.stock || item.countInStock) && styles.quantityButtonDisabled]}
                  onPress={() => handleQuantityUpdate(item, 'increase')}
                  disabled={isLoading || (item.stock <= 0 || item.countInStock <= 0) || quantityInCart >= (item.stock || item.countInStock)}
                >
                  <Ionicons 
                    name="add" 
                    size={16} 
                    color={quantityInCart >= (item.stock || item.countInStock) ? "#CCCCCC" : "#2E7D32"} 
                  />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.cartActionButton, 
                  isLoading && styles.addingButton,
                  (item.stock <= 0 || item.countInStock <= 0) && styles.outOfStockButton
                ]}
                onPress={() => handleAddToCart(item)}
                disabled={isLoading || (item.stock <= 0 || item.countInStock <= 0)}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons 
                    name={(item.stock <= 0 || item.countInStock <= 0) ? "close" : "cart-outline"} 
                    size={18} 
                    color="#FFFFFF" 
                  />
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderProductListItem = ({ item }) => {
    const quantityInCart = getQuantityInCart(item.id || item._id);
    const isInCart = quantityInCart > 0;
    const isAdding = addingProductId === (item.id || item._id);
    const isUpdating = updatingProductId === (item.id || item._id);
    const isLoading = isAdding || isUpdating;
    
    return (
      <TouchableOpacity
        style={styles.listItem}
        onPress={() => handleProductPress(item)}
        activeOpacity={0.7}
        disabled={isLoading}
      >
        <Image
          source={{ uri: item.image || 'https://via.placeholder.com/150' }}
          style={styles.listImage}
          resizeMode="cover"
        />
        
        <View style={styles.listInfo}>
          <View style={styles.listHeader}>
            <View style={styles.listTitleContainer}>
              <Text style={styles.listProductName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.listProductUnit}>
                /{item.unit || 'piece'}
              </Text>
            </View>
            
            <View style={styles.listCategoryBadge}>
              <Text style={styles.listCategoryText}>
                {item.category?.charAt(0).toUpperCase() + item.category?.slice(1) || 'Product'}
              </Text>
            </View>
          </View>
          
          <Text style={styles.listProductPrice}>
            GH₵ {typeof item.price === 'number' ? item.price.toFixed(2) : '0.00'}
          </Text>
          
          <View style={styles.listActions}>
            <View style={styles.stockStatus}>
              <Ionicons 
                name={(item.stock <= 0 || item.countInStock <= 0) ? "close-circle" : "checkmark-circle"} 
                size={16} 
                color={(item.stock <= 0 || item.countInStock <= 0) ? "#F44336" : "#4CAF50"} 
              />
              <Text style={[
                styles.stockStatusText,
                (item.stock <= 0 || item.countInStock <= 0) ? styles.outOfStockStatus : styles.inStockStatus
              ]}>
                {(item.stock <= 0 || item.countInStock <= 0) ? 'Out of Stock' : 'In Stock'}
              </Text>
            </View>
            
            {isInCart ? (
              <View style={styles.listQuantityControls}>
                <TouchableOpacity
                  style={[styles.listQuantityButton, quantityInCart <= 1 && styles.listQuantityButtonDisabled]}
                  onPress={() => handleQuantityUpdate(item, 'decrease')}
                  disabled={isLoading || (item.stock <= 0 || item.countInStock <= 0)}
                >
                  <Ionicons 
                    name="remove" 
                    size={14} 
                    color={quantityInCart <= 1 ? "#CCCCCC" : "#2E7D32"} 
                  />
                </TouchableOpacity>
                
                <View style={styles.listQuantityDisplay}>
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#4CAF50" />
                  ) : (
                    <Text style={styles.listQuantityText}>{quantityInCart}</Text>
                  )}
                </View>
                
                <TouchableOpacity
                  style={[styles.listQuantityButton, quantityInCart >= (item.stock || item.countInStock) && styles.listQuantityButtonDisabled]}
                  onPress={() => handleQuantityUpdate(item, 'increase')}
                  disabled={isLoading || (item.stock <= 0 || item.countInStock <= 0) || quantityInCart >= (item.stock || item.countInStock)}
                >
                  <Ionicons 
                    name="add" 
                    size={14} 
                    color={quantityInCart >= (item.stock || item.countInStock) ? "#CCCCCC" : "#2E7D32"} 
                  />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.listCartButton, 
                  isLoading && styles.listAddingButton,
                  (item.stock <= 0 || item.countInStock <= 0) && styles.listOutOfStockButton
                ]}
                onPress={() => handleAddToCart(item)}
                disabled={isLoading || (item.stock <= 0 || item.countInStock <= 0)}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons 
                    name={(item.stock <= 0 || item.countInStock <= 0) ? "close" : "cart-outline"} 
                    size={16} 
                    color="#FFFFFF" 
                  />
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyStateIcon}>
        <Ionicons name="search-outline" size={64} color="#E0E0E0" />
      </View>
      <Text style={styles.emptyStateTitle}>No products found</Text>
      <Text style={styles.emptyStateText}>
        {searchQuery 
          ? `No results for "${searchQuery}"` 
          : selectedCategory !== 'all'
            ? `No products in ${categories.find(c => c.id === selectedCategory)?.name || selectedCategory} category`
            : 'Try adjusting your filters or search terms'}
      </Text>
      <TouchableOpacity
        style={styles.resetButton}
        onPress={() => {
          setSearchQuery('');
          setSelectedCategory('all');
          setFilters({
            inStockOnly: false,
            sortBy: 'name',
            minPrice: '',
            maxPrice: '',
            page: 1,
            limit: 20,
          });
          loadProducts(true);
        }}
      >
        <Ionicons name="refresh" size={16} color="#FFFFFF" />
        <Text style={styles.resetButtonText}>Reset Filters</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
       <HeroSection navigation={navigation} />
      {showSearch ? (
        <View style={styles.searchBarActive}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoFocus
            placeholderTextColor="#999"
          />
          <TouchableOpacity 
            style={styles.searchSubmitButton} 
            onPress={handleSearch}
            disabled={searchLoading}
          >
            {searchLoading ? (
              <ActivityIndicator size="small" color="#4CAF50" />
            ) : (
              <Ionicons name="search" size={20} color="#4CAF50" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.searchCancelButton}
            onPress={() => {
              setShowSearch(false);
              setSearchQuery('');
              if (searchQuery) {
                handleSearch();
              }
            }}
          >
            <Ionicons name="close" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.searchBarInactive}
          onPress={() => setShowSearch(true)}
        >
          <Ionicons name="search-outline" size={18} color="#666" />
          <Text style={styles.searchPlaceholder}>Search products...</Text>
        </TouchableOpacity>
      )}

      <View style={styles.categorySection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScrollContent}
        >
          <TouchableOpacity
            style={[
              styles.categoryButton,
              selectedCategory === 'all' && styles.categoryButtonActive
            ]}
            onPress={() => handleCategorySelect('all')}
            disabled={categoryLoading}
          >
            <Text style={[
              styles.categoryButtonText,
              selectedCategory === 'all' && styles.categoryButtonTextActive
            ]}>
              All
            </Text>
          </TouchableOpacity>
          
          {categories.map(category => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategory === category.id && styles.categoryButtonActive
              ]}
              onPress={() => handleCategorySelect(category.id)}
              disabled={categoryLoading}
            >
              <Text style={[
                styles.categoryButtonText,
                selectedCategory === category.id && styles.categoryButtonTextActive
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.actionBar}>
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsText}>
            {loading || categoryLoading ? (
              <ActivityIndicator size="small" color="#4CAF50" />
            ) : (
              `${products.length} of ${totalProducts} products`
            )}
          </Text>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setSortModalVisible(true)}
          >
            <Ionicons name="funnel-outline" size={18} color="#666" />
            <Text style={styles.actionButtonText}>Sort</Text>
          </TouchableOpacity>
          
          <View style={styles.viewModeButtons}>
            <TouchableOpacity
              style={[styles.viewModeButton, viewMode === 'grid' && styles.viewModeButtonActive]}
              onPress={() => setViewMode('grid')}
            >
              <Ionicons 
                name="grid" 
                size={18} 
                color={viewMode === 'grid' ? '#4CAF50' : '#666'} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  const headerComponent = useMemo(() => renderHeader(), [
    showSearch,
    searchQuery,
    categories,
    selectedCategory,
    products.length,
    totalProducts,
    loading,
    categoryLoading,
    searchLoading,
    viewMode,
  ]);

  const renderFooter = () => {
    if (!pagination.hasNextPage || products.length === 0) return null;
    
    return (
      <View style={styles.footer}>
        {loading ? (
          <ActivityIndicator size="small" color="#4CAF50" />
        ) : (
          <TouchableOpacity style={styles.loadMoreButton} onPress={handleLoadMore}>
            <Ionicons name="chevron-down" size={18} color="#4CAF50" />
            <Text style={styles.loadMoreText}>Load More Products</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Get category name for loader
  const getCategoryNameForLoader = () => {
    if (selectedCategory === 'all') return '';
    const category = categories.find(c => c.id === selectedCategory);
    return category ? category.name : selectedCategory;
  };

  // Determine which loader to show
  const showFullScreenLoader = loading || categoryLoading || searchLoading;
  const loadingType = searchLoading ? 'search' : categoryLoading ? 'category' : 'default';

  return (
    <SafeAreaView style={styles.container}>
      {/* Full Screen Loader for initial loading, category change, and search */}
      <FullScreenLoader
        visible={showFullScreenLoader}
        loadingType={loadingType}
        categoryName={getCategoryNameForLoader()}
        searchQuery={searchQuery}
        loadedCount={products.length}
        totalCount={totalProducts}
        loadingText="Loading Fresh Products..."
        subText="Getting the freshest items for you"
        icon="leaf"
        iconColor="#4CAF50"
      />

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
                navigation.navigate('Cart');
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

      <Header
        title="Fresh Products"
        showBack
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity 
            onPress={() => navigation.navigate('Cart')}
            style={styles.cartButton}
          >
            <Ionicons 
              name={cartCount > 0 ? "cart" : "cart-outline"} 
              size={24} 
              color="#2E7D32" 
            />
            {cartCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {cartCount > 99 ? '99+' : cartCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        }
      />
      

      <FlatList
        data={products}
        renderItem={viewMode === 'grid' ? renderProductGridItem : renderProductListItem}
        keyExtractor={(item) => item.id || item._id || Math.random().toString()}
        numColumns={viewMode === 'grid' ? 2 : 1}
        columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : null}
        ListHeaderComponent={headerComponent}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#4CAF50']}
            tintColor="#4CAF50"
          />
        }
        contentContainerStyle={[
          styles.contentContainer,
          viewMode === 'grid' && styles.gridContent,
          viewMode === 'list' && styles.listContent
        ]}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        keyboardShouldPersistTaps="handled"
      />

      <Modal
        visible={sortModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSortModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sort Products</Text>
              <TouchableOpacity onPress={() => setSortModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.sortOptions}>
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.sortOption,
                    filters.sortBy === option.id && styles.sortOptionActive
                  ]}
                  onPress={() => handleSortSelect(option.id)}
                >
                  <Ionicons 
                    name={option.icon} 
                    size={18} 
                    color={filters.sortBy === option.id ? '#4CAF50' : '#666'} 
                    style={styles.sortIcon}
                  />
                  <Text style={[
                    styles.sortOptionText,
                    filters.sortBy === option.id && styles.sortOptionTextActive
                  ]}>
                    {option.label}
                  </Text>
                  {filters.sortBy === option.id && (
                    <Ionicons name="checkmark" size={18} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  // Add these new styles for quantity controls
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  quantityButtonDisabled: {
    backgroundColor: '#F5F5F5',
    opacity: 0.5,
  },
  quantityDisplay: {
    minWidth: 36,
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
  },
  addingButton: {
    backgroundColor: '#81C784',
  },
  outOfStockButton: {
    backgroundColor: '#9E9E9E',
  },
  // List view quantity controls
  listQuantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 3,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  listQuantityButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  listQuantityButtonDisabled: {
    backgroundColor: '#F5F5F5',
    opacity: 0.5,
  },
  listQuantityDisplay: {
    minWidth: 28,
    alignItems: 'center',
  },
  listQuantityText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#212121',
  },
  listAddingButton: {
    backgroundColor: '#81C784',
  },
  listOutOfStockButton: {
    backgroundColor: '#9E9E9E',
  },
  // Cart Success Modal Styles
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
    padding: 30,
    alignItems: 'center',
    width: '100%',
    maxWidth: 350,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  successIcon: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1B5E20',
    marginBottom: 10,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  viewCartButton: {
    backgroundColor: '#4CAF50',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  viewCartButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
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
    fontSize: 16,
    fontWeight: '600',
  },
  // Rest of your existing styles...
  headerContainer: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom:8,
  },
  searchBarInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
  },
  searchBarActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
    overflow: 'hidden',
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#212121',
  },
  searchSubmitButton: {
    padding: 12,
  },
  searchCancelButton: {
    padding: 12,
  },
  searchPlaceholder: {
    marginLeft: 10,
    fontSize: 16,
    color: '#999',
    flex: 1,
  },
  categorySection: {
    marginTop: 16,
  },
  categoryScrollContent: {
    paddingHorizontal: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoryButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 12,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginLeft: 4,
  },
  viewModeButtons: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 2,
  },
  viewModeButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewModeButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  contentContainer: {
    paddingBottom: 80,
  },
  gridContent: {
    paddingHorizontal: ITEM_MARGIN,
    paddingTop: ITEM_MARGIN,
  },
  listContent: {
    paddingTop: 12,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: ITEM_MARGIN,
  },
  productCard: {
    width: ITEM_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: ITEM_WIDTH * 0.75,
    backgroundColor: '#F5F5F5',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  outOfStockBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(244, 67, 54, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  outOfStockText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  categoryBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryBadgeText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 2,
    height: 40,
  },
  productUnit: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  cartActionButton: {
    backgroundColor: '#4CAF50',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // List View Styles
  listItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  listImage: {
    width: 100,
    height: 100,
    backgroundColor: '#F5F5F5',
  },
  listInfo: {
    flex: 1,
    padding: 12,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  listTitleContainer: {
    flex: 1,
  },
  listProductName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 2,
  },
  listProductUnit: {
    fontSize: 14,
    color: '#666',
  },
  listCategoryBadge: {
    backgroundColor: '#F1F8E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  listCategoryText: {
    fontSize: 10,
    color: '#2E7D32',
    fontWeight: '500',
  },
  listProductPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  listActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockStatusText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  inStockStatus: {
    color: '#4CAF50',
  },
  outOfStockStatus: {
    color: '#F44336',
  },
  listCartButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 60,
    marginTop: 20,
  },
  emptyStateIcon: {
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1B5E20',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cartButton: {
    position: 'relative',
    padding: 8,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F8E9',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loadMoreText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1B5E20',
  },
  sortOptions: {
    padding: 20,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sortOptionActive: {
    backgroundColor: '#F1F8E9',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  sortIcon: {
    marginRight: 12,
  },
  sortOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#212121',
  },
  sortOptionTextActive: {
    color: '#2E7D32',
    fontWeight: '600',
  },
});

export default ProductsScreen;