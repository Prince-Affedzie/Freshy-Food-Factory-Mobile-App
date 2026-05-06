// src/screens/VendorDetailScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getVendorById } from '../apis/vendorApi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  forest:     '#1A3C2A',
  pine:       '#2E7D32',
  sage:       '#43A047',
  mint:       '#E8F5E9',
  mintBorder: '#C8E6C9',
  cream:      '#F7F5F0',
  card:       '#FFFFFF',
  gold:       '#B8973A',
  textDark:   '#111111',
  textMid:    '#444444',
  textLight:  '#888888',
  border:     '#EBEBEB',
  shadow:     '#1A3C2A',
};

const CATEGORY_ICONS = {
  'Tubers and Roots':          'leaf-outline',
  'Fruits':                    'nutrition-outline',
  'Vegetables':                'flower-outline',
  'Grains, Cereals & Legumes': 'ellipse-outline',
  'Meat':                      'fast-food-outline',
  'Cold Store':                'snow-outline',
  'Super Market':              'storefront-outline',
};

// ── Sub-components ────────────────────────────────────────────────────────────

const SectionLabel = ({ title, count }) => (
  <View style={s.sectionHeader}>
    <View style={s.sectionAccent} />
    <Text style={s.sectionTitle}>{title}</Text>
    {count != null && (
      <View style={s.sectionBadge}>
        <Text style={s.sectionBadgeText}>{count}</Text>
      </View>
    )}
  </View>
);

const StatPill = ({  label, value }) => (
  <View style={s.statPill}>
    
    <View style={{ flex: 1 }}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={s.statValue} numberOfLines={1}>{value}</Text>
    </View>
  </View>
);

// ── Main Screen ───────────────────────────────────────────────────────────────

const VendorDetailScreen = ({ route, navigation }) => {
  const { vendorId } = route.params;
  const { addToCart, cartItems } = useCart();
  const { isAuthenticated } = useAuth();

  const [vendor, setVendor]                     = useState(null);
  const [loading, setLoading]                   = useState(true);
  const [refreshing, setRefreshing]             = useState(false);
  const [error, setError]                       = useState(null);
  const [addingProductId, setAddingProductId]   = useState(null);
  const [modalVisible, setModalVisible]         = useState(false);
  const [addedProductName, setAddedProductName] = useState('');

  const fetchVendor = async () => {
    try {
      setError(null);
      const res = await getVendorById(vendorId);
      if (res.status === 200 && res.data.success) {
        setVendor(res.data.data);
      } else {
        setError('Vendor not found.');
      }
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Failed to load vendor details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchVendor(); }, [vendorId]);
  const onRefresh = () => { setRefreshing(true); fetchVendor(); };

  const getQuantityInCart = (productId) => {
    const item = cartItems.find(i => i.product?._id === productId || i.productId === productId);
    return item?.quantity ?? 0;
  };

  const handleAddToCart = async (product) => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please login to add items to cart.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }
    if (product.stock <= 0 || product.countInStock <= 0) {
      Alert.alert('Out of Stock', `${product.name} is currently out of stock.`);
      return;
    }
    try {
      setAddingProductId(product.id || product._id);
      setAddedProductName(product.name);
      await addToCart(product.id || product._id, 1);
      setModalVisible(true);
      setTimeout(() => setModalVisible(false), 2200);
    } catch {
      Alert.alert('Error', 'Failed to add item to cart.');
    } finally {
      setAddingProductId(null);
    }
  };

  const isValidImage = (url) =>
    url && !url.includes('default_banner') && !url.includes('default_profile');

  const products   = vendor?.products   || [];
  const categories = vendor?.categories || [];

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[s.container, s.centered]} edges={['top']}>
        <ActivityIndicator size="large" color={C.pine} />
        <Text style={s.loadingText}>Loading vendor…</Text>
      </SafeAreaView>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error || !vendor) {
    return (
      <SafeAreaView style={[s.container, s.centered, { padding: 32 }]} edges={['top']}>
        <Ionicons name="alert-circle-outline" size={52} color={C.textLight} />
        <Text style={[s.loadingText, { marginTop: 12 }]}>{error || 'Vendor not found'}</Text>
        <TouchableOpacity style={s.retryBtn} onPress={() => { setLoading(true); fetchVendor(); }}>
          <Text style={s.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>

      {/* ── Success Modal ──────────────────────────────────────────────────── */}
      <Modal animationType="fade" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={s.successModal}>
            <View style={s.modalIconRing}>
              <Ionicons name="checkmark" size={28} color="#fff" />
            </View>
            <Text style={s.successTitle}>Added to Cart</Text>
            <Text style={s.successMsg}>{addedProductName}</Text>
            <TouchableOpacity
              style={s.modalPrimaryBtn}
              onPress={() => { setModalVisible(false); navigation.navigate('Cart'); }}
            >
              <Ionicons name="cart-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={s.modalPrimaryBtnText}>View Cart</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.modalSecondaryBtn} onPress={() => setModalVisible(false)}>
              <Text style={s.modalSecondaryText}>Continue Shopping</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.pine} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {/* ── Hero Banner ──────────────────────────────────────────────────── */}
        <View style={s.heroBanner}>
          {isValidImage(vendor.store_banner) ? (
            <Image source={{ uri: vendor.store_banner }} style={s.bannerImage} />
          ) : (
            <View style={s.bannerFallback} />
          )}
          {/* Dark scrim for legibility — pure RN View with opacity */}
          <View style={s.bannerScrim} />

          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>

          <View style={[s.heroBadge, { backgroundColor: vendor.is_verified ? C.pine : '#E65100' }]}>
            <Ionicons
              name={vendor.is_verified ? 'shield-checkmark' : 'time'}
              size={11}
              color="#fff"
              style={{ marginRight: 4 }}
            />
            <Text style={s.heroBadgeText}>{vendor.is_verified ? 'Verified' : 'Pending'}</Text>
          </View>
        </View>

        {/* ── Identity Card ─────────────────────────────────────────────────── */}
        <View style={s.identityCard}>
          <View style={s.avatarRing}>
            {isValidImage(vendor.profile_image) ? (
              <Image source={{ uri: vendor.profile_image }} style={s.avatar} />
            ) : (
              <View style={s.avatarFallback}>
                <Text style={s.avatarInitial}>{vendor.name?.charAt(0).toUpperCase() || '?'}</Text>
              </View>
            )}
          </View>
          <Text style={s.vendorName}>{vendor.name}</Text>
          <View style={s.marketRow}>
            <Ionicons name="storefront-outline" size={13} color={C.gold} />
            <Text style={s.marketName}>{vendor.market_name}</Text>
          </View>
        </View>

        {/* ── Stats Row ─────────────────────────────────────────────────────── */}
        <View style={s.statsRow}>
          {vendor.location && (
            <StatPill  label="Location" value={vendor.location} />
          )}
          <StatPill  label="Products" value={`${products.length} items`} />
          {categories.length > 0 && (
            <StatPill  label="Categories" value={`${categories.length} types`} />
          )}
        </View>

        {/* ── Categories ────────────────────────────────────────────────────── */}
        {categories.length > 0 && (
          <View style={s.section}>
            <SectionLabel title="Specialties" />
            <View style={s.chipWrap}>
              {categories.map((cat) => (
                <View key={cat} style={s.chip}>
                  <Ionicons
                    name={CATEGORY_ICONS[cat] || 'pricetag-outline'}
                    size={13}
                    color={C.pine}
                    style={{ marginRight: 5 }}
                  />
                  <Text style={s.chipText}>{cat}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={s.divider} />

        {/* ── Products ──────────────────────────────────────────────────────── */}
        <View style={s.section}>
          <SectionLabel title="Products" count={products.length} />
          {products.length === 0 ? (
            <View style={s.emptyState}>
              <Ionicons name="cube-outline" size={44} color={C.textLight} />
              <Text style={s.emptyText}>No products listed yet</Text>
            </View>
          ) : (
            <View style={s.grid}>
              {products.map((product) => {
                const isInCart   = getQuantityInCart(product._id) > 0;
                const isAdding   = addingProductId === (product.id || product._id);
                const outOfStock = product.stock <= 0 || product.countInStock <= 0;

                return (
  <TouchableOpacity
    key={product._id}
    style={s.productCard}
    onPress={() => navigation.navigate('ProductDetail', { productId: product._id, product })}
    activeOpacity={0.88}
  >
    {/* Image */}
    <View style={s.productImgWrap}>
      <Image
        source={{
          uri: product.image
            || product.images?.[0]
            || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80',
        }}
        style={s.productImg}
      />
      {outOfStock && (
        <View style={s.outOfStockOverlay}>
          <Text style={s.outOfStockText}>Out of Stock</Text>
        </View>
      )}
      {/* Cart button removed from here */}
    </View>

    {/* Info – now contains the cart button next to the price */}
    <View style={s.productBody}>
      <Text style={s.productName} numberOfLines={2}>{product.name}</Text>
      <View style={s.productFooter}>
        {product.price != null && (
          <Text style={s.productPrice}>GH₵ {product.price.toFixed(2)}</Text>
        )}
        <TouchableOpacity
          style={[
            s.cartBtn,
            isInCart   && s.cartBtnActive,
            outOfStock && s.cartBtnDisabled,
          ]}
          onPress={() => handleAddToCart(product)}
          disabled={isAdding || outOfStock}
          activeOpacity={0.8}
        >
          {isAdding ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons
              name={isInCart ? 'checkmark' : 'cart-outline'}
              size={15}
              color="#fff"
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
  </TouchableOpacity>
);
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const shadow = (opacity = 0.08, radius = 10, y = 4) =>
  Platform.select({
    ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: y }, shadowOpacity: opacity, shadowRadius: radius },
    android: { elevation: Math.round(radius * 0.6) },
  });

const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: C.cream },
  centered:      { justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 52 },

  loadingText:  { marginTop: 12, fontSize: 15, color: C.textLight, fontWeight: '500' },
  retryBtn:     { marginTop: 20, backgroundColor: C.pine, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 14 },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // ── Hero
  heroBanner:    { height: 210, backgroundColor: C.forest, position: 'relative' },
  bannerImage:   { width: '100%', height: '100%', resizeMode: 'cover' },
  bannerFallback:{ ...StyleSheet.absoluteFillObject, backgroundColor: C.forest },
  bannerScrim:   { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,30,18,0.45)' },

  backBtn: {
    position: 'absolute', top: 16, left: 16, zIndex: 20,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  heroBadge: {
    position: 'absolute', top: 18, right: 16, zIndex: 20,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  heroBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },

  // ── Identity
  identityCard: { alignItems: 'center', marginTop: -44, paddingBottom: 20, paddingHorizontal: 20 },
  avatarRing: {
    width: 90, height: 90, borderRadius: 45,
    borderWidth: 4, borderColor: C.cream,
    overflow: 'hidden', backgroundColor: C.mint,
    marginBottom: 12,
    ...shadow(0.18, 14, 6),
  },
  avatar:         { width: '100%', height: '100%' },
  avatarFallback: { flex: 1, backgroundColor: C.pine, justifyContent: 'center', alignItems: 'center' },
  avatarInitial:  { fontSize: 36, fontWeight: '800', color: '#fff' },
  vendorName:     { fontSize: 22, fontWeight: '800', color: C.textDark, textAlign: 'center', letterSpacing: -0.4 },
  marketRow:      { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 5 },
  marketName:     { fontSize: 13, color: C.textMid, fontWeight: '500' },

  // ── Stats
  statsRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, gap: 10,
    marginTop: 2, marginBottom: 24,
  },
  statPill: {
    flex: 1, minWidth: 108,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.card,
    borderRadius: 14, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 13, paddingVertical: 11,
    ...shadow(0.05, 8, 3),
  },
  statIconWrap: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: C.mint,
    justifyContent: 'center', alignItems: 'center',
  },
  statLabel: { fontSize: 11, color: C.textLight, fontWeight: '500' },
  statValue: { fontSize: 13, color: C.textDark, fontWeight: '700', marginTop: 1 },

  // ── Section
  section:       { paddingHorizontal: 16, marginBottom: 6 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 8 },
  sectionAccent: { width: 3, height: 17, borderRadius: 2, backgroundColor: C.gold },
  sectionTitle:  { fontSize: 16, fontWeight: '800', color: C.forest, flex: 1, letterSpacing: -0.2 },
  sectionBadge:  { backgroundColor: C.mint, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  sectionBadgeText: { fontSize: 12, fontWeight: '700', color: C.pine },

  divider: { height: 1, backgroundColor: C.border, marginHorizontal: 16, marginVertical: 20 },

  // ── Chips
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.mint,
    borderWidth: 1, borderColor: C.mintBorder,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7,
  },
  chipText: { fontSize: 12, fontWeight: '700', color: C.pine },

  // ── Products
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText:  { marginTop: 10, fontSize: 15, color: C.textLight },
  grid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },

  productCard: {
    width: CARD_WIDTH,
    backgroundColor: C.card,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
    ...shadow(0.07, 10, 4),
  },
  productImgWrap: { width: '100%', height: 138, position: 'relative' },
  productImg:     { width: '100%', height: '100%', resizeMode: 'cover' },

  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.42)',
    justifyContent: 'center', alignItems: 'center',
  },
  outOfStockText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },

  // Icon-only floating cart FAB — no text
 productBody:  { padding: 11 },
productFooter: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: 8,
},
cartBtn: {
  width: 34,
  height: 34,
  borderRadius: 17,
  backgroundColor: C.pine,
  justifyContent: 'center',
  alignItems: 'center',
  ...shadow(0.18, 5, 3),
},
cartBtnActive:   { backgroundColor: C.forest },
cartBtnDisabled: { backgroundColor: '#BDBDBD' },
  productBody:  { padding: 11 },
  productName:  { fontSize: 13, fontWeight: '600', color: C.textDark, lineHeight: 18, marginBottom: 5 },
  productPrice: { fontSize: 15, fontWeight: '800', color: C.forest },

  // ── Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.48)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  successModal: {
    backgroundColor: C.card,
    borderRadius: 22, padding: 30,
    alignItems: 'center',
    width: '100%', maxWidth: 340,
    ...shadow(0.14, 20, 8),
  },
  modalIconRing: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: C.pine,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  successTitle:       { fontSize: 19, fontWeight: '800', color: C.forest, marginBottom: 6 },
  successMsg:         { fontSize: 14, color: C.textMid, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  modalPrimaryBtn:    {
    width: '100%', flexDirection: 'row',
    backgroundColor: C.pine,
    paddingVertical: 14, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  modalPrimaryBtnText:{ color: '#fff', fontSize: 15, fontWeight: '700' },
  modalSecondaryBtn:  {
    width: '100%', paddingVertical: 13,
    borderRadius: 13, borderWidth: 1.5, borderColor: C.mintBorder,
    alignItems: 'center',
  },
  modalSecondaryText: { color: C.pine, fontSize: 14, fontWeight: '600' },
});

export default VendorDetailScreen;