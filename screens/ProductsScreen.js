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
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FullScreenLoader from '../components/FullScreenLoader';
import productService from '../services/productService';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const ITEM_MARGIN = 8;
const ITEM_WIDTH = (width - (ITEM_MARGIN * (COLUMN_COUNT + 1))) / COLUMN_COUNT;

// Hero images per category
const HERO_IMAGES = {
  all: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=80',
  vegetables: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1769990080/vegetables_cpp5n5.jpg',
  fruits: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1770885485/colorful-fruits-tasty-fresh-ripe-juicy-white-desk_utdxnl.jpg',
  staples: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1770886305/staple_food_xlgo92.jpg',
  herb: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1770885919/spices_and_herbs_srdlvf.jpg',
  tuber: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1770885482/fresh-potato-kitchen-ready-be-cooked_jndkde.jpg',
  dairy: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=800&q=80',
  meat: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800&q=80',
  seafood: 'https://images.unsplash.com/photo-1559563458-527698bf5295?w=800&q=80',
  bakery: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
  beverages: 'https://images.unsplash.com/photo-1543255255-b03b8f7a6d39?w=800&q=80',
};

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
  const [addingProductId, setAddingProductId] = useState(null);
  const [updatingProductId, setUpdatingProductId] = useState(null);
  const [showCartSuccessModal, setShowCartSuccessModal] = useState(false);
  const [addedProductName, setAddedProductName] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  // Add ref for search input
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (route.params?.category) {
      setSelectedCategory(route.params.category.toLowerCase());
    }
  }, [route.params?.category]);

  // Auto-focus search when expanded
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current.focus();
      }, 100);
    }
  }, [showSearch]);

  const mapCategoryForBackend = (categoryId) => {
    if (categoryId === 'all') return undefined;
    const categoryMap = {
      vegetables: 'vegetable',
      fruits: 'fruit',
      staples: 'staple',
      herb: 'herb',
      tuber: 'tuber',
      other: 'other',
    };
    return categoryMap[categoryId] || categoryId;
  };

  const loadCategories = async () => {
    try {
      const response = await productService.getCategories();
      if (response.success) setCategories(response.data);
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
      const params = { category: backendCategory, search: searchQuery || undefined, ...filters };
      const response = await productService.getProducts(params);
      if (response.success) {
        if (reset || filters.page === 1) setProducts(response.data);
        else setProducts(prev => [...prev, ...response.data]);
        setTotalProducts(response.total || 0);
        setPagination(response.pagination || {});
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
    const timer = setTimeout(() => { loadProducts(true); }, 300);
    return () => clearTimeout(timer);
  }, [selectedCategory]);

  useEffect(() => {
    if (!loading) loadProducts(true);
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
        Alert.alert('Login Required', 'Please login to add items to cart.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => navigation.navigate('Login') },
        ]);
        return;
      }
      setAddingProductId(product.id || product._id);
      setAddedProductName(product.name);
      await addToCart(product.id || product._id, 1);
      setShowCartSuccessModal(true);
      setModalVisible(true);
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
      const productId = product.id || product._id;
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
        Alert.alert('Remove Item?', `Remove ${product.name} from cart?`, [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            onPress: async () => {
              setUpdatingProductId(productId);
              await removeFromCart(productId);
              setUpdatingProductId(null);
            },
          },
        ]);
      }
    } catch (error) {
      console.error('Quantity update error:', error);
      Alert.alert('Error', 'Failed to update quantity.');
      setUpdatingProductId(null);
    }
  };

  const getQuantityInCart = (productId) => {
    const cartItem = cartItems.find(
      item => item.product?._id === productId || item.productId === productId
    );
    return cartItem ? cartItem.quantity : 0;
  };

  const handleProductPress = (product) => {
    navigation.navigate('ProductDetail', { productId: product.id || product._id, product });
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
      const params = { category: backendCategory, search: searchQuery || undefined, ...filters, page };
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

  const getHeroImage = () => {
    return HERO_IMAGES[selectedCategory] || HERO_IMAGES.all;
  };

  const getCategoryLabel = () => {
    if (selectedCategory === 'all') return 'All Fresh Products';
    const cat = categories.find(c => c.id === selectedCategory || c.name?.toLowerCase() === selectedCategory);
    return cat ? `Fresh ${cat.name}` : selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1);
  };

  // Single card renderer for grid view
  const renderGridCard = (item) => {
    const quantityInCart = getQuantityInCart(item.id || item._id);
    const isInCart = quantityInCart > 0;
    const isAdding = addingProductId === (item.id || item._id);
    const isUpdating = updatingProductId === (item.id || item._id);
    const isLoading = isAdding || isUpdating;
    const outOfStock = item.stock <= 0 || item.countInStock <= 0;

    return (
      <TouchableOpacity
        key={item.id || item._id}
        style={styles.gridCard}
        onPress={() => handleProductPress(item)}
        activeOpacity={0.8}
        disabled={isLoading}
      >
        <View style={styles.gridCardImageWrap}>
          <Image
            source={{ uri: item.image || 'https://via.placeholder.com/150' }}
            style={styles.gridCardImage}
            resizeMode="cover"
          />
          {outOfStock && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockOverlayText}>Out of Stock</Text>
            </View>
          )}
          <View style={styles.gridCardCatBadge}>
            <Text style={styles.gridCardCatText}>
              {item.category?.charAt(0).toUpperCase() + item.category?.slice(1) || ''}
            </Text>
          </View>
        </View>
        <View style={styles.gridCardInfo}>
          <Text style={styles.gridCardName} numberOfLines={1}>{item.name}</Text>
          
          {/* Price and Add button row */}
          <View style={styles.priceRow}>
            <Text style={styles.gridCardPrice}>GH₵{item.price?.toFixed(2)}</Text>
            
            {!isInCart && (
              <TouchableOpacity
                style={[styles.gridAddBtn, outOfStock && styles.disabledBtn]}
                onPress={() => handleAddToCart(item)}
                disabled={isLoading || outOfStock}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="cart-outline" size={14} color="#fff" />
                    <Text style={styles.gridAddBtnText}>Add</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
          
          {/* Quantity controls - only shown when item is in cart, on its own line */}
          {isInCart && (
            <View style={styles.gridQtyContainer}>
              <View style={styles.gridQtyRow}>
                <TouchableOpacity
                  style={styles.gridQtyBtn}
                  onPress={() => handleQuantityUpdate(item, 'decrease')}
                  disabled={isLoading}
                >
                  <Ionicons name="remove" size={14} color="#2E7D32" />
                </TouchableOpacity>
                {isLoading ? (
                  <ActivityIndicator size="small" color="#4CAF50" />
                ) : (
                  <Text style={styles.gridQtyText}>{quantityInCart}</Text>
                )}
                <TouchableOpacity
                  style={styles.gridQtyBtn}
                  onPress={() => handleQuantityUpdate(item, 'increase')}
                  disabled={isLoading || quantityInCart >= (item.stock || item.countInStock)}
                >
                  <Ionicons name="add" size={14} color="#2E7D32" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // ── LIST VIEW ITEM ──
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
              <Text style={styles.listProductName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.listProductUnit}>/{item.unit || 'piece'}</Text>
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
                name={(item.stock <= 0 || item.countInStock <= 0) ? 'close-circle' : 'checkmark-circle'}
                size={16}
                color={(item.stock <= 0 || item.countInStock <= 0) ? '#F44336' : '#4CAF50'}
              />
              <Text style={[
                styles.stockStatusText,
                (item.stock <= 0 || item.countInStock <= 0) ? styles.outOfStockStatus : styles.inStockStatus,
              ]}>
                {(item.stock <= 0 || item.countInStock <= 0) ? 'Out of Stock' : 'In Stock'}
              </Text>
            </View>
            {isInCart ? (
              <View style={styles.listQuantityControls}>
                <TouchableOpacity
                  style={[styles.listQuantityButton, quantityInCart <= 1 && styles.listQuantityButtonDisabled]}
                  onPress={() => handleQuantityUpdate(item, 'decrease')}
                  disabled={isLoading}
                >
                  <Ionicons name="remove" size={14} color={quantityInCart <= 1 ? '#CCCCCC' : '#2E7D32'} />
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
                  disabled={isLoading || quantityInCart >= (item.stock || item.countInStock)}
                >
                  <Ionicons name="add" size={14} color={quantityInCart >= (item.stock || item.countInStock) ? '#CCCCCC' : '#2E7D32'} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.listCartButton, isLoading && styles.listAddingButton, (item.stock <= 0 || item.countInStock <= 0) && styles.listOutOfStockButton]}
                onPress={() => handleAddToCart(item)}
                disabled={isLoading || (item.stock <= 0 || item.countInStock <= 0)}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name={(item.stock <= 0 || item.countInStock <= 0) ? 'close' : 'cart-outline'} size={16} color="#FFFFFF" />
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
      <Ionicons name="search-outline" size={64} color="#E0E0E0" />
      <Text style={styles.emptyStateTitle}>No products found</Text>
      <Text style={styles.emptyStateText}>
        {searchQuery
          ? `No results for "${searchQuery}"`
          : selectedCategory !== 'all'
            ? `No products in this category`
            : 'Try adjusting your filters or search terms'}
      </Text>
      <TouchableOpacity
        style={styles.resetButton}
        onPress={() => {
          setSearchQuery('');
          setSelectedCategory('all');
          setFilters({ inStockOnly: false, sortBy: 'name', minPrice: '', maxPrice: '', page: 1, limit: 20 });
          loadProducts(true);
        }}
      >
        <Ionicons name="refresh" size={16} color="#FFFFFF" />
        <Text style={styles.resetButtonText}>Reset Filters</Text>
      </TouchableOpacity>
    </View>
  );

  const showFullScreenLoader = loading || categoryLoading || searchLoading;
  const loadingType = searchLoading ? 'search' : categoryLoading ? 'category' : 'default';
  const getCategoryNameForLoader = () => {
    if (selectedCategory === 'all') return '';
    const category = categories.find(c => c.id === selectedCategory);
    return category ? category.name : selectedCategory;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar backgroundColor="#2E7D32" barStyle="light-content" />

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
            <Ionicons name="checkmark-circle" size={50} color="#4CAF50" style={{ marginBottom: 16 }} />
            <Text style={styles.successTitle}>Added to Cart!</Text>
            <Text style={styles.successMessage}>{addedProductName} has been added to your cart</Text>
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
            <TouchableOpacity style={styles.continueButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.continueButtonText}>Continue Shopping</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Sort Modal */}
      <Modal
        visible={sortModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSortModalVisible(false)}
      >
        <View style={styles.sortModalOverlay}>
          <View style={styles.sortModalContent}>
            <View style={styles.sortModalHeader}>
              <Text style={styles.sortModalTitle}>Sort Products</Text>
              <TouchableOpacity onPress={() => setSortModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[styles.sortOption, filters.sortBy === option.id && styles.sortOptionActive]}
                onPress={() => handleSortSelect(option.id)}
              >
                <Ionicons name={option.icon} size={18} color={filters.sortBy === option.id ? '#4CAF50' : '#666'} style={{ marginRight: 12 }} />
                <Text style={[styles.sortOptionText, filters.sortBy === option.id && styles.sortOptionTextActive]}>
                  {option.label}
                </Text>
                {filters.sortBy === option.id && <Ionicons name="checkmark" size={18} color="#4CAF50" />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2E7D32" />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        onScrollEndDrag={() => {
          if (pagination.hasNextPage) handleLoadMore();
        }}
      >
        {/* ── GREEN HEADER BAR ── */}
        <View style={styles.topBar}>
          <Text style={styles.topBarTitle}>Fresh Food Stuffs</Text>
          <TouchableOpacity
            style={styles.cartIconBtn}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Cart' })}
          >
            <Ionicons name={cartCount > 0 ? 'cart' : 'cart-outline'} size={22} color="#fff" />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── HERO IMAGE ── */}
        <View style={styles.heroWrap}>
          <Image source={{ uri: getHeroImage() }} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.heroOverlay} />
        </View>

        {/* ── CATEGORY TABS (on green strip) ── */}
        <View style={styles.categoryStrip}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryStripScroll}>
            <TouchableOpacity
              style={[styles.catTab, selectedCategory === 'all' && styles.catTabActive]}
              onPress={() => handleCategorySelect('all')}
            >
              <Text style={[styles.catTabText, selectedCategory === 'all' && styles.catTabTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            {categories.map(category => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.catTab,
                  (selectedCategory === category.id || selectedCategory === category.name?.toLowerCase()) && styles.catTabActive,
                ]}
                onPress={() => handleCategorySelect(category.id)}
                disabled={categoryLoading}
              >
                <Text style={[
                  styles.catTabText,
                  (selectedCategory === category.id || selectedCategory === category.name?.toLowerCase()) && styles.catTabTextActive,
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── SEARCH + SORT BAR (Enhanced for prominence) ── */}
        <View style={styles.searchSortRow}>
          {showSearch ? (
            <View style={styles.searchBarActive}>
              <Ionicons name="search-outline" size={18} color="#4CAF50" style={{ marginLeft: 12 }} />
              <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                placeholder="Search products..."
                placeholderTextColor="#9E9E9E"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
                autoFocus
              />
              {searchLoading ? (
                <ActivityIndicator size="small" color="#4CAF50" style={{ marginRight: 10 }} />
              ) : (
                <TouchableOpacity onPress={handleSearch} style={styles.searchIconBtn}>
                  <Ionicons name="search" size={20} color="#4CAF50" />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => { setShowSearch(false); setSearchQuery(''); if (searchQuery) loadProducts(true); }}
                style={styles.closeSearchBtn}
              >
                <Ionicons name="close-circle" size={20} color="#BDBDBD" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.searchBarInactive} 
              onPress={() => setShowSearch(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="search-outline" size={20} color="#4CAF50" />
              <Text style={styles.searchPlaceholder}>Search for fresh products...</Text>
              <View style={styles.searchHint}>
                <Ionicons name="arrow-up" size={14} color="#4CAF50" />
              </View>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.sortBtn} onPress={() => setSortModalVisible(true)}>
            <Ionicons name="funnel-outline" size={18} color="#2E7D32" />
            <Text style={styles.sortBtnText}>Sort</Text>
          </TouchableOpacity>
        </View>

        {/* ── RESULTS COUNT ── */}
        <View style={styles.resultsRow}>
          <Text style={styles.resultsText}>
            {loading || categoryLoading
              ? 'Loading...'
              : `${products.length} of ${totalProducts} products`}
          </Text>
          <View style={styles.viewModeButtons}>
            <TouchableOpacity
              style={[styles.viewModeBtn, viewMode === 'grid' && styles.viewModeBtnActive]}
              onPress={() => setViewMode('grid')}
            >
              <Ionicons name="grid-outline" size={18} color={viewMode === 'grid' ? '#2E7D32' : '#9E9E9E'} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewModeBtn, viewMode === 'list' && styles.viewModeBtnActive]}
              onPress={() => setViewMode('list')}
            >
              <Ionicons name="list-outline" size={18} color={viewMode === 'list' ? '#2E7D32' : '#9E9E9E'} />
            </TouchableOpacity>
          </View>
        </View>

        {products.length === 0 && !loading ? (
          renderEmptyState()
        ) : viewMode === 'list' ? (
          // ── LIST VIEW ──
          <View style={styles.listContainer}>
            {products.map(item => (
              <View key={item.id || item._id}>
                {renderProductListItem({ item })}
              </View>
            ))}
          </View>
        ) : (
          // ── SIMPLIFIED GRID VIEW - All products in a single 2-column grid ──
          <View style={styles.gridContainer}>
            <View style={styles.productsGrid}>
              {products.map(item => renderGridCard(item))}
            </View>

            {/* Load More */}
            {pagination.hasNextPage && (
              <View style={styles.loadMoreWrap}>
                <TouchableOpacity style={styles.loadMoreButton} onPress={handleLoadMore}>
                  <Ionicons name="chevron-down" size={18} color="#4CAF50" />
                  <Text style={styles.loadMoreText}>Load More Products</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  scrollContent: { paddingBottom: 20 },

  // ── TOP BAR ──
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
  topBarTitle: { fontSize: 17, fontWeight: '700', color: '#fff', flex: 1, textAlign: 'center' },
  cartIconBtn: { padding: 4, position: 'relative' },
  cartBadge: {
    position: 'absolute', top: -2, right: -2,
    backgroundColor: '#D32F2F', borderRadius: 10,
    minWidth: 16, height: 16, justifyContent: 'center',
    alignItems: 'center', borderWidth: 1.5, borderColor: '#2E7D32',
  },
  cartBadgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold', paddingHorizontal: 2 },

  // ── HERO ──
  heroWrap: { height: 200, backgroundColor: '#C8E6C9' },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },

  // ── CATEGORY STRIP ──
  categoryStrip: { backgroundColor: '#2E7D32', paddingVertical: 0 },
  categoryStripScroll: { paddingHorizontal: 12, paddingVertical: 0 },
  catTab: {
    paddingHorizontal: 18, paddingVertical: 12,
    marginRight: 2,
  },
  catTabActive: {
    borderBottomWidth: 3, borderBottomColor: '#fff',
  },
  catTabText: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  catTabTextActive: { color: '#fff' },

  // ── SEARCH + SORT (Enhanced) ──
  searchSortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchBarInactive: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 30,
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 10,
    borderWidth: 2,
    borderColor: '#4CAF50',
    elevation: 3,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  searchBarActive: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#4CAF50',
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#212121',
    paddingVertical: 12,
  },
  searchPlaceholder: {
    fontSize: 15,
    color: '#757575',
    flex: 1,
    fontWeight: '500',
  },
  searchHint: {
    backgroundColor: '#F1F8E9',
    borderRadius: 15,
    padding: 4,
  },
  searchIconBtn: {
    padding: 8,
  },
  closeSearchBtn: {
    padding: 8,
    marginRight: 4,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F8E9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 30,
    gap: 6,
    borderWidth: 1,
    borderColor: '#4CAF50',
    elevation: 2,
  },
  sortBtnText: { fontSize: 14, color: '#2E7D32', fontWeight: '700' },

  // ── RESULTS ROW ──
  resultsRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 12, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
    marginBottom: 8,
  },
  resultsText: { fontSize: 14, color: '#9E9E9E', fontWeight: '500' },
  viewModeButtons: { flexDirection: 'row', gap: 8 },
  viewModeBtn: { padding: 8, borderRadius: 8 },
  viewModeBtnActive: { backgroundColor: '#F1F8E9' },

  // ── GRID CONTAINER ──
  gridContainer: {
    backgroundColor: '#fff',
    paddingTop: 16,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 10,
  },

  // ── GRID CARDS (Unified 2-column design with improved layout) ──
  gridCard: {
    width: (width - 34) / 2,
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 10,
  },
  gridCardImageWrap: { position: 'relative', height: 140 },
  gridCardImage: { width: '100%', height: '100%' },
  gridCardCatBadge: {
    position: 'absolute', bottom: 8, right: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6,
  },
  gridCardCatText: { fontSize: 10, color: '#2E7D32', fontWeight: '600' },
  gridCardInfo: { padding: 12 },
  gridCardName: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#212121', 
    marginBottom: 8 
  },
  
  // Price row with inline Add button
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  gridCardPrice: { 
    fontSize: 16, 
    fontWeight: '800', 
    color: '#1B5E20',
  },
  
  // Compact Add to Cart button (inline with price)
  gridAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    gap: 4,
  },
  gridAddBtnText: { 
    fontSize: 12, 
    fontWeight: '700', 
    color: '#fff' 
  },
  
  // Quantity controls container (full width, below price)
  gridQtyContainer: {
    width: '100%',
    marginTop: 2,
  },
  gridQtyLabel: {
    fontSize: 11,
    color: '#757575',
    marginBottom: 4,
    fontWeight: '500',
  },
  gridQtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
   
  },
  gridQtyBtn: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    //borderColor: '#4CAF50',
  },
  gridQtyText: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: '#2E7D32', 
    minWidth: 30, 
    textAlign: 'center' 
  },

  // ── SHARED ──
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', alignItems: 'center',
  },
  outOfStockOverlayText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  disabledBtn: { backgroundColor: '#BDBDBD' },

  // ── LIST VIEW ──
  listContainer: {
    backgroundColor: '#fff',
    paddingTop: 8,
  },
  listItem: {
    flexDirection: 'row', backgroundColor: '#fff',
    marginHorizontal: 12, marginBottom: 10,
    borderRadius: 12, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
    borderWidth: 1, borderColor: '#F0F0F0',
  },
  listImage: { width: 90, height: 90, backgroundColor: '#F5F5F5' },
  listInfo: { flex: 1, padding: 10 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  listTitleContainer: { flex: 1 },
  listProductName: { fontSize: 14, fontWeight: '600', color: '#212121', marginBottom: 2 },
  listProductUnit: { fontSize: 12, color: '#9E9E9E' },
  listCategoryBadge: { backgroundColor: '#F1F8E9', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, marginLeft: 8 },
  listCategoryText: { fontSize: 10, color: '#2E7D32', fontWeight: '600' },
  listProductPrice: { fontSize: 16, fontWeight: '800', color: '#2E7D32', marginBottom: 8 },
  listActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stockStatus: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stockStatusText: { fontSize: 11, fontWeight: '500' },
  inStockStatus: { color: '#4CAF50' },
  outOfStockStatus: { color: '#F44336' },
  listCartButton: { backgroundColor: '#4CAF50', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  listAddingButton: { backgroundColor: '#81C784' },
  listOutOfStockButton: { backgroundColor: '#9E9E9E' },
  listQuantityControls: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8F9FA', borderRadius: 8,
    padding: 3, borderWidth: 1, borderColor: '#E0E0E0', gap: 2,
  },
  listQuantityButton: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#fff', justifyContent: 'center',
    alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0',
  },
  listQuantityButtonDisabled: { opacity: 0.4 },
  listQuantityDisplay: { minWidth: 26, alignItems: 'center' },
  listQuantityText: { fontSize: 13, fontWeight: '700', color: '#212121' },

  // ── EMPTY STATE ──
  emptyState: { alignItems: 'center', padding: 60, marginTop: 20 },
  emptyStateTitle: { fontSize: 19, fontWeight: '700', color: '#1B5E20', marginTop: 16, marginBottom: 8 },
  emptyStateText: { fontSize: 14, color: '#9E9E9E', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  resetButton: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#4CAF50', paddingHorizontal: 20,
    paddingVertical: 12, borderRadius: 10, gap: 8,
  },
  resetButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  // ── LOAD MORE ──
  loadMoreWrap: { padding: 20, alignItems: 'center' },
  loadMoreButton: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F1F8E9', paddingHorizontal: 20,
    paddingVertical: 12, borderRadius: 10, gap: 8,
  },
  loadMoreText: { color: '#4CAF50', fontSize: 14, fontWeight: '600' },

  // ── MODAL ──
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  successModal: {
    backgroundColor: '#fff', borderRadius: 20, padding: 28,
    alignItems: 'center', width: '100%', maxWidth: 340,
    elevation: 5, shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8,
  },
  successTitle: { fontSize: 20, fontWeight: '700', color: '#1B5E20', marginBottom: 8, textAlign: 'center' },
  successMessage: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 22, lineHeight: 20 },
  viewCartButton: {
    backgroundColor: '#4CAF50', width: '100%', paddingVertical: 13,
    borderRadius: 12, alignItems: 'center', marginBottom: 10,
  },
  viewCartButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  continueButton: {
    width: '100%', paddingVertical: 13, borderRadius: 12,
    alignItems: 'center', borderWidth: 2, borderColor: '#4CAF50',
  },
  continueButtonText: { color: '#4CAF50', fontSize: 15, fontWeight: '600' },

  // ── SORT MODAL ──
  sortModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sortModalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  sortModalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  sortModalTitle: { fontSize: 17, fontWeight: '600', color: '#1B5E20' },
  sortOption: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  sortOptionActive: { backgroundColor: '#F1F8E9' },
  sortOptionText: { flex: 1, fontSize: 15, color: '#212121' },
  sortOptionTextActive: { color: '#2E7D32', fontWeight: '600' },
});

export default ProductsScreen;