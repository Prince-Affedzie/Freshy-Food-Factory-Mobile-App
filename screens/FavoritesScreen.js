// src/screens/main/FavoritesScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { removeFromFavorites } from '../apis/userActionsApi';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const ITEM_MARGIN = 8;
const ITEM_WIDTH = (width - (ITEM_MARGIN * (COLUMN_COUNT + 1))) / COLUMN_COUNT;

const FavoritesScreen = ({ navigation }) => {
  const { favoriteItems, loading, refreshCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [removingItems, setRemovingItems] = useState({});

  // Process favorite items to handle both structures
  const processFavoriteItems = (items) => {
    if (!items || !Array.isArray(items)) return [];
    
    return items.map(item => {
      // If item has a nested product object, use that
      if (item.product && typeof item.product === 'object') {
        return {
          _id: item._id,
          productId: item.product._id,
          name: item.product.name,
          price: item.product.price,
          image: item.product.image,
          unit: item.product.unit,
          category: item.product.category,
          description: item.product.description,
          countInStock: item.product.countInStock,
          slug: item.product.slug,
          isAvailable: item.product.isAvailable,
        };
      }
      
      // If item is just an ID reference (has only _id), return a placeholder
      if (item._id && !item.name) {
        return {
          _id: item._id,
          productId: item._id,
          name: 'Product',
          price: 0,
          image: null,
          unit: 'piece',
          category: 'other',
          description: '',
          countInStock: 0,
          isPlaceholder: true, // Mark as placeholder
        };
      }
      
      // Otherwise return the item as-is (already has product data)
      return {
        ...item,
        productId: item.productId || item._id,
      };
    }).filter(item => item !== null); // Filter out null items
  };

  const processedFavorites = processFavoriteItems(favoriteItems);

  // Load favorites on screen focus
  useEffect(() => {
    if (isAuthenticated) {
      refreshCart();
    }
  }, [isAuthenticated]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshCart();
    setRefreshing(false);
  }, [refreshCart]);

  const handleRemoveFavorite = async (item) => {
    const productId = item.productId || item._id;
    
    Alert.alert(
      'Remove from Favorites',
      `Are you sure you want to remove "${item.name}" from your favorites?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setRemovingItems(prev => ({ ...prev, [productId]: true }));
              
              const response = await removeFromFavorites(productId);
              
              if (response.success) {
                // Refresh the favorites list
                await refreshCart();
                
                Alert.alert(
                  'Removed',
                  `${item.name} has been removed from favorites`,
                  [{ text: 'OK' }]
                );
              } else {
                Alert.alert('Error', response.message || 'Failed to remove from favorites');
              }
            } catch (error) {
              console.error('Error removing favorite:', error);
              Alert.alert('Error', 'Failed to remove from favorites. Please try again.');
            } finally {
              setRemovingItems(prev => ({ ...prev, [productId]: false }));
            }
          }
        }
      ]
    );
  };

  const handleProductPress = (item) => {
    // Don't navigate if it's a placeholder
    if (item.isPlaceholder) {
      Alert.alert(
        'Product Information Missing',
        'This product information is not fully loaded. Please try again later.'
      );
      return;
    }
    
    navigation.navigate('ProductDetail', {
      productId: item.productId,
      product: {
        _id: item.productId,
        id: item.productId,
        name: item.name,
        price: item.price,
        image: item.image,
        unit: item.unit,
        category: item.category,
        description: item.description,
        countInStock: item.countInStock,
        slug: item.slug,
        isAvailable: item.isAvailable,
      }
    });
  };

  const renderProductItem = ({ item }) => {
    const productId = item.productId || item._id;
    const isRemoving = removingItems[productId];
    const isInStock = item.countInStock > 0;
    const isPlaceholder = item.isPlaceholder;
    
    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => handleProductPress(item)}
        activeOpacity={isPlaceholder ? 1 : 0.7}
        disabled={isPlaceholder}
      >
        {/* Product Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ 
              uri: item.image && !isPlaceholder 
                ? item.image 
                : 'https://via.placeholder.com/150?text=Product'
            }}
            style={styles.productImage}
            resizeMode="cover"
          />
          
          {/* Remove Favorite Button */}
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveFavorite(item)}
            disabled={isRemoving || isPlaceholder}
          >
            {isRemoving ? (
              <ActivityIndicator size="small" color="#FF3B30" />
            ) : (
              <Ionicons name="heart" size={20} color={isPlaceholder ? "#CCC" : "#FF3B30"} />
            )}
          </TouchableOpacity>

          {/* Placeholder Badge */}
          {isPlaceholder && (
            <View style={styles.placeholderBadge}>
              <Text style={styles.placeholderText}>Loading...</Text>
            </View>
          )}

          {/* Stock Status Badge */}
          {!isPlaceholder && !isInStock && (
            <View style={styles.outOfStockBadge}>
              <Text style={styles.outOfStockText}>Out of Stock</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text 
            style={[
              styles.productName, 
              isPlaceholder && styles.placeholderTextStyle
            ]} 
            numberOfLines={2}
          >
            {isPlaceholder ? 'Loading product...' : item.name}
          </Text>
          
          {!isPlaceholder && (
            <>
              <Text style={styles.productCategory}>
                {getCategoryName(item.category)}
              </Text>
              
              <View style={styles.priceContainer}>
                <Text style={styles.productPrice}>
                  GH₵ {typeof item.price === 'number' ? item.price.toFixed(2) : '0.00'}
                </Text>
                <Text style={styles.productUnit}>
                  /{item.unit || 'piece'}
                </Text>
              </View>

              {/* Stock Status */}
              <View style={styles.stockContainer}>
                <Ionicons 
                  name={isInStock ? "checkmark-circle" : "close-circle"} 
                  size={14} 
                  color={isInStock ? "#4CAF50" : "#F44336"} 
                />
                <Text style={[
                  styles.stockText,
                  isInStock ? styles.inStock : styles.outOfStock
                ]}>
                  {isInStock ? 'In Stock' : 'Out of Stock'}
                </Text>
              </View>
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    if (!isAuthenticated) {
      return (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="heart-outline" size={80} color="#E0E0E0" />
          <Text style={styles.emptyStateTitle}>Login to View Favorites</Text>
          <Text style={styles.emptyStateText}>
            Please login to see and manage your favorite products
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (loading) {
      return null; // Loading indicator is handled separately
    }

    return (
      <View style={styles.emptyStateContainer}>
        <Ionicons name="heart-outline" size={80} color="#E0E0E0" />
        <Text style={styles.emptyStateTitle}>No Favorites Yet</Text>
        <Text style={styles.emptyStateText}>
          Tap the heart icon on any product to add it to your favorites
        </Text>
        <TouchableOpacity
          style={styles.browseButton}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Products' })}
        >
          <Text style={styles.browseButtonText}>Browse Products</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="My Favorites"
          showBack
          onBackPress={() => navigation.goBack()}
        />
        {renderEmptyState()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="My Favorites"
        showBack
        onBackPress={() => navigation.goBack()}
        rightComponent={
          processedFavorites.length > 0 && (
            <TouchableOpacity 
              style={styles.headerAction}
              onPress={() => {
                const validItems = processedFavorites.filter(item => !item.isPlaceholder);
                if (validItems.length === 0) {
                  Alert.alert('No Items', 'There are no valid items to clear.');
                  return;
                }
                
                Alert.alert(
                  'Clear All Favorites',
                  `Are you sure you want to remove ${validItems.length} items from your favorites?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Clear All',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          // Clear all favorites - you'll need to implement this API
                          Alert.alert('Info', 'Clear all functionality requires backend implementation');
                        } catch (error) {
                          Alert.alert('Error', 'Failed to clear favorites');
                        }
                      }
                    }
                  ]
                );
              }}
            >
              <Ionicons name="trash-outline" size={22} color="#666" />
            </TouchableOpacity>
          )
        }
      />

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading your favorites...</Text>
        </View>
      ) : (
        <FlatList
          data={processedFavorites}
          renderItem={renderProductItem}
          keyExtractor={(item) => (item.productId || item._id).toString()}
          numColumns={COLUMN_COUNT}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={[
            styles.listContent,
            processedFavorites.length === 0 && styles.emptyListContent
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4CAF50']}
              tintColor="#4CAF50"
            />
          }
          ListEmptyComponent={renderEmptyState}
          ListHeaderComponent={
            processedFavorites.length > 0 ? (
              <View style={styles.statsContainer}>
                <Text style={styles.statsText}>
                  {processedFavorites.filter(item => !item.isPlaceholder).length} 
                  {' '}{processedFavorites.filter(item => !item.isPlaceholder).length === 1 ? 'item' : 'items'} in favorites
                  {processedFavorites.some(item => item.isPlaceholder) && 
                    ` (${processedFavorites.filter(item => item.isPlaceholder).length} loading...)`}
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
};

// Helper function to get category display name
const getCategoryName = (category) => {
  const nameMap = {
    'vegetable': 'Vegetable',
    'fruit': 'Fruit',
    'staple': 'Staple',
    'herb': 'Herb',
    'tuber': 'Tuber',
    'other': 'Other',
  };
  return nameMap[category] || category || 'Product';
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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  listContent: {
    padding: ITEM_MARGIN,
    paddingBottom: 100,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  columnWrapper: {
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
    height: ITEM_WIDTH,
    backgroundColor: '#F5F5F5',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  placeholderBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  placeholderTextStyle: {
    color: '#999',
    fontStyle: 'italic',
  },
  outOfStockBadge: {
    position: 'absolute',
    bottom: 8,
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
  productCategory: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2E7D32',
    marginRight: 4,
  },
  productUnit: {
    fontSize: 12,
    color: '#666',
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  inStock: {
    color: '#4CAF50',
  },
  outOfStock: {
    color: '#F44336',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1B5E20',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  loginButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  browseButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    paddingHorizontal: ITEM_MARGIN,
    paddingVertical: 12,
    marginBottom: 8,
  },
  statsText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    lineHeight: 20,
  },
  headerAction: {
    padding: 8,
  },
});

export default FavoritesScreen;