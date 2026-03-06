// src/screens/main/HomeScreen.js
import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Alert,
  Modal,
  TextInput,
  StatusBar,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ProductCard from '../components/ProductCard';
import productService from '../services/productService';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const CATEGORY_IMAGES = {
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
  organic: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=800&q=80',
  default: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1769990080/vegetables_cpp5n5.jpg',
};

// Category icons mapping
const CATEGORY_ICONS = {
  fruits: '🍎',
  vegetables: '🥦',
  dairy: '🥛',
  meat: '🥩',
  seafood: '🐟',
  bakery: '🍞',
  beverages: '🥤',
  staples: '🌾',
  herb: '🌿',
  tuber: '🥔',
  organic: '🌱',
  snacks: '🍪',
  default: '🛒',
};

const HomeScreen = () => {
  const navigation = useNavigation();
  const { user, isAuthenticated } = useAuth();
  const { addToCart, cartCount, cartItems } = useCart();
  const { unreadCount } = useContext(NotificationContext);

  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addingProductId, setAddingProductId] = useState(null);
  const [showCartSuccessModal, setShowCartSuccessModal] = useState(false);
  const [addedProductName, setAddedProductName] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadHomeData();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        performSearch();
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      const categoriesResponse = await productService.getCategories();
      if (categoriesResponse.success) {
        setCategories(categoriesResponse.data.slice(1, 7));
      }
      const params = { limit: 6, page: 1 };
      const [featuredRes, newRes, bestRes] = await Promise.all([
        productService.getProductByTag("featured"),
        productService.getProductByTag("new_arrival"),
        productService.getProductByTag("best_selling"),
      ]);
      if (featuredRes.status===200) setFeaturedProducts(featuredRes.data.data);
      if (newRes.status===200) setNewArrivals(newRes.data.data);
      if (bestRes.status===200) setBestSellers(bestRes.data.data);
    } catch (error) {
      console.error('Error loading home data:', error);
      Alert.alert('Error', 'Failed to load home data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadHomeData();
  }, []);

  const performSearch = async () => {
    if (searchQuery.trim().length === 0) return;
    setSearching(true);
    try {
      const response = await productService.getProducts({ search: searchQuery, limit: 10 });
      if (response.success) {
        setSearchResults(response.data);
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim().length > 0) {
      navigation.navigate('Products', { search: searchQuery });
      clearSearch();
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  // New function to handle closing search results
  const closeSearchResults = () => {
    setShowSearchResults(false);
    // Optionally clear search query as well
    // setSearchQuery('');
  };

  const getQuantityInCart = (productId) => {
    const cartItem = cartItems.find(
      (item) => item.product?._id === productId || item.productId === productId
    );
    return cartItem ? cartItem.quantity : 0;
  };

  const handleAddToCart = async (product) => {
    try {
      if (product.stock <= 0 || product.countInStock <= 0) {
        Alert.alert('Out of Stock', `${product.name} is currently out of stock.`);
        return;
      }
      if (!isAuthenticated) {
        Alert.alert(
          'Login Required',
          'Please login to add items to cart.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Login', onPress: () => navigation.navigate('Login') },
          ]
        );
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

 
  const getCategoryIcon = (categoryName) => {
    if (!categoryName) return CATEGORY_ICONS.default;
    const name = categoryName.toLowerCase();
    if (name.includes('fruit')) return CATEGORY_ICONS.fruits;
    if (name.includes('vegetable') || name.includes('veggie')) return CATEGORY_ICONS.vegetables;
    if (name.includes('dairy') || name.includes('milk')) return CATEGORY_ICONS.dairy;
    if (name.includes('meat') || name.includes('chicken')) return CATEGORY_ICONS.meat;
    if (name.includes('seafood') || name.includes('fish')) return CATEGORY_ICONS.seafood;
    if (name.includes('bakery') || name.includes('bread')) return CATEGORY_ICONS.bakery;
    if (name.includes('beverage') || name.includes('drink')) return CATEGORY_ICONS.beverages;
    if (name.includes('staple')) return CATEGORY_ICONS.staples;
    if (name.includes('herb') || name.includes('spice')) return CATEGORY_ICONS.herb;
    if (name.includes('tuber') || name.includes('potato')) return CATEGORY_ICONS.tuber;
    if (name.includes('organic')) return CATEGORY_ICONS.organic;
    if (name.includes('snack')) return CATEGORY_ICONS.snacks;
    return CATEGORY_ICONS.default;
  };

  const renderDealCard = (product) => {
    const quantityInCart = getQuantityInCart(product.id || product._id);
    const isInCart = quantityInCart > 0;
    const isAdding = addingProductId === (product.id || product._id);

    return (
      <TouchableOpacity
        key={product.id || product._id}
        style={styles.dealCard}
        onPress={() =>
          navigation.navigate('ProductDetail', {
            productId: product.id || product._id,
            product,
          })
        }
        activeOpacity={0.85}
        disabled={isAdding}
      >
        <Image
          source={{
            uri: product.image || product.images?.[0] ||
              'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80',
          }}
          style={styles.dealImage}
          resizeMode="cover"
        />
        <View style={styles.dealInfo}>
          <Text style={styles.dealName} numberOfLines={2}>{product.name}</Text>
          <Text style={styles.dealUnit}>{product.unit || 'piece'}</Text>
          <View style={styles.dealFooter}>
            <Text style={styles.dealPrice}>GH₵{product.price?.toFixed(2)}</Text>
            <TouchableOpacity
              style={[
                styles.dealAddButton,
                isInCart && styles.dealAddButtonActive,
                isAdding && styles.dealAddButtonLoading,
              ]}
              onPress={() => handleAddToCart(product)}
              disabled={isAdding}
            >
              {isAdding ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons
                    name={isInCart ? 'checkmark' : 'cart-outline'}
                    size={13}
                    color="#fff"
                  />
                  <Text style={styles.dealAddButtonText}>
                    {isInCart ? 'Added' : 'Add'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFeaturedCard = (product) => {
    const quantityInCart = getQuantityInCart(product.id || product._id);
    const isInCart = quantityInCart > 0;
    const isAdding = addingProductId === (product.id || product._id);

    return (
      <TouchableOpacity
        key={product.id || product._id}
        style={styles.featuredCard}
        onPress={() =>
          navigation.navigate('ProductDetail', {
            productId: product.id || product._id,
            product,
          })
        }
        activeOpacity={0.85}
        disabled={isAdding}
      >
        <Image
          source={{
            uri: product.image || product.images?.[0] ||
              'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80',
          }}
          style={styles.featuredImage}
          resizeMode="cover"
        />
        <View style={styles.featuredOverlay}>
          <Text style={styles.featuredName} numberOfLines={1}>{product.name}</Text>
          <View style={styles.featuredBottom}>
            <Text style={styles.featuredPrice}>GH₵{product.price?.toFixed(2)}</Text>
            <TouchableOpacity
              style={[styles.featuredAddBtn, isInCart && styles.featuredAddBtnActive]}
              onPress={() => handleAddToCart(product)}
              disabled={isAdding}
            >
              {isAdding ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name={isInCart ? 'checkmark' : 'add'} size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Loading fresh groceries...</Text>
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

      {/* ── GREEN HEADER ── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>FreshyFood Factory</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => navigation.navigate('Favorites')}
            >
              <Ionicons name="heart-outline" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => navigation.navigate('Notification')}
            >
              <Ionicons
                name={unreadCount > 0 ? 'notifications' : 'notifications-outline'}
                size={22}
                color="#fff"
              />
              {unreadCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchWrapper}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color="#9E9E9E" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search vegetables, fruits..."
              placeholderTextColor="#BDBDBD"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searching ? (
              <ActivityIndicator size="small" color="#2E7D32" />
            ) : searchQuery.length > 0 ? (
              <TouchableOpacity onPress={clearSearch}>
                <Ionicons name="close-circle" size={18} color="#BDBDBD" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.filterBtn}
                onPress={() => navigation.navigate('Products')}
              >
                <Ionicons name="options-outline" size={18} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Search Results Dropdown - Updated with close button and overlay */}
        {showSearchResults && (
          <>
            {/* Semi-transparent overlay to detect taps outside */}
            <TouchableWithoutFeedback onPress={closeSearchResults}>
              <View style={styles.searchOverlay} />
            </TouchableWithoutFeedback>
            
            <View style={styles.searchResultsContainer}>
              <View style={styles.searchResultsHeader}>
                <Text style={styles.searchResultsHeaderText}>
                  {searchResults.length > 0 ? 'Search Results' : 'No Results'}
                </Text>
                <TouchableOpacity onPress={closeSearchResults} style={styles.closeResultsBtn}>
                  <Ionicons name="close" size={20} color="#757575" />
                </TouchableOpacity>
              </View>
              
              {searchResults.length > 0 ? (
                <ScrollView
                  style={styles.searchResultsList}
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={false}
                >
                  {searchResults.map((product) => (
                    <TouchableOpacity
                      key={product.id || product._id}
                      style={styles.searchResultItem}
                      onPress={() => {
                        navigation.navigate('ProductDetail', {
                          productId: product.id || product._id,
                          product,
                        });
                        clearSearch();
                      }}
                    >
                      <Image
                        source={{
                          uri: product.image || product.images?.[0] ||
                            'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80',
                        }}
                        style={styles.searchResultImage}
                      />
                      <View style={styles.searchResultInfo}>
                        <Text style={styles.searchResultName} numberOfLines={1}>
                          {product.name}
                        </Text>
                        <Text style={styles.searchResultPrice}>
                          GH₵ {product.price?.toFixed(2)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity style={styles.viewAllResults} onPress={handleSearchSubmit}>
                    <Text style={styles.viewAllResultsText}>
                      View all results for "{searchQuery}"
                    </Text>
                    <Ionicons name="arrow-forward" size={16} color="#2E7D32" />
                  </TouchableOpacity>
                </ScrollView>
              ) : (
                !searching && searchQuery.length > 0 && (
                  <View style={styles.noResults}>
                    <Ionicons name="search-outline" size={40} color="#BDBDBD" />
                    <Text style={styles.noResultsText}>No products found</Text>
                    <Text style={styles.noResultsSubtext}>Try different keywords</Text>
                    
                    {/* Added "Try Again" button */}
                    <TouchableOpacity 
                      style={styles.tryAgainButton}
                      onPress={() => {
                        closeSearchResults();
                        // Optional: Focus the search input again
                        // You might need a ref to the TextInput to focus it
                      }}
                    >
                      <Text style={styles.tryAgainButtonText}>Try New Search</Text>
                    </TouchableOpacity>
                  </View>
                )
              )}
            </View>
          </>
        )}
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2E7D32" />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        // Add this to close search results when scrolling
        onScrollBeginDrag={closeSearchResults}
        scrollEventThrottle={16}
      >
        {/* ── HERO BANNER ── */}
        <TouchableOpacity
          style={styles.heroBanner}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('Products')}
        >
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=80',
            }}
            style={styles.heroBannerImage}
            resizeMode="cover"
          />
          <View style={styles.heroBannerOverlay}>
            <View style={styles.heroBannerContent}>
              <Text style={styles.heroBannerTitle}>Fresh Delivery{'\n'}to Your Door</Text>
              <TouchableOpacity
                style={styles.heroBannerBtn}
                onPress={() => navigation.navigate('Products')}
              >
                <Text style={styles.heroBannerBtnText}>Order Now</Text>
                <Ionicons name="arrow-forward" size={14} color="#2E7D32" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>

        {/* ── CATEGORIES ── */}
        {categories.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <TouchableOpacity
                style={styles.seeAllRow}
                onPress={() => navigation.navigate('Products')}
              >
                <Text style={styles.seeAllText}>See All</Text>
                <Ionicons name="chevron-forward" size={14} color="#2E7D32" />
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScroll}
            >
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id || category._id}
                  style={styles.categoryPill}
                  onPress={() =>
                    navigation.navigate('Category', { category: category.name })
                  }
                >
                  <View style={styles.categoryIconCircle}>
                    <Text style={styles.categoryEmoji}>
                      {getCategoryIcon(category.name)}
                    </Text>
                  </View>
                  <Text style={styles.categoryPillName} numberOfLines={1}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── FEATURED / TOP VENDORS style ── */}
        {featuredProducts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Products</Text>
              <TouchableOpacity
                style={styles.seeAllRow}
                onPress={() => navigation.navigate('Products', { category: 'featured' })}
              >
                <Text style={styles.seeAllText}>See All</Text>
                <Ionicons name="chevron-forward" size={14} color="#2E7D32" />
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredScroll}
            >
              {featuredProducts.map(renderFeaturedCard)}
            </ScrollView>
          </View>
        )}

        {/* ── POPULAR DEALS (2-column grid) ── */}
        {bestSellers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Popular Deals</Text>
              <TouchableOpacity
                style={styles.seeAllRow}
                onPress={() => navigation.navigate('Products', { sortBy: 'stock-desc' })}
              >
                <Text style={styles.seeAllText}>See All</Text>
                <Ionicons name="chevron-forward" size={14} color="#2E7D32" />
              </TouchableOpacity>
            </View>
            <View style={styles.dealsGrid}>
              {bestSellers.map(renderDealCard)}
            </View>
          </View>
        )}

        {/* ── NEW ARRIVALS horizontal ── */}
        {newArrivals.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>New Arrivals</Text>
              <TouchableOpacity
                style={styles.seeAllRow}
                onPress={() => navigation.navigate('Products', { sortBy: 'newest' })}
              >
                <Text style={styles.seeAllText}>See All</Text>
                <Ionicons name="chevron-forward" size={14} color="#2E7D32" />
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredScroll}
            >
              {newArrivals.map(renderFeaturedCard)}
            </ScrollView>
          </View>
        )}

        {/* ── FREE DELIVERY OFFER BANNER ── */}
        <View style={styles.offerBannerSection}>
          <TouchableOpacity
            style={styles.offerBanner}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Products')}
          >
            <View style={styles.offerBannerLeft}>
              <View style={styles.offerTag}>
                <Ionicons name="flash" size={12} color="#fff" />
                <Text style={styles.offerTagText}>SPECIAL OFFER</Text>
              </View>
              <Text style={styles.offerBannerTitle}>Free Delivery</Text>
              <Text style={styles.offerBannerSub}>On orders over GH₵ 200</Text>
              <View style={styles.offerBannerBtn}>
                <Text style={styles.offerBannerBtnText}>Shop Now</Text>
                <Ionicons name="arrow-forward" size={14} color="#2E7D32" />
              </View>
            </View>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1601600571002-6e1e0c6e3d6f?w=800',
              }}
              style={styles.offerBannerImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
    marginTop: 16,
    fontSize: 16,
    color: '#616161',
    fontWeight: '500',
  },

  // ── HEADER ──
  header: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderTopLeftRadius:12,
    borderTopRightRadius:12,
    marginHorizontal:2,
    zIndex: 100,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 4,
  },
  headerIconBtn: {
    padding: 6,
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#D32F2F',
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#2E7D32',
  },
  notifBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
    paddingHorizontal: 3,
  },

  // ── SEARCH ──
  searchWrapper: {
    position: 'relative',
    zIndex: 200,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#212121',
    padding: 0,
  },
  filterBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 6,
    marginLeft: 4,
  },
  
  // New overlay styles
  searchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: -1000, // Extend beyond the screen
    backgroundColor: 'transparent',
    zIndex: 998,
  },
  
  searchResultsContainer: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
    maxHeight: 380,
    zIndex: 999,
  },
  
  // New header for search results
  searchResultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchResultsHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
  },
  closeResultsBtn: {
    padding: 4,
  },
  
  searchResultsList: {
    padding: 8,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
  },
  searchResultImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 12,
  },
  searchResultInfo: { flex: 1 },
  searchResultName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 2,
  },
  searchResultPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E7D32',
  },
  viewAllResults: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 6,
  },
  viewAllResultsText: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '600',
  },
  noResults: {
    alignItems: 'center',
    padding: 28,
  },
  noResultsText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#424242',
    marginTop: 10,
  },
  noResultsSubtext: {
    fontSize: 13,
    color: '#757575',
    marginTop: 4,
  },
  
  // New "Try Again" button
  tryAgainButton: {
    marginTop: 20,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 25,
  },
  tryAgainButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // ── SCROLL & SECTIONS ──
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 10,
    paddingTop: 18,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1B5E20',
  },
  seeAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '600',
  },

  // ── HERO BANNER ──
  heroBanner: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 18,
    overflow: 'hidden',
    height: 160,
    backgroundColor: '#C8E6C9',
  },
  heroBannerImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroBannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.32)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  heroBannerContent: {},
  heroBannerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 28,
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  heroBannerBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E7D32',
  },

  // ── CATEGORIES ──
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  categoryPill: {
    alignItems: 'center',
    width: 74,
  },
  categoryIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#F1F8E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },
  categoryEmoji: {
    fontSize: 26,
  },
  categoryPillName: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#424242',
    textAlign: 'center',
  },

  // ── FEATURED CARDS ──
  featuredScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  featuredCard: {
    width: 160,
    height: 190,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E8F5E9',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.42)',
    padding: 12,
  },
  featuredName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
  featuredBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuredPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#A5D6A7',
  },
  featuredAddBtn: {
    backgroundColor: '#4CAF50',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredAddBtnActive: {
    backgroundColor: '#2E7D32',
  },

  // ── DEALS GRID ──
  dealsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 10,
  },
  dealCard: {
    width: (width - 34) / 2,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  dealImage: {
    width: '100%',
    height: 130,
  },
  dealInfo: {
    padding: 10,
  },
  dealName: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 2,
    lineHeight: 18,
  },
  dealUnit: {
    fontSize: 11,
    color: '#9E9E9E',
    marginBottom: 8,
  },
  dealFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dealPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1B5E20',
  },
  dealAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  dealAddButtonActive: {
    backgroundColor: '#2E7D32',
  },
  dealAddButtonLoading: {
    backgroundColor: '#81C784',
  },
  dealAddButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },

  // ── OFFER BANNER ──
  offerBannerSection: {
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
  },
  offerBanner: {
    backgroundColor: '#2E7D32',
    borderRadius: 18,
    flexDirection: 'row',
    overflow: 'hidden',
    minHeight: 150,
  },
  offerBannerLeft: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  offerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
    gap: 4,
  },
  offerTagText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  offerBannerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  offerBannerSub: {
    fontSize: 13,
    color: '#C8E6C9',
    marginBottom: 16,
  },
  offerBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  offerBannerBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E7D32',
  },
  offerBannerImage: {
    width: '40%',
    opacity: 0.25,
  },

  // ── MODAL ──
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
    padding: 30,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  successIcon: { marginBottom: 20 },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1B5E20',
    marginBottom: 10,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
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
    color: '#fff',
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

  bottomSpacer: { height: 80 },
});

export default HomeScreen;