import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Dimensions,
  Alert,
  Image,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FullScreenLoader from '../components/FullScreenLoader';
import productService from '../services/productService';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

// Hero images per category
const HERO_IMAGES = {
  all: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1773523455/grocerry2_eul0ez.jpg',
  vegetables: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1769990080/vegetables_cpp5n5.jpg',
  fruits: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1773488413/fruits_1_shqhh2.jpg',
  staples: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1770886305/staple_food_xlgo92.jpg',
  herb: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1770885919/spices_and_herbs_srdlvf.jpg',
  tuber: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1773487837/thomas-le-pRJhn4MbsMM-unsplash_xoh451.jpg',
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
    limit: 100,
  });
  const [viewMode, setViewMode] = useState('grid');
  const [showSearch, setShowSearch] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [addingProductId, setAddingProductId] = useState(null);
  const [updatingProductId, setUpdatingProductId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [addedProductName, setAddedProductName] = useState('');

  // Refs
  const searchInputRef = useRef(null);
  // Used to cancel stale fetch calls when a new one starts
  const fetchIdRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // Initialise category from route params once
  useEffect(() => {
    if (route.params?.category) {
      setSelectedCategory(route.params.category.toLowerCase());
    }
  }, [route.params?.category]);

  // Auto-focus search input
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      const t = setTimeout(() => searchInputRef.current?.focus(), 100);
      return () => clearTimeout(t);
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
      if (response.success && isMountedRef.current) setCategories(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // FIXED loadProducts: each call gets a unique fetchId.
  // If a newer call has started by the time this one resolves,
  // we discard the stale result instead of overwriting state.
  // This is the core fix for the "loading spinner stuck forever" bug.
  // ─────────────────────────────────────────────────────────────────
  const loadProducts = useCallback(async (opts = {}) => {
    const {
      reset = false,
      category = selectedCategory,
      query = searchQuery,
      filterOverrides = {},
      page = 1,
      append = false,
    } = opts;

    // Stamp this fetch so we can detect stale responses
    fetchIdRef.current += 1;
    const myFetchId = fetchIdRef.current;

    if (!append) setLoading(true);

    try {
      const backendCategory = mapCategoryForBackend(category);
      const mergedFilters = { ...filters, ...filterOverrides };
      const params = {
        category: backendCategory,
        search: query || undefined,
        ...mergedFilters,
        page,
      };

      const response = await productService.getProducts(params);

      // Discard if a newer fetch has already started
      if (myFetchId !== fetchIdRef.current) return;
      if (!isMountedRef.current) return;

      if (response.success) {
        if (append) {
          setProducts(prev => [...prev, ...response.data]);
        } else {
          setProducts(response.data);
        }
        setTotalProducts(response.total || 0);
        setPagination(response.pagination || {});
      }
    } catch (error) {
      if (myFetchId !== fetchIdRef.current) return;
      console.error('Error loading products:', error);
    } finally {
      if (myFetchId !== fetchIdRef.current) return;
      if (!isMountedRef.current) return;
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory, searchQuery, filters]);

  // Initial data load
  useEffect(() => {
    loadCategories();
    loadProducts({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch when category changes (debounced slightly for UX)
  useEffect(() => {
    const t = setTimeout(() => {
      loadProducts({ reset: true, category: selectedCategory });
    }, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  // Re-fetch when filter/sort options change
  useEffect(() => {
    if (!loading) {
      loadProducts({ reset: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.inStockOnly, filters.sortBy, filters.minPrice, filters.maxPrice]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProducts({ reset: true });
  }, [loadProducts]);

  const handleSearch = useCallback(() => {
    if (searchQuery.trim().length >= 2 || searchQuery.trim() === '') {
      loadProducts({ reset: true, query: searchQuery });
      setShowSearch(false);
    }
  }, [searchQuery, loadProducts]);

  const handleCategorySelect = useCallback((categoryId) => {
    setSelectedCategory(categoryId);
  }, []);

  const handleAddToCart = async (product) => {
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
    try {
      setAddingProductId(product.id || product._id);
      setAddedProductName(product.name);
      await addToCart(product.id || product._id, 1);
      setModalVisible(true);
      setTimeout(() => setModalVisible(false), 2000);
    } catch (error) {
      console.error('Add to cart error:', error);
      Alert.alert('Error', 'Failed to add item to cart. Please try again.');
    } finally {
      setAddingProductId(null);
    }
  };

  const handleQuantityUpdate = async (product, action) => {
    const productId = product.id || product._id;
    const currentQuantity = getQuantityInCart(productId);
    try {
      if (action === 'increase') {
        const availableStock = product.stock || product.countInStock;
        if (currentQuantity >= availableStock) {
          Alert.alert('Stock Limit', `Only ${availableStock} units available.`);
          return;
        }
        setUpdatingProductId(productId);
        await addToCart(productId, 1);
      } else if (action === 'decrease' && currentQuantity > 1) {
        setUpdatingProductId(productId);
        await updateQuantity(productId, currentQuantity - 1);
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
        return;
      }
    } catch (error) {
      console.error('Quantity update error:', error);
      Alert.alert('Error', 'Failed to update quantity.');
    } finally {
      setUpdatingProductId(null);
    }
  };

  const getQuantityInCart = (productId) => {
    const cartItem = cartItems.find(
      item => item.product?._id === productId || item.productId === productId,
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
      loadProducts({ append: true, page: nextPage });
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

  const getHeroImage = () => HERO_IMAGES[selectedCategory] || HERO_IMAGES.all;

  const getCategoryLabel = () => {
    if (selectedCategory === 'all') return 'Fresh Food Stuffs';
    const cat = categories.find(c => c.id === selectedCategory || c.name?.toLowerCase() === selectedCategory);
    return cat ? `Fresh ${cat.name}` : selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1);
  };

  // ── GRID CARD ──
  const renderGridCard = (item) => {
    const productId = item.id || item._id;
    const quantityInCart = getQuantityInCart(productId);
    const isInCart = quantityInCart > 0;
    const isAdding = addingProductId === productId;
    const isUpdating = updatingProductId === productId;
    const isLoading = isAdding || isUpdating;
    const outOfStock = item.stock <= 0 || item.countInStock <= 0;

    return (
      <TouchableOpacity
        key={productId}
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
    const productId = item.id || item._id;
    const quantityInCart = getQuantityInCart(productId);
    const isInCart = quantityInCart > 0;
    const isAdding = addingProductId === productId;
    const isUpdating = updatingProductId === productId;
    const isLoading = isAdding || isUpdating;
    const outOfStock = item.stock <= 0 || item.countInStock <= 0;

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
                name={outOfStock ? 'close-circle' : 'checkmark-circle'}
                size={16}
                color={outOfStock ? '#F44336' : '#4CAF50'}
              />
              <Text style={[styles.stockStatusText, outOfStock ? styles.outOfStockStatus : styles.inStockStatus]}>
                {outOfStock ? 'Out of Stock' : 'In Stock'}
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
                style={[styles.listCartButton, isLoading && styles.listAddingButton, outOfStock && styles.listOutOfStockButton]}
                onPress={() => handleAddToCart(item)}
                disabled={isLoading || outOfStock}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name={outOfStock ? 'close' : 'cart-outline'} size={16} color="#FFFFFF" />
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
            ? 'No products in this category'
            : 'Try adjusting your filters or search terms'}
      </Text>
      <TouchableOpacity
        style={styles.resetButton}
        onPress={() => {
          setSearchQuery('');
          setSelectedCategory('all');
          setFilters({ inStockOnly: false, sortBy: 'name', minPrice: '', maxPrice: '', page: 1, limit: 20 });
          loadProducts({ reset: true });
        }}
      >
        <Ionicons name="refresh" size={16} color="#FFFFFF" />
        <Text style={styles.resetButtonText}>Reset Filters</Text>
      </TouchableOpacity>
    </View>
  );

  const getCategoryNameForLoader = () => {
    if (selectedCategory === 'all') return '';
    const category = categories.find(c => c.id === selectedCategory);
    return category ? category.name : selectedCategory;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar backgroundColor="transparent" translucent barStyle="light-content" />

      <FullScreenLoader
        visible={loading}
        loadingType={loading ? 'category' : 'default'}
        categoryName={getCategoryNameForLoader()}
        searchQuery={searchQuery}
        loadedCount={products.length}
        totalCount={totalProducts}
        loadingText="Loading Fresh Products..."
        subText="Getting the freshest items for you"
        icon="leaf"
        iconColor="#4CAF50"
      />

      {/* ── CART SUCCESS MODAL ── */}
      <Modal
        animationType="fade"
        transparent
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

      {/* ── SORT MODAL ── */}
      <Modal
        visible={sortModalVisible}
        transparent
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
        onScrollEndDrag={() => { if (pagination.hasNextPage) handleLoadMore(); }}
      >

        {/* ══════════════════════════════════════════
            NEW HERO SECTION — title + nav overlaid
            on full-width photo, matching the screenshot
            ══════════════════════════════════════════ */}
        <View style={styles.heroWrap}>
          {/* Background photo */}
          <Image source={{ uri: getHeroImage() }} style={styles.heroImage} resizeMode="cover" />

          {/* Dark gradient scrim so text pops */}
          <View style={styles.heroScrim} />

          {/* Top nav row: back arrow | title | cart icon */}
          <View style={styles.heroNavRow}>
            <TouchableOpacity style={styles.heroNavBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </TouchableOpacity>

            <Text style={styles.heroTitle}>{getCategoryLabel()}</Text>

            <TouchableOpacity
              style={styles.heroNavBtn}
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
        </View>

        {/* ══════════════════════════════════════════
            CATEGORY TABS — dark green strip below hero
            ══════════════════════════════════════════ */}
        <View style={styles.categoryStrip}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryStripScroll}
          >
            <TouchableOpacity
              style={[styles.catTab, selectedCategory === 'all' && styles.catTabActive]}
              onPress={() => handleCategorySelect('all')}
            >
              <Text style={[styles.catTabText, selectedCategory === 'all' && styles.catTabTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            {categories.map(category => {
              const isActive =
                selectedCategory === category.id ||
                selectedCategory === category.name?.toLowerCase();
              return (
                <TouchableOpacity
                  key={category.id}
                  style={[styles.catTab, isActive && styles.catTabActive]}
                  onPress={() => handleCategorySelect(category.id)}
                  disabled={loading}
                >
                  <Text style={[styles.catTabText, isActive && styles.catTabTextActive]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── SEARCH + SORT BAR ── */}
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
              <TouchableOpacity onPress={handleSearch} style={styles.searchIconBtn}>
                <Ionicons name="search" size={20} color="#4CAF50" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setShowSearch(false); setSearchQuery(''); loadProducts({ reset: true, query: '' }); }}
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
              <Text style={styles.searchPlaceholder}>Search...</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.sortBtn} onPress={() => setSortModalVisible(true)}>
            <Ionicons name="funnel-outline" size={18} color="#2E7D32" />
            <Text style={styles.sortBtnText}>Sort</Text>
          </TouchableOpacity>
        </View>

        {/* ── RESULTS COUNT + VIEW MODE ── */}
        <View style={styles.resultsRow}>
          <Text style={styles.resultsText}>
            {loading ? 'Loading...' : `${products.length} of ${totalProducts} products`}
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

        {/* ── PRODUCT LIST / GRID ── */}
        {products.length === 0 && !loading ? (
          renderEmptyState()
        ) : viewMode === 'list' ? (
          <View style={styles.listContainer}>
            {products.map(item => (
              <View key={item.id || item._id}>
                {renderProductListItem({ item })}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.gridContainer}>
            <View style={styles.productsGrid}>
              {products.map(item => renderGridCard(item))}
            </View>
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
  scrollContent: { paddingBottom: 20,
    borderTopLeftRadius:18,
    borderTopRightRadius:18, },

  // ══════════════════════════════════
  // HERO — full bleed, nav overlaid
  // ══════════════════════════════════
  heroWrap: {
    height: 220,
    position: 'relative',
    backgroundColor: '#2E7D32',
    borderTopLeftRadius:18,
    borderTopRightRadius:18,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius:18,
    borderTopRightRadius:18,
  },
  // Gradient-style scrim so white text is always legible
  heroScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.38)',
    borderTopLeftRadius:18,
    borderTopRightRadius:18,
    
  },
  heroNavRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 10,
  },
  heroNavBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.30)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#D32F2F',
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.3)',
  },
  cartBadgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold', paddingHorizontal: 2 },

  // ══════════════════════════════════
  // CATEGORY STRIP — darker green band
  // ══════════════════════════════════
  categoryStrip: {
    backgroundColor: '#2E7D32',      // slightly darker than hero bar to differentiate
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  categoryStripScroll: { paddingHorizontal: 12 },
  catTab: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginRight: 2,
  },
  catTabActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#fff',
  },
  catTabText: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.65)' },
  catTabTextActive: { color: '#fff' },

  // ── SEARCH + SORT ──
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
  searchPlaceholder: { fontSize: 15, color: '#757575', flex: 1, fontWeight: '500' },
  searchHint: { backgroundColor: '#F1F8E9', borderRadius: 15, padding: 4 },
  searchIconBtn: { padding: 8 },
  closeSearchBtn: { padding: 8, marginRight: 4 },
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 8,
  },
  resultsText: { fontSize: 14, color: '#9E9E9E', fontWeight: '500' },
  viewModeButtons: { flexDirection: 'row', gap: 8 },
  viewModeBtn: { padding: 8, borderRadius: 8 },
  viewModeBtnActive: { backgroundColor: '#F1F8E9' },

  // ── GRID ──
  gridContainer: { backgroundColor: '#fff', paddingTop: 16 },
  productsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 10 },
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
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  gridCardCatText: { fontSize: 10, color: '#2E7D32', fontWeight: '600' },
  gridCardInfo: { padding: 12 },
  gridCardName: { fontSize: 14, fontWeight: '600', color: '#212121', marginBottom: 8 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  gridCardPrice: { fontSize: 16, fontWeight: '800', color: '#1B5E20' },
  gridAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    gap: 4,
  },
  gridAddBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  gridQtyContainer: { width: '100%', marginTop: 2 },
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
  },
  gridQtyText: { fontSize: 14, fontWeight: '700', color: '#2E7D32', minWidth: 30, textAlign: 'center' },

  // ── SHARED ──
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockOverlayText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  disabledBtn: { backgroundColor: '#BDBDBD' },

  // ── LIST VIEW ──
  listContainer: { backgroundColor: '#fff', paddingTop: 8 },
  listItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginBottom: 10,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 3,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 2,
  },
  listQuantityButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  listQuantityButtonDisabled: { opacity: 0.4 },
  listQuantityDisplay: { minWidth: 26, alignItems: 'center' },
  listQuantityText: { fontSize: 13, fontWeight: '700', color: '#212121' },

  // ── EMPTY STATE ──
  emptyState: { alignItems: 'center', padding: 60, marginTop: 20 },
  emptyStateTitle: { fontSize: 19, fontWeight: '700', color: '#1B5E20', marginTop: 16, marginBottom: 8 },
  emptyStateText: { fontSize: 14, color: '#9E9E9E', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  resetButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  // ── LOAD MORE ──
  loadMoreWrap: { padding: 20, alignItems: 'center' },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F8E9',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  loadMoreText: { color: '#4CAF50', fontSize: 14, fontWeight: '600' },

  // ── MODALS ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successModal: {
    backgroundColor: '#fff',
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
  successTitle: { fontSize: 20, fontWeight: '700', color: '#1B5E20', marginBottom: 8, textAlign: 'center' },
  successMessage: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 22, lineHeight: 20 },
  viewCartButton: {
    backgroundColor: '#4CAF50',
    width: '100%',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  viewCartButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  continueButton: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  continueButtonText: { color: '#4CAF50', fontSize: 15, fontWeight: '600' },
  sortModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sortModalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  sortModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sortModalTitle: { fontSize: 17, fontWeight: '600', color: '#1B5E20' },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  sortOptionActive: { backgroundColor: '#F1F8E9' },
  sortOptionText: { flex: 1, fontSize: 15, color: '#212121' },
  sortOptionTextActive: { color: '#2E7D32', fontWeight: '600' },
});

export default ProductsScreen;