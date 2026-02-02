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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import ProductCard from '../components/ProductCard';
import productService from '../services/productService';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

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
  const [addingProductId, setAddingProductId] = useState(null); // Track which product is being added
  const [showCartSuccessModal, setShowCartSuccessModal] = useState(false);
  const [addedProductName, setAddedProductName] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      setLoading(true);

      const categoriesResponse = await productService.getCategories();
      if (categoriesResponse.success) {
        setCategories(categoriesResponse.data.slice(1, 7));
      }

      const params = { limit: 6, page: 1 };

      const [featuredRes, newRes, bestRes] = await Promise.all([
        productService.getProducts({ ...params, sortBy: 'popular' }),
        productService.getProducts({ ...params, sortBy: 'newest' }),
        productService.getProducts({ ...params, sortBy: 'stock-desc' }),
      ]);

      if (featuredRes.success) setFeaturedProducts(featuredRes.data);
      if (newRes.success) setNewArrivals(newRes.data);
      if (bestRes.success) setBestSellers(bestRes.data);
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
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
          'Please login to add items to cart for syncing across devices.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Login', onPress: () => navigation.navigate('Login') },
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

  const quickActions = [
    { id: '1', title: 'Shop All', icon: 'basket-outline', screen: 'Products', color: '#4CAF50' },
    { id: '2', title: 'Vegetables', icon: 'leaf-outline', screen: 'Products', params: { category: 'vegetables' }, color: '#2E7D32' },
    { id: '3', title: 'Fruits', icon: 'nutrition-outline', screen: 'Products', params: { category: 'fruits' }, color: '#F57C00' },
    { id: '4', title: 'Staples', icon: 'beaker-outline', screen: 'Products', params: { category: 'staples' }, color: '#5D4037' },
  ];

  const renderProductCard = (product, isSmall = false) => {
    const quantityInCart = getQuantityInCart(product.id || product._id);
    const isInCart = quantityInCart > 0;
    const isAdding = addingProductId === (product.id || product._id);

    return (
      <TouchableOpacity
        style={[styles.productCard, isSmall && styles.smallProductCard]}
        onPress={() =>
          navigation.navigate('ProductDetail', {
            productId: product.id || product._id,
            product,
          })
        }
        activeOpacity={0.8}
        disabled={isAdding}
      >
        <Image
          source={{ uri: product.image || product.images?.[0] || 'https://via.placeholder.com/150' }}
          style={[styles.productImage, isSmall && styles.smallProductImage]}
          resizeMode="cover"
        />
        <View style={styles.productInfo}>
          <Text style={[styles.productName, isSmall && styles.smallProductName]} numberOfLines={1}>
            {product.name}
          </Text>
          <Text style={[styles.productUnit, isSmall && styles.smallProductUnit]}>
            {product.unit || 'piece'}
          </Text>
          <View style={styles.productFooter}>
            <Text style={[styles.productPrice, isSmall && styles.smallProductPrice]}>
              GH₵ {product.price?.toFixed(2) || product.price}
            </Text>
            <TouchableOpacity
              style={[
                styles.addButton, 
                isInCart && styles.inCartButton,
                isAdding && styles.addingButton
              ]}
              onPress={() => handleAddToCart(product)}
              disabled={isAdding}
            >
              {isAdding ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : isInCart ? (
                <Ionicons name="checkmark" size={18} color="#fff" />
              ) : (
                <Ionicons name="cart-outline" size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSection = (title, products, onSeeAll, isHorizontal = true) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {onSeeAll && (
          <TouchableOpacity onPress={onSeeAll}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        )}
      </View>

      {isHorizontal ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScrollContent}>
          {products.map((product) => (
            <View key={product.id || product._id} style={styles.productCardWrapper}>
              {renderProductCard(product, true)}
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.productsGrid}>
          {products.map((product) => (
            <View key={product.id || product._id} style={styles.productGridItem}>
              {renderProductCard(product)}
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderCategoryCard = (category) => (
    <TouchableOpacity
      key={category.id || category._id}
      style={styles.categoryCard}
      onPress={() => navigation.navigate('Category', { category: category.name })}
    >
      <View style={[styles.categoryIcon, { backgroundColor: getCategoryColor(category.name?.toLowerCase() || '') }]}>
        <Ionicons name={getCategoryIcon(category.name?.toLowerCase() || '')} size={28} color="#fff" />
      </View>
      <Text style={styles.categoryName} numberOfLines={1}>
        {category.name}
      </Text>
    </TouchableOpacity>
  );

  const getCategoryIcon = (name) => {
    const icons = {
      vegetables: 'leaf-outline',
      fruits: 'nutrition-outline',
      staples: 'beaker-outline',
      herb: 'leaf-outline',
      tuber: 'nutrition-outline',
      other: 'grid-outline',
    };
    return icons[name] || 'cube-outline';
  };

  const getCategoryColor = (name) => {
    const colors = {
      vegetables: '#2E7D32',
      fruits: '#F57C00',
      staples: '#5D4037',
      herb: '#388E3C',
      tuber: '#E64A19',
      other: '#455A64',
    };
    return colors[name] || '#6D4C41';
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
        title="FreshyFood"
        rightComponent={
          <TouchableOpacity style={styles.cartButton} onPress={() => navigation.navigate('Notification')}>
            <Ionicons name={unreadCount > 0 ? 'notifications' : 'notifications-outline'} size={26} color="#2E7D32" />
            {unreadCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        }
      />

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2E7D32" />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <HeroSection navigation={navigation} />

        <View style={styles.welcomeSection}>
          <Text style={styles.greeting}>
            {getGreeting()}, {user?.firstName || 'Customer'} 👋
          </Text>
          <Text style={styles.subtitle}>Discover farm-fresh produce delivered fast</Text>
        </View>

        <TouchableOpacity style={styles.searchBar} onPress={() => navigation.navigate('Products')}>
          <Ionicons name="search-outline" size={20} color="#757575" />
          <Text style={styles.searchPlaceholder}>Search vegetables, fruits...</Text>
        </TouchableOpacity>

        {/* Quick Actions Section (Commented out) */}
        {/* <View style={styles.quickActionsSection}>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickActionCard}
                onPress={() => navigation.navigate(action.screen, action.params)}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}>
                  <Ionicons name={action.icon} size={26} color="#fff" />
                </View>
                <Text style={styles.quickActionText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View> */}

        {categories.length > 0 && (
          <View style={styles.categoriesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Products')}>
                <Text style={styles.seeAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.categoriesGrid}>{categories.map(renderCategoryCard)}</View>
          </View>
        )}

        {featuredProducts.length > 0 &&
          renderSection('Featured Products', featuredProducts, () => navigation.navigate('Products', { category: 'featured' }))}

        {newArrivals.length > 0 &&
          renderSection('New Arrivals', newArrivals, () => navigation.navigate('Products', { sortBy: 'newest' }))}

        {bestSellers.length > 0 &&
          renderSection('Best Sellers', bestSellers, () => navigation.navigate('Products', { sortBy: 'stock-desc' }))}

        <View style={styles.offersSection}>
          <View style={styles.offerCard}>
            <View style={styles.offerGradient} />
            <View style={styles.offerContent}>
              <View style={styles.offerBadge}>
                <Ionicons name="flash" size={14} color="#fff" />
                <Text style={styles.offerBadgeText}>SPECIAL OFFER</Text>
              </View>
              <Text style={styles.offerTitle}>Free Delivery</Text>
              <Text style={styles.offerSubtitle}>On orders over GH₵ 200</Text>
              <TouchableOpacity style={styles.offerButton} onPress={() => navigation.navigate('Products')}>
                <Text style={styles.offerButtonText}>Shop Now</Text>
                <Ionicons name="arrow-forward" size={16} color="#2E7D32" />
              </TouchableOpacity>
            </View>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1601600571002-6e1e0c6e3d6f?w=800' }}
              style={styles.offerImage}
              resizeMode="cover"
            />
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#616161',
    fontWeight: '500',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  welcomeSection: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#fff',
  },
  greeting: {
    fontSize: 27,
    fontWeight: '700',
    color: '#1B5E20',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15.5,
    color: '#616161',
    marginTop: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  searchPlaceholder: {
    marginLeft: 12,
    fontSize: 15,
    color: '#757575',
    flex: 1,
  },
  quickActionsSection: {
    backgroundColor: '#fff',
    marginTop: 16,
    paddingVertical: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  quickActionCard: {
    alignItems: 'center',
    width: width / 4 - 20,
  },
  quickActionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  quickActionText: {
    fontSize: 12,
    color: '#424242',
    fontWeight: '600',
    textAlign: 'center',
  },
  categoriesSection: {
    backgroundColor: '#fff',
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '31%',
    alignItems: 'center',
    marginBottom: 20,
  },
  categoryIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryName: {
    fontSize: 13,
    color: '#424242',
    fontWeight: '500',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: '#1B5E20',
    letterSpacing: -0.2,
  },
  seeAllText: {
    color: '#2E7D32',
    fontWeight: '600',
    fontSize: 14.5,
  },
  horizontalScrollContent: {
    paddingLeft: 20,
    paddingRight: 8,
  },
  productCardWrapper: {
    marginRight: 14,
    width: 150,
  },
  productCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  smallProductCard: {
    width: 150,
  },
  productImage: {
    width: '100%',
    height: 140,
  },
  smallProductImage: {
    height: 110,
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
  },
  smallProductName: {
    fontSize: 13.5,
  },
  productUnit: {
    fontSize: 12.5,
    color: '#757575',
    marginTop: 2,
    marginBottom: 8,
  },
  smallProductUnit: {
    fontSize: 11.5,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 16.5,
    fontWeight: '700',
    color: '#2E7D32',
  },
  smallProductPrice: {
    fontSize: 15,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  inCartButton: {
    backgroundColor: '#2E7D32',
  },
  addingButton: {
    backgroundColor: '#81C784',
  },
  offersSection: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 16,
  },
  offerCard: {
    borderRadius: 20,
    overflow: 'hidden',
    minHeight: 180,
    position: 'relative',
  },
  offerGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(76, 175, 80, 0.92)',
  },
  offerContent: {
    padding: 24,
    zIndex: 2,
  },
  offerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  offerBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 6,
  },
  offerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  offerSubtitle: {
    fontSize: 16,
    color: '#F1F8E9',
    marginBottom: 20,
  },
  offerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  offerButtonText: {
    color: '#2E7D32',
    fontWeight: '700',
    fontSize: 15,
    marginRight: 8,
  },
  offerImage: {
    position: 'absolute',
    right: -20,
    top: 0,
    bottom: 0,
    width: '60%',
    opacity: 0.18,
  },
  cartButton: {
    padding: 8,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#D32F2F',
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    paddingHorizontal: 5,
  },
  bottomSpacer: {
    height: 80,
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
});

export default HomeScreen;