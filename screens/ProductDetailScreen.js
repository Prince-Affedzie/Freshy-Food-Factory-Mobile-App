// src/screens/main/ProductDetailScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Share,
  Alert,
  FlatList,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import productService from '../services/productService';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { addToFavorites, removeFromFavorites } from '../apis/userActionsApi';

const { width } = Dimensions.get('window');

const ProductDetailScreen = ({ route, navigation }) => {
  const { productId, product: initialProduct } = route.params;
  const [product, setProduct] = useState(initialProduct || null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(!initialProduct);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [checkingFavorite, setCheckingFavorite] = useState(true);

  const { addToCart, favoriteItems } = useCart();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!initialProduct || !initialProduct.relatedProducts) {
      loadProduct();
    } else {
      setProduct(initialProduct);
      setRelatedProducts(initialProduct.relatedProducts || []);
    }
    checkIfFavorite();
  }, [productId, favoriteItems, initialProduct]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const response = await productService.getProductById(productId);
      if (response.status === 200) {
        const data = response.data.data;
        setProduct(data);
        setRelatedProducts(data.relatedProducts || []);
      } else {
        setError(response.error || 'Failed to load product');
      }
    } catch (err) {
      console.error('Product load error:', err);
      setError('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const checkIfFavorite = () => {
    if (!isAuthenticated || !productId) {
      setIsFavorite(false);
      setCheckingFavorite(false);
      return;
    }

    const found = favoriteItems?.some(
      (item) => item._id === productId || item._id === product?._id || item._id === product?.id
    );
    setIsFavorite(!!found);
    setCheckingFavorite(false);
  };

  const handleFavoriteToggle = async () => {
    if (!product) return;
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please sign in to manage favorites.', [
        { text: 'Cancel' },
        { text: 'Sign In', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }

    setFavoriteLoading(true);
    try {
      const pid = product._id || product.id;
      let success = false;

      if (isFavorite) {
        const res = await removeFromFavorites(pid);
        success = res.status === 200;
      } else {
        const res = await addToFavorites(pid);
        success = res.status === 200;
      }

      if (success) {
        setIsFavorite(!isFavorite);
      } else {
        Alert.alert('Error', 'Could not update favorites');
      }
    } catch (err) {
      Alert.alert('Error', 'Network or server issue');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    const stock = product.countInStock ?? 0;
    if (stock <= 0) {
      Alert.alert('Out of Stock', `${product.name} is currently unavailable.`);
      return;
    }

    if (!isAuthenticated) {
      Alert.alert('Login recommended', 'Sign in to sync your cart?', [
        { text: 'Continue as guest', onPress: () => performAddToCart() },
        { text: 'Sign In', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }

    await performAddToCart();
  };

  const performAddToCart = async () => {
    setAddingToCart(true);
    try {
      await addToCart(product._id || product.id, 1);
      Alert.alert('Success', `${product.name} added to cart`, [
        { text: 'Continue Shopping', style: 'cancel' },
        { text: 'View Cart', onPress: () => navigation.navigate('Cart') },
      ]);
    } catch (err) {
      Alert.alert('Error', 'Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleShare = async () => {
    if (!product) return;
    try {
      await Share.share({
        message: `FreshyFood • ${product.name} – GH₵${product.price}\n${product.description || ''}`,
        url: `https://freshyfood.com/product/${productId}`,
        title: product.name,
      });
    } catch (err) {
      console.log('Share failed', err);
    }
  };

  const handleRelatedProductPress = (item) => {
    navigation.push('ProductDetail', { productId: item._id || item.id, product: null });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Loading product details...</Text>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={64} color="#ef5350" />
        <Text style={styles.errorTitle}>Product not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back to Products</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images = product.images?.length > 0 ? product.images : [product.image || 'https://via.placeholder.com/400'];
  const isInStock = (product.countInStock ?? 0) > 0;
  const discount = product.originalPrice ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Product"
        showBack
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleShare} style={styles.iconBtn}>
              <Ionicons name="share-social-outline" size={22} color="#424242" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleFavoriteToggle} disabled={favoriteLoading || checkingFavorite}>
              {favoriteLoading || checkingFavorite ? (
                <ActivityIndicator size="small" color="#ef5350" />
              ) : (
                <Ionicons
                  name={isFavorite ? 'heart' : 'heart-outline'}
                  size={24}
                  color={isFavorite ? '#ef5350' : '#424242'}
                />
              )}
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.imageHero}>
          <Image source={{ uri: images[selectedImage] }} style={styles.mainPhoto} resizeMode="cover" />
          {discount > 0 && (
            <View style={styles.discountTag}>
              <Text style={styles.discountLabel}>-{discount}%</Text>
            </View>
          )}
          {!isInStock && (
            <View style={styles.stockOverlay}>
              <Text style={styles.stockOverlayText}>Out of Stock</Text>
            </View>
          )}
        </View>

        {/* Thumbnails */}
        {images.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbnailsRow}>
            {images.map((uri, idx) => (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.8}
                onPress={() => setSelectedImage(idx)}
                style={[
                  styles.thumbnailWrapper,
                  selectedImage === idx && styles.thumbnailActive,
                ]}
              >
                <Image source={{ uri }} style={styles.thumbnail} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Main Content */}
        <View style={styles.contentCard}>
          <View style={styles.categoryPill}>
            <Ionicons name={getCategoryIcon(product.category)} size={16} color="#2E7D32" />
            <Text style={styles.categoryLabel}>{getCategoryName(product.category)}</Text>
          </View>

          <Text style={styles.title}>{product.name}</Text>

          <View style={styles.metaRow}>
            <View style={styles.rating}>
              <Ionicons name="star" size={16} color="#ffb300" />
              <Text style={styles.ratingValue}>
                {product.rating?.toFixed(1) || '4.8'} • {product.reviewCount || 142} reviews
              </Text>
            </View>
            
          </View>

          <View style={styles.priceBlock}>
            <Text style={styles.currentPrice}>GH₵ {Number(product.price).toFixed(2)}</Text>
            {product.originalPrice && (
              <Text style={styles.oldPrice}>GH₵ {Number(product.originalPrice).toFixed(2)}</Text>
            )}
            <Text style={styles.unitText}>/{product.unit || 'unit'}</Text>
          </View>

          <View style={[styles.stockRow, !isInStock && styles.stockRowOut]}>
            <Ionicons
              name={isInStock ? 'checkmark-circle' : 'close-circle'}
              size={20}
              color={isInStock ? '#2E7D32' : '#d32f2f'}
            />
            <Text style={[styles.stockLabel, !isInStock && styles.outOfStockLabel]}>
              {isInStock ? `In stock (${product.countInStock} left)` : 'Currently unavailable'}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Description</Text>
            <Text style={styles.description}>{product.description || 'No description provided.'}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Product Details</Text>
            <View style={styles.detailGrid}>
              <DetailRow label="Category" value={getCategoryName(product.category)} />
              <DetailRow label="Unit" value={product.unit || '—'} />
              <DetailRow label="Origin" value={product.origin || 'Local'} />
              <DetailRow label="Storage" value={product.storage || 'Cool & dry'} />
              <DetailRow label="SKU" value={product.sku || '—'} />
            </View>
          </View>

          {relatedProducts.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>You may also like</Text>
              <FlatList
                data={relatedProducts}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item._id || item.id || String(Math.random())}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.relatedCard}
                    onPress={() => handleRelatedProductPress(item)}
                  >
                    <Image source={{ uri: item.image || 'https://via.placeholder.com/140' }} style={styles.relatedImg} />
                    <Text style={styles.relatedName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.relatedPrice}>GH₵ {Number(item.price).toFixed(2)}</Text>
                  </TouchableOpacity>
                )}
                contentContainerStyle={{ paddingHorizontal: 4 }}
              />
            </View>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Floating Action Bar */}
      <View style={styles.floatingBar}>
        <TouchableOpacity
          style={[styles.addCartBtn, (!isInStock || addingToCart) && styles.addCartDisabled]}
          onPress={handleAddToCart}
          disabled={!isInStock || addingToCart}
        >
          {addingToCart ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="cart-outline" size={20} color="#fff" />
              <Text style={styles.addCartLabel}>Add to Cart – GH₵{product.price.toFixed(2)}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// Small helper component for cleaner details
const DetailRow = ({ label, value }) => (
  <View style={styles.detailItem}>
    <Text style={styles.detailKey}>{label}</Text>
    <Text style={styles.detailVal}>{value}</Text>
  </View>
);

const getCategoryIcon = (cat) => {
  const map = {
    vegetable: 'leaf-outline',
    fruit: 'nutrition-outline',
    staple: 'water-outline',
    herb: 'leaf-outline',
    tuber: 'cube-outline',
    other: 'basket-outline',
  };
  return map[cat?.toLowerCase()] || 'basket-outline';
};

const getCategoryName = (cat) => {
  const map = {
    vegetable: 'Vegetables',
    fruit: 'Fruits',
    staple: 'Staples',
    herb: 'Herbs',
    tuber: 'Tubers',
    other: 'Others',
  };
  return map[cat?.toLowerCase()] || cat || 'Category';
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    padding: 40,
  },
  loadingText: { marginTop: 16, fontSize: 16, color: '#616161' },
  errorTitle: { fontSize: 22, fontWeight: '600', color: '#424242', marginTop: 16, marginBottom: 8 },
  backBtn: {
    marginTop: 24,
    backgroundColor: '#2e7d32',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  backBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  headerActions: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { padding: 8, marginLeft: 4 },

  scrollContent: { paddingBottom: 160 },

  imageHero: {
    width,
    height: width * 0.9,
    backgroundColor: '#f5f5f5',
    position: 'relative',
  },
  mainPhoto: { width: '100%', height: '100%' },
  discountTag: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: '#d32f2f',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
  },
  discountLabel: { color: '#fff', fontWeight: '700', fontSize: 15 },
  stockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stockOverlayText: { color: '#fff', fontSize: 24, fontWeight: '700' },

  thumbnailsRow: { paddingVertical: 16, paddingHorizontal: 20 },
  thumbnailWrapper: {
    width: 70,
    height: 70,
    marginRight: 14,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: 'transparent',
  },
  thumbnailActive: { borderColor: '#2e7d32' },
  thumbnail: { width: '100%', height: '100%' },

  contentCard: {
    backgroundColor: '#fff',
    marginTop: -32,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
   // elevation: Platform.OS === 'android' ? 12 : 0,
  },

  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    marginBottom: 16,
  },
  categoryLabel: { color: '#2e7d32', fontWeight: '600', marginLeft: 8, fontSize: 14 },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1b5e20',
    lineHeight: 36,
    marginBottom: 16,
  },

  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  rating: { flexDirection: 'row', alignItems: 'center' },
  ratingValue: { marginLeft: 8, color: '#616161', fontSize: 15 },
  sku: { color: '#757575', fontSize: 14 },

  priceBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  currentPrice: {
    fontSize: 34,
    fontWeight: '800',
    color: '#2e7d32',
  },
  oldPrice: {
    fontSize: 20,
    color: '#9e9e9e',
    textDecorationLine: 'line-through',
    marginLeft: 16,
  },
  unitText: { fontSize: 16, color: '#616161', marginLeft: 12 },

  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
    marginBottom: 28,
  },
  stockRowOut: { borderColor: '#ffebee' },
  stockLabel: { marginLeft: 10, fontSize: 16, fontWeight: '500' },
  outOfStockLabel: { color: '#d32f2f' },

  section: { marginBottom: 16 },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1b5e20',
    marginBottom: 14,
  },
  description: {
    fontSize: 16,
    lineHeight: 26,
    color: '#424242',
  },

  detailGrid: {
    backgroundColor: '#fafafa',
    borderRadius: 16,
    padding: 20,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  detailKey: { color: '#757575', fontSize: 15 },
  detailVal: { color: '#212121', fontWeight: '500', fontSize: 15 },

  relatedCard: {
    width: 160,
    marginHorizontal: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  relatedImg: { width: '100%', height: 120 },
  relatedName: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 4,
  },
  relatedPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2e7d32',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },

  floatingBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 16,
  },
  addCartBtn: {
    backgroundColor: '#4caf50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    marginBottom:22,
  },
  addCartDisabled: { backgroundColor: '#a5d6a7' },
  addCartLabel: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    marginLeft: 12,
  },
});

export default ProductDetailScreen;