import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  Animated,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CartScreen = () => {
  const navigation = useNavigation();
  const { bottom } = useSafeAreaInsets();
  const { 
    cartItems, 
    cartTotal, 
    cartCount, 
    updateQuantity, 
    removeFromCart,
    clearCart,
    loading: cartContextLoading,
    refreshCart
  } = useCart();
  const { isAuthenticated, user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [removingItemId, setRemovingItemId] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [screenLoading, setScreenLoading] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));

  // Calculate tab bar height based on your Tab.Navigator settings
  const tabBarHeight = bottom - 90;

  useFocusEffect(
    useCallback(() => {
      // Show loading when screen is focused
      setScreenLoading(true);
      
      // Load cart data
      const loadData = async () => {
        try {
          await refreshCart();
        } catch (error) {
          console.error('Error loading cart:', error);
        } finally {
          // Animate in content
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }).start();
          setScreenLoading(false);
        }
      };

      loadData();

      return () => {
        // Reset animation when leaving screen
        fadeAnim.setValue(0);
      };
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshCart();
    setRefreshing(false);
  };

  const handleUpdateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setUpdatingItemId(productId);
    try {
      await updateQuantity(productId, newQuantity);
      // Refresh cart to get updated totals
      await refreshCart();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update quantity');
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemoveItem = async (productId, productName) => {
    Alert.alert(
      'Remove Item',
      `Remove ${productName} from cart?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            setRemovingItemId(productId);
            try {
              await removeFromCart(productId);
              await refreshCart();
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to remove item');
            } finally {
              setRemovingItemId(null);
            }
          }
        }
      ]
    );
  };

  const handleClearCart = () => {
    if (cartItems.length === 0) return;
    
    Alert.alert(
      'Clear Cart',
      'Remove all items from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: async () => {
            try {
              setScreenLoading(true);
              await clearCart();
              await refreshCart();
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to clear cart');
            } finally {
              setScreenLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty. Add some items first!');
      return;
    }

    if (!isAuthenticated) {
      Alert.alert(
        'Login Required',
        'Please login to proceed with checkout.',
        [
          { text: 'Continue Shopping', style: 'cancel' },
          { text: 'Login', onPress: () => navigation.navigate('Login') }
        ]
      );
      return;
    }

    // Show checkout loading
    setCheckoutLoading(true);
    
    // Simulate loading for better UX
    setTimeout(() => {
      setCheckoutLoading(false);
      navigation.navigate('Order');
    }, 800);
  };

  // Helper function to safely extract product data
  const getProductData = (item) => {
    const product = item.product || item;
    
    return {
      id: product._id || product.id || item.productId || item.id,
      name: product.name || item.name || 'Unnamed Product',
      price: product.price || item.price || 0,
      image: product.image || 
             product.images?.[0] || 
             item.image || 
             'https://via.placeholder.com/100',
      unit: product.unit || item.unit || 'piece',
      stock: product.countInStock || product.stock || 100,
      quantity: item.quantity || 1
    };
  };

  const calculateItemTotal = (item) => {
    const productData = getProductData(item);
    return (productData.quantity * productData.price);
  };

  const renderCartItem = (item, index) => {
    const productData = getProductData(item);
    
    const isLoading = updatingItemId === productData.id;
    const isRemoving = removingItemId === productData.id;

    return (
      <Animated.View 
        key={`${productData.id}-${index}`} 
        style={[
          styles.cartItem,
          { opacity: fadeAnim }
        ]}
      >
        {/* Product Image */}
        <TouchableOpacity 
          style={styles.itemImageContainer}
          onPress={() => navigation.navigate('ProductDetail', { 
            productId: productData.id,
            product: item.product || item
          })}
        >
          <Image
            source={{ uri: productData.image }}
            style={styles.itemImage}
            resizeMode="cover"
          />
        </TouchableOpacity>

        {/* Product Info */}
        <View style={styles.itemInfo}>
          <TouchableOpacity 
            style={styles.itemNameContainer}
            onPress={() => navigation.navigate('ProductDetail', { 
              productId: productData.id,
              product: item.product || item
            })}
          >
            <Text style={styles.itemName} numberOfLines={2}>
              {productData.name}
            </Text>
          </TouchableOpacity>
          
          <View style={styles.itemDetails}>
            <Text style={styles.itemPrice}>
              GH₵ {productData.price.toFixed(2)} / {productData.unit}
            </Text>
            <Text style={styles.itemTotal}>
              Total: GH₵ {calculateItemTotal(item).toFixed(2)}
            </Text>
          </View>

          {/* Quantity Controls */}
          <View style={styles.itemActions}>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={[styles.quantityButton, productData.quantity <= 1 && styles.quantityButtonDisabled]}
                onPress={() => handleUpdateQuantity(productData.id, productData.quantity - 1)}
                disabled={productData.quantity <= 1 || isLoading || screenLoading}
              >
                <Ionicons 
                  name="remove" 
                  size={18} 
                  color={productData.quantity <= 1 ? "#CCCCCC" : "#2E7D32"} 
                />
              </TouchableOpacity>
              
              <View style={styles.quantityDisplay}>
                {isLoading ? (
                  <ActivityIndicator size="small" color="#4CAF50" />
                ) : (
                  <Text style={styles.quantityText}>{productData.quantity}</Text>
                )}
              </View>
              
              <TouchableOpacity
                style={[styles.quantityButton, productData.quantity >= productData.stock && styles.quantityButtonDisabled]}
                onPress={() => handleUpdateQuantity(productData.id, productData.quantity + 1)}
                disabled={productData.quantity >= productData.stock || isLoading || screenLoading}
              >
                <Ionicons 
                  name="add" 
                  size={18} 
                  color={productData.quantity >= productData.stock ? "#CCCCCC" : "#2E7D32"} 
                />
              </TouchableOpacity>
            </View>

            {/* Remove Button */}
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveItem(productData.id, productData.name)}
              disabled={isRemoving || screenLoading}
            >
              {isRemoving ? (
                <ActivityIndicator size="small" color="#F44336" />
              ) : (
                <Ionicons name="trash-outline" size={18} color="#F44336" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderEmptyCart = () => (
    <Animated.View 
      style={[
        styles.emptyContainer,
        { opacity: fadeAnim }
      ]}
    >
      <View style={styles.emptyIcon}>
        <Ionicons name="cart-outline" size={80} color="#E0E0E0" />
      </View>
      <Text style={styles.emptyTitle}>Your cart is empty</Text>
      <Text style={styles.emptyText}>
        Looks like you haven't added any fresh products to your cart yet.
      </Text>
      <TouchableOpacity
        style={styles.shopButton}
        onPress={() => navigation.navigate('MainTabs', { screen: 'Products' })}
      >
        <Ionicons name="basket-outline" size={20} color="#FFFFFF" />
        <Text style={styles.shopButtonText}>Browse Products</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderCheckoutSummary = () => (
    <Animated.View 
      style={[
        styles.checkoutContainer, 
        { marginBottom: tabBarHeight },
        { opacity: fadeAnim }
      ]}
    >
      {/* Order Summary */}
      <View style={styles.summarySection}>
        <Text style={styles.summaryTitle}>Order Summary</Text>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Items ({cartCount})</Text>
          <Text style={styles.summaryValue}>GH₵ {cartTotal.toFixed(2)}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Delivery Fee</Text>
          <Text style={styles.summaryValue}>
            {cartTotal >= 200 ? 'Free' : 'GH₵ 40.00'}
          </Text>
        </View>
        
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalValue}>
            GH₵ {(cartTotal + (cartTotal >= 200 ? 0 : 40)).toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Checkout Button */}
      <TouchableOpacity
        style={[
          styles.checkoutButton, 
          checkoutLoading && styles.checkoutButtonDisabled,
          cartItems.length === 0 && styles.checkoutButtonDisabled
        ]}
        onPress={handleCheckout}
        disabled={checkoutLoading || cartItems.length === 0}
      >
        {checkoutLoading ? (
          <View style={styles.checkoutButtonContent}>
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text style={styles.checkoutButtonText}>Processing...</Text>
          </View>
        ) : (
          <>
            <Ionicons name="arrow-forward-circle" size={24} color="#FFFFFF" />
            <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );

  // Main Loading Overlay
  if (screenLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Cart"
          showBack
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Loading your cart...</Text>
            <Text style={styles.loadingSubtext}>
              Fetching your items and latest prices
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Cart"
        showBack
        onBackPress={() => navigation.goBack()}
        rightComponent={
          cartItems.length > 0 && (
            <TouchableOpacity 
              onPress={handleClearCart}
              disabled={screenLoading}
            >
              <Text style={[
                styles.headerClearText,
                screenLoading && styles.disabledText
              ]}>
                Clear
              </Text>
            </TouchableOpacity>
          )
        }
      />

      {/* Full Screen Loading Modal for actions */}
      <Modal
        transparent={true}
        visible={checkoutLoading}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.modalText}>Preparing your order...</Text>
            <Text style={styles.modalSubtext}>
              Please wait while we process your checkout
            </Text>
          </View>
        </View>
      </Modal>

      {cartItems.length === 0 ? (
        renderEmptyCart()
      ) : (
        <View style={styles.mainContainer}>
          {/* Main scrollable content */}
          <ScrollView 
            style={styles.scrollContainer}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh}
                colors={['#4CAF50']}
                tintColor="#4CAF50"
              />
            }
            contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarHeight + 220 }]}
            showsVerticalScrollIndicator={false}
          >
            {/* Cart Items List */}
            {cartItems.map((item, index) => renderCartItem(item, index))}
            
            {/* Delivery Info */}
            {cartItems.length > 0 && (
              <Animated.View 
                style={[
                  styles.deliveryInfo,
                  { opacity: fadeAnim }
                ]}
              >
                <View style={styles.deliveryHeader}>
                  <Ionicons name="time-outline" size={20} color="#4CAF50" />
                  <Text style={styles.deliveryTitle}>Delivery Information</Text>
                </View>
                <Text style={styles.deliveryText}>
                  • Free delivery on orders over GH₵ 200
                </Text>
                <Text style={styles.deliveryText}>
                  • Next-day delivery available
                </Text>
                <Text style={styles.deliveryText}>
                  • Flexible delivery scheduling
                </Text>
              </Animated.View>
            )}
          </ScrollView>
          
          {/* Fixed checkout summary at bottom */}
          {renderCheckoutSummary()}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  mainContainer: {
    flex: 1,
    position: 'relative',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingContent: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: '600',
    color: '#1B5E20',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    maxWidth: 250,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '80%',
    maxWidth: 300,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  modalText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: '600',
    color: '#1B5E20',
    textAlign: 'center',
  },
  modalSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  headerClearText: {
    color: '#F44336',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledText: {
    color: '#CCCCCC',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1B5E20',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  shopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 10,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  shopButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  itemImageContainer: {
    marginRight: 16,
  },
  itemImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemNameContainer: {
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    lineHeight: 22,
  },
  itemDetails: {
    marginBottom: 12,
  },
  itemPrice: {
    fontSize: 15,
    color: '#2E7D32',
    fontWeight: '600',
    marginBottom: 4,
  },
  itemTotal: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 4,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
  },
  quantityButtonDisabled: {
    backgroundColor: '#F8F9FA',
    opacity: 0.5,
  },
  quantityDisplay: {
    minWidth: 44,
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  removeButton: {
    padding: 8,
  },
  deliveryInfo: {
    backgroundColor: '#F0F7F0',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#C8E6C9',
  },
  deliveryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  deliveryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B5E20',
    marginLeft: 10,
  },
  deliveryText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    lineHeight: 20,
  },
  checkoutContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopWidth: 1.5,
    borderTopColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  summarySection: {
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1B5E20',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
  },
  totalRow: {
    paddingTop: 16,
    borderTopWidth: 1.5,
    borderTopColor: '#E8E8E8',
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#212121',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  checkoutButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 12,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  checkoutButtonDisabled: {
    backgroundColor: '#A5D6A7',
    shadowOpacity: 0.1,
  },
  checkoutButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 10,
  },
  continueButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default CartScreen;