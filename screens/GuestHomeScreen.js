// src/screens/auth/GuestHomeScreen.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Animated,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import productService from '../services/productService';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 44) / 2;

// ─── Category config ──────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'vegetable', label: 'Vegetables', icon: 'leaf',      color: '#2E7D32', bg: '#E8F5E9', image: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1769990080/vegetables_cpp5n5.jpg' },
  { id: 'fruit',     label: 'Fruits',     icon: 'nutrition', color: '#F57F17', bg: '#FFF8E1', image: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1773488413/fruits_1_shqhh2.jpg' },
  { id: 'staple',    label: 'Staples',    icon: 'bag',       color: '#5D4037', bg: '#EFEBE9', image: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1770886305/staple_food_xlgo92.jpg' },
  { id: 'herb',      label: 'Herbs',      icon: 'flower',    color: '#1B5E20', bg: '#F1F8E9', image: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1770885919/spices_and_herbs_srdlvf.jpg' },
  { id: 'tuber',     label: 'Tubers',     icon: 'earth',     color: '#BF360C', bg: '#FBE9E7', image: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1773487837/thomas-le-pRJhn4MbsMM-unsplash_xoh451.jpg' },
];

// ─── Hero carousel images ─────────────────────────────────────────────────────
const HERO_SLIDES = [
  {
    image: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1773523455/grocerry2_eul0ez.jpg',
    tag: 'Farm to Table',
    headline: 'The Freshest\nGroceries in Accra',
    sub: 'Delivered straight from local farms to your doorstep',
    cta: 'Shop Now',
  },
  {
    image: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1769990080/vegetables_cpp5n5.jpg',
    tag: 'Daily Fresh',
    headline: 'Crisp Vegetables\nEvery Morning',
    sub: 'Harvested fresh daily — no cold storage, no compromise',
    cta: 'See Vegetables',
  },
  {
    image: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1773488413/fruits_1_shqhh2.jpg',
    tag: 'Seasonal Picks',
    headline: 'Sun-Ripened\nFruits & More',
    sub: 'Handpicked at peak ripeness for maximum flavour',
    cta: 'Explore Fruits',
  },
];

// ─── Trust badges ─────────────────────────────────────────────────────────────
const TRUST_ITEMS = [
  { icon: 'leaf',            label: 'Farm Fresh',     sub: 'Direct from farms' },
  { icon: 'bicycle-outline', label: 'Fast Delivery',  sub: 'Same-day available' },
  { icon: 'shield-checkmark',label: 'Quality Assured',sub: '100% satisfaction' },
  { icon: 'wallet-outline',  label: 'Fair Prices',    sub: 'No hidden charges' },
];

// ─── Lock overlay (shown over product cards for guests) ───────────────────────
const LockOverlay = ({ onPress }) => (
  <TouchableOpacity style={lockStyles.wrap} onPress={onPress} activeOpacity={0.9}>
    <View style={lockStyles.pill}>
      <Ionicons name="lock-closed" size={12} color="#fff" />
      <Text style={lockStyles.text}>Sign in to add</Text>
    </View>
  </TouchableOpacity>
);

const lockStyles = StyleSheet.create({
  wrap: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'flex-end', alignItems: 'flex-end',
    padding: 10,
  },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(27,94,32,0.88)',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20,
  },
  text: { fontSize: 11, color: '#fff', fontWeight: '700' },
});

// ─── Product Card ─────────────────────────────────────────────────────────────
const ProductCard = ({ item, onSignInPress }) => {
  const outOfStock = item.stock <= 0 || item.countInStock <= 0;
  return (
    <TouchableOpacity style={cardStyles.card} onPress={onSignInPress} activeOpacity={0.88}>
      <View style={cardStyles.imageWrap}>
        <Image
          source={{ uri: item.image || 'https://via.placeholder.com/150' }}
          style={cardStyles.image}
          resizeMode="cover"
        />
        {outOfStock && (
          <View style={cardStyles.oosOverlay}>
            <Text style={cardStyles.oosText}>Out of Stock</Text>
          </View>
        )}
        <View style={cardStyles.catChip}>
          <Text style={cardStyles.catChipText}>
            {item.category?.charAt(0).toUpperCase() + (item.category?.slice(1) || '')}
          </Text>
        </View>
      </View>
      <View style={cardStyles.body}>
        <Text style={cardStyles.name} numberOfLines={2}>{item.name}</Text>
        <Text style={cardStyles.unit}>per {item.unit || 'piece'}</Text>
        <View style={cardStyles.footer}>
          <Text style={cardStyles.price}>GH₵{item.price?.toFixed(2)}</Text>
          <TouchableOpacity style={cardStyles.addBtn} onPress={onSignInPress} activeOpacity={0.85}>
            <Ionicons name="add" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const cardStyles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 2,
  },
  imageWrap: { height: 140, position: 'relative', backgroundColor: '#F5F5F5' },
  image: { width: '100%', height: '100%' },
  oosOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.48)',
    justifyContent: 'center', alignItems: 'center',
  },
  oosText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  catChip: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7,
  },
  catChipText: { fontSize: 9, color: '#2E7D32', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  body: { padding: 12, paddingTop: 10 },
  name: { fontSize: 13, fontWeight: '700', color: '#1A1A1A', marginBottom: 2, lineHeight: 18 },
  unit: { fontSize: 11, color: '#BDBDBD', marginBottom: 10, fontWeight: '500' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price: { fontSize: 16, fontWeight: '900', color: '#1B5E20' },
  addBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#4CAF50',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#4CAF50', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35, shadowRadius: 5, elevation: 4,
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
const GuestHomeScreen = () => {
  const navigation = useNavigation();

  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categoryProducts, setCategoryProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const heroSlideAnim = useRef(new Animated.Value(0)).current;
  const bannerAnim = useRef(new Animated.Value(0)).current;
  const heroAutoRef = useRef(null);

  useEffect(() => {
    loadData();
    startHeroAuto();
    return () => { if (heroAutoRef.current) clearInterval(heroAutoRef.current); };
  }, []);

  const startHeroAuto = () => {
    heroAutoRef.current = setInterval(() => {
      setHeroIndex(i => (i + 1) % HERO_SLIDES.length);
    }, 4500);
  };

  // Animate hero slide change
  useEffect(() => {
    Animated.sequence([
      Animated.timing(heroSlideAnim, { toValue: 0.85, duration: 200, useNativeDriver: true }),
      Animated.timing(heroSlideAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [heroIndex]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load featured (all, first 12)
      const featRes = await productService.getProducts({ limit: 12, sortBy: 'popular', page: 1 });
      if (featRes.success) setFeaturedProducts(featRes.data || []);

      // Load first 4 products per category in parallel
      const catResults = await Promise.allSettled(
        CATEGORIES.map(cat =>
          productService.getProducts({ category: cat.id, limit: 6, page: 1 })
        )
      );

      const catMap = {};
      catResults.forEach((result, i) => {
        if (result.status === 'fulfilled' && result.value.success) {
          catMap[CATEGORIES[i].id] = result.value.data || [];
        }
      });
      setCategoryProducts(catMap);

    } catch (err) {
      console.error('GuestHome load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      Animated.spring(bannerAnim, { toValue: 1, tension: 60, friction: 10, useNativeDriver: true }).start();
    }
  };

  const onRefresh = useCallback(() => { setRefreshing(true); loadData(); }, []);

  const goToSignIn = () => navigation.navigate('Login');
  const goToSignUp = () => navigation.navigate('SignUp');

  const currentSlide = HERO_SLIDES[heroIndex];

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#1B5E20" translucent />
       <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4CAF50" colors={['#4CAF50']} />
        }
      >

      {/* ════════════════════════════════
          STICKY HEADER
          ════════════════════════════════ */}
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          {/* Brand */}
          <View style={styles.headerBrand}>
            
            <View>
              <Text style={styles.headerBrandName}>FreshyFood Factory</Text>
              <Text style={styles.headerBrandSub}> Quality Foods</Text>
            </View>
          </View>

          {/* Auth buttons */}
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerSignInBtn} onPress={goToSignIn} activeOpacity={0.85}>
              <Text style={styles.headerSignInText}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerSignUpBtn} onPress={goToSignUp} activeOpacity={0.85}>
              <Text style={styles.headerSignUpText}>Sign Up</Text>
              <Ionicons name="arrow-forward" size={13} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

     
        {/* ════════════════════════════════
            HERO CAROUSEL
            ════════════════════════════════ */}
               {/* HERO CAROUSEL - Cleaner Version */}
        <View style={styles.hero}>
          <Animated.Image
            source={{ uri: currentSlide.image }}
            style={[styles.heroImage, { opacity: heroSlideAnim }]}
            resizeMode="cover"
          />

          {/* Neutral overlay - no green */}
          <View style={styles.heroOverlay} />

          {/* Content in nice container */}
          <Animated.View style={[styles.heroContentContainer, { opacity: heroSlideAnim }]}>
            <View style={styles.heroTag}>
              <View style={styles.heroTagDot} />
              <Text style={styles.heroTagText}>{currentSlide.tag}</Text>
            </View>

            <Text style={styles.heroHeadline}>{currentSlide.headline}</Text>
            <Text style={styles.heroSub}>{currentSlide.sub}</Text>

            {/* Hero CTAs */}
            <View style={styles.heroCtas}>
              <TouchableOpacity style={styles.heroPrimaryBtn} onPress={goToSignUp} activeOpacity={0.85}>
                <Ionicons name="storefront-outline" size={17} color="#fff" />
                <Text style={styles.heroPrimaryText}>{currentSlide.cta}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.heroSecondaryBtn} onPress={goToSignIn} activeOpacity={0.8}>
                <Text style={styles.heroSecondaryText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Dots */}
          <View style={styles.heroDots}>
            {HERO_SLIDES.map((_, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.heroDot, i === heroIndex && styles.heroDotActive]}
                onPress={() => setHeroIndex(i)}
              />
            ))}
          </View>
        </View>
        {/* ════════════════════════════════
            TRUST STRIP
            ════════════════════════════════ */}
        <View style={styles.trustStrip}>
          {TRUST_ITEMS.map((t, i) => (
            <View key={i} style={styles.trustItem}>
              <View style={styles.trustIconWrap}>
                <Ionicons name={t.icon} size={18} color="#2E7D32" />
              </View>
              <Text style={styles.trustLabel}>{t.label}</Text>
              <Text style={styles.trustSub}>{t.sub}</Text>
            </View>
          ))}
        </View>

        <Animated.View style={{ opacity: fadeAnim }}>

          {/* ════════════════════════════════
              SIGN-UP PERSUASION BANNER
              ════════════════════════════════ */}
          <Animated.View style={[styles.persuasionBanner, { transform: [{ scale: bannerAnim }] }]}>
            <View style={styles.persuasionLeft}>
              <Text style={styles.persuasionEyebrow}>🎉 New customers</Text>
              <Text style={styles.persuasionTitle}>Free delivery on{'\n'}your first order</Text>
              <Text style={styles.persuasionSub}>Create your account today and get started</Text>
            </View>
            <TouchableOpacity style={styles.persuasionBtn} onPress={goToSignUp} activeOpacity={0.85}>
              <Text style={styles.persuasionBtnText}>Join Free</Text>
              <Ionicons name="arrow-forward" size={14} color="#2E7D32" />
            </TouchableOpacity>
          </Animated.View>

          {/* ════════════════════════════════
              CATEGORY GRID
              ════════════════════════════════ */}
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Shop by Category</Text>
                <Text style={styles.sectionSub}>Pick what you need</Text>
              </View>
              <TouchableOpacity style={styles.sectionSeeAll} onPress={goToSignIn}>
                <Text style={styles.sectionSeeAllText}>Sign in to browse</Text>
                <Ionicons name="chevron-forward" size={13} color="#2E7D32" />
              </TouchableOpacity>
            </View>

            <View style={styles.catGrid}>
              {CATEGORIES.map((cat, i) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.catCard, i === 0 && styles.catCardWide]}
                  onPress={goToSignUp}
                  activeOpacity={0.88}
                >
                  <Image source={{ uri: cat.image }} style={styles.catCardImage} resizeMode="cover" />
                  <View style={styles.catCardScrim} />
                  <View style={styles.catCardContent}>
                    <View style={[styles.catCardIconWrap, { backgroundColor: cat.bg }]}>
                      <Ionicons name={cat.icon} size={16} color={cat.color} />
                    </View>
                    <Text style={styles.catCardLabel}>{cat.label}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ════════════════════════════════
              FEATURED PRODUCTS
              ════════════════════════════════ */}
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Featured Products</Text>
                <Text style={styles.sectionSub}>Our most popular picks</Text>
              </View>
              <TouchableOpacity style={styles.sectionSeeAll} onPress={goToSignIn}>
                <Text style={styles.sectionSeeAllText}>See all</Text>
                <Ionicons name="chevron-forward" size={13} color="#2E7D32" />
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.loadingText}>Loading fresh products…</Text>
              </View>
            ) : (
              <View style={styles.productGrid}>
                {featuredProducts.slice(0, 6).map(item => (
                  <ProductCard
                    key={item.id || item._id}
                    item={item}
                    onSignInPress={goToSignIn}
                  />
                ))}
              </View>
            )}
          </View>

          {/* ════════════════════════════════
              PER-CATEGORY ROWS
              ════════════════════════════════ */}
          {CATEGORIES.slice(0, 3).map(cat => {
            const products = categoryProducts[cat.id] || [];
            if (!loading && products.length === 0) return null;

            return (
              <View key={cat.id} style={styles.sectionWrap}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                   
                    <View>
                      <Text style={styles.sectionTitle}>Fresh {cat.label}</Text>
                      <Text style={styles.sectionSub}>Today's selection</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.sectionSeeAll} onPress={goToSignIn}>
                    <Text style={styles.sectionSeeAllText}>See all</Text>
                    <Ionicons name="chevron-forward" size={13} color="#2E7D32" />
                  </TouchableOpacity>
                </View>

                {loading ? (
                  <View style={styles.loadingWrap}>
                    <ActivityIndicator size="small" color="#4CAF50" />
                  </View>
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.hScrollContent}
                  >
                    {products.map(item => (
                      <View key={item.id || item._id} style={styles.hCardWrap}>
                        <ProductCard item={item} onSignInPress={goToSignIn} />
                      </View>
                    ))}
                    {/* See more card */}
                    <TouchableOpacity style={styles.seeMoreCard} onPress={goToSignIn} activeOpacity={0.85}>
                      <View style={[styles.seeMoreIconWrap, { backgroundColor: cat.bg }]}>
                        <Ionicons name="arrow-forward" size={22} color={cat.color} />
                      </View>
                      <Text style={[styles.seeMoreText, { color: cat.color }]}>See all{'\n'}{cat.label}</Text>
                    </TouchableOpacity>
                  </ScrollView>
                )}
              </View>
            );
          })}

          {/* ════════════════════════════════
              HOW IT WORKS
              ════════════════════════════════ */}
          <View style={styles.howItWorksWrap}>
            <Text style={styles.howTitle}>How it Works</Text>
            <Text style={styles.howSub}>Fresh food in three easy steps</Text>
            <View style={styles.howSteps}>
              {[
                { step: '01', icon: 'search-outline',        color: '#1565C0', bg: '#E3F2FD', label: 'Browse',  desc: 'Explore fresh produce from local farms' },
                { step: '02', icon: 'cart-outline',           color: '#2E7D32', bg: '#E8F5E9', label: 'Order',   desc: 'Add items and choose your delivery slot' },
                { step: '03', icon: 'bicycle-outline',        color: '#F57F17', bg: '#FFF8E1', label: 'Receive', desc: 'Get it delivered fresh to your door' },
              ].map((s, i) => (
                <View key={i} style={styles.howStep}>
                  <View style={[styles.howStepIconWrap, { backgroundColor: s.bg }]}>
                    <Ionicons name={s.icon} size={22} color={s.color} />
                  </View>
                  <View style={styles.howStepNumWrap}>
                    <Text style={[styles.howStepNum, { color: s.color }]}>{s.step}</Text>
                  </View>
                  <Text style={styles.howStepLabel}>{s.label}</Text>
                  <Text style={styles.howStepDesc}>{s.desc}</Text>
                  {i < 2 && <View style={styles.howConnector} />}
                </View>
              ))}
            </View>
          </View>

          {/* ════════════════════════════════
              FINAL CTA BANNER
              ════════════════════════════════ */}
          <View style={styles.finalCta}>
            <View style={styles.finalCtaInner}>
              {/* Background accents */}
              <View style={styles.finalCtaCircle1} />
              <View style={styles.finalCtaCircle2} />

             
              <Text style={styles.finalCtaEyebrow}>Ready to eat fresh?</Text>
              <Text style={styles.finalCtaTitle}>Join FreshyFood Factory</Text>
              <Text style={styles.finalCtaSub}>
                Create a free account and start ordering the freshest groceries in Accra, delivered to your door.
              </Text>

              <TouchableOpacity style={styles.finalCtaBtn} onPress={goToSignUp} activeOpacity={0.88}>
                <Ionicons name="person-add-outline" size={18} color="#2E7D32" />
                <Text style={styles.finalCtaBtnText}>Create Free Account</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={goToSignIn} style={styles.finalCtaSignIn}>
                <Text style={styles.finalCtaSignInText}>
                  Already a member? <Text style={styles.finalCtaSignInLink}>Sign in →</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>

        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLeafRow}>
          
            <Text style={styles.footerBrand}>FreshyFood Factory</Text>
            <Ionicons name="leaf" size={13} color="#A5D6A7" />
          </View>
          <Text style={styles.footerSub}>Accra, Ghana · © {new Date().getFullYear()}</Text>
          <View style={styles.footerLinks}>
            <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')}>
              <Text style={styles.footerLink}>Privacy Policy</Text>
            </TouchableOpacity>
            <Text style={styles.footerLinkDot}>·</Text>
            <TouchableOpacity onPress={() => navigation.navigate('TermsOfService')}>
              <Text style={styles.footerLink}>Terms of Service</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F9F7' },
  scroll: { flex: 1 },

  // ── HEADER ──────────────────────────────────────────────────────────────────
  headerSafe: { backgroundColor: '#F7F9F7', zIndex: 10 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#2E7D32',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  headerBrand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerLeafBadge: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerBrandName: { fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: 0.2 },
  headerBrandSub: { fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  headerSignInBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)',
  },
  headerSignInText: { fontSize: 13, color: '#fff', fontWeight: '700' },
  headerSignUpBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, backgroundColor: '#4CAF50',
    shadowColor: '#4CAF50', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4, shadowRadius: 6, elevation: 4,
  },
  headerSignUpText: { fontSize: 13, color: '#fff', fontWeight: '800' },

  // ── HERO ────────────────────────────────────────────────────────────────────
    // ── HERO ────────────────────────────────────────────────────────────────────
  hero: {
    height: 420,
    position: 'relative',
    overflow: 'hidden',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%', 
    height: '100%',
  },

  // Main neutral overlay (no green) - balanced transparency
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.52)',   // Clean dark overlay
  },

  // Nice container for text + buttons
  heroContentContainer: {
    position: 'absolute',
    bottom: 70,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.68)',     // Semi-transparent dark box
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 15,
  },

  heroTag: {
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6,
    marginBottom: 12,
  },
  heroTagDot: {
    width: 6, 
    height: 6, 
    borderRadius: 3,
    backgroundColor: '#69F0AE',   // Keep the fresh green accent only here
  },
  heroTagText: {
    fontSize: 12, 
    fontWeight: '800',
    color: '#69F0AE', 
    letterSpacing: 1.5, 
    textTransform: 'uppercase',
  },
  heroHeadline: {
    fontSize: 34, 
    fontWeight: '900', 
    color: '#fff',
    lineHeight: 40, 
    letterSpacing: -0.5, 
    marginBottom: 10,
  },
  heroSub: {
    fontSize: 14, 
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20, 
    marginBottom: 24,
  },
  heroCtas: { 
    flexDirection: 'row', 
    gap: 10 
  },
  heroPrimaryBtn: {
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8,
    backgroundColor: '#4CAF50', 
    paddingVertical: 15,
    borderRadius: 14,
    shadowColor: '#4CAF50', 
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45, 
    shadowRadius: 10, 
    elevation: 6,
  },
  heroPrimaryText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '800' 
  },
  heroSecondaryBtn: {
    paddingHorizontal: 22, 
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1.5, 
    borderColor: 'rgba(255,255,255,0.45)',
    justifyContent: 'center', 
    alignItems: 'center',
  },
  heroSecondaryText: { 
    color: '#fff', 
    fontSize: 15, 
    fontWeight: '700' 
  },
  heroDots: {
    position: 'absolute', 
    bottom: 22, 
    left: 0, 
    right: 0,
    flexDirection: 'row', 
    justifyContent: 'center', 
    gap: 6,
  },
  heroDot: {
    width: 6, 
    height: 6, 
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  heroDotActive: {
    width: 22, 
    height: 6, 
    borderRadius: 3,
    backgroundColor: '#4CAF50',
  },

  // ── TRUST STRIP ─────────────────────────────────────────────────────────────
  trustStrip: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  trustItem: { flex: 1, alignItems: 'center', gap: 4 },
  trustIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  },
  trustLabel: { fontSize: 11, fontWeight: '800', color: '#1A1A1A', textAlign: 'center' },
  trustSub: { fontSize: 10, color: '#9E9E9E', textAlign: 'center', fontWeight: '500' },

  // ── PERSUASION BANNER ────────────────────────────────────────────────────────
  persuasionBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1B5E20',
    marginHorizontal: 16, marginTop: 16, marginBottom: 4,
    borderRadius: 18, padding: 18, gap: 12,
    overflow: 'hidden',
    shadowColor: '#1B5E20', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  persuasionLeft: { flex: 1 },
  persuasionEyebrow: { fontSize: 11, color: '#69F0AE', fontWeight: '800', marginBottom: 4 },
  persuasionTitle: { fontSize: 18, fontWeight: '900', color: '#fff', lineHeight: 24, marginBottom: 4 },
  persuasionSub: { fontSize: 12, color: 'rgba(255,255,255,0.65)' },
  persuasionBtn: {
    backgroundColor: '#FFD54F',
    paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    flexShrink: 0,
  },
  persuasionBtnText: { color: '#2E7D32', fontWeight: '900', fontSize: 13 },

  // ── SECTIONS ────────────────────────────────────────────────────────────────
  sectionWrap: { paddingHorizontal: 16, marginTop: 24 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', marginBottom: 14,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionCatIcon: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: '#1A1A1A', letterSpacing: -0.3 },
  sectionSub: { fontSize: 12, color: '#9E9E9E', marginTop: 1, fontWeight: '500' },
  sectionSeeAll: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#F1F8E9', paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 20, marginTop: 4,
  },
  sectionSeeAllText: { fontSize: 12, color: '#2E7D32', fontWeight: '700' },

  // ── CATEGORY GRID ───────────────────────────────────────────────────────────
  catGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  catCard: {
    width: (width - 42) / 2,
    height: 110,
    borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 4,
  },
  catCardWide: {
    width: width - 32,
    height: 130,
  },
  catCardImage: { width: '100%', height: '100%' },
  catCardScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  catCardContent: {
    position: 'absolute', bottom: 12, left: 12,
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  catCardIconWrap: {
    width: 30, height: 30, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
  },
  catCardLabel: { fontSize: 15, fontWeight: '900', color: '#fff', textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },

  // ── PRODUCT GRID ─────────────────────────────────────────────────────────────
  productGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  loadingWrap: { paddingVertical: 40, alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 13, color: '#9E9E9E', fontWeight: '500' },

  // ── HORIZONTAL SCROLL ────────────────────────────────────────────────────────
  hScrollContent: { paddingLeft: 2, paddingRight: 16, gap: 10 },
  hCardWrap: { width: CARD_WIDTH },
  seeMoreCard: {
    width: 130,
    backgroundColor: '#fff',
    borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
    gap: 10, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    borderWidth: 1.5, borderColor: '#E8E8E8', borderStyle: 'dashed',
    minHeight: 200,
  },
  seeMoreIconWrap: {
    width: 52, height: 52, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center',
  },
  seeMoreText: {
    fontSize: 13, fontWeight: '700', textAlign: 'center', lineHeight: 18,
  },

  // ── HOW IT WORKS ─────────────────────────────────────────────────────────────
  howItWorksWrap: {
    marginHorizontal: 16, marginTop: 28,
    backgroundColor: '#fff',
    borderRadius: 20, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  howTitle: { fontSize: 22, fontWeight: '900', color: '#1A1A1A', marginBottom: 4, letterSpacing: -0.3 },
  howSub: { fontSize: 13, color: '#9E9E9E', marginBottom: 24 },
  howSteps: { flexDirection: 'row', alignItems: 'flex-start', position: 'relative' },
  howStep: { flex: 1, alignItems: 'center', gap: 8, position: 'relative' },
  howStepIconWrap: {
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 4,
  },
  howStepNumWrap: { position: 'absolute', top: -4, right: '15%' },
  howStepNum: { fontSize: 10, fontWeight: '900', opacity: 0.5 },
  howStepLabel: { fontSize: 14, fontWeight: '800', color: '#1A1A1A' },
  howStepDesc: { fontSize: 11, color: '#9E9E9E', textAlign: 'center', lineHeight: 15 },
  howConnector: {
    position: 'absolute', top: 28, right: -12,
    width: 24, height: 2, backgroundColor: '#E8E8E8', borderRadius: 1,
  },

  // ── FINAL CTA ────────────────────────────────────────────────────────────────
  finalCta: {
    marginHorizontal: 16, marginTop: 28,
    borderRadius: 22, overflow: 'hidden',
    shadowColor: '#1B5E20', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  finalCtaInner: {
    backgroundColor: '#2E7D32',
    padding: 32, alignItems: 'center',
    position: 'relative',
  },
  finalCtaCircle1: {
    position: 'absolute', top: -40, right: -40,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  finalCtaCircle2: {
    position: 'absolute', bottom: -30, left: -30,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  finalCtaEyebrow: {
    fontSize: 12, fontWeight: '800',
    color: '#69F0AE', letterSpacing: 1.5, textTransform: 'uppercase',
    marginBottom: 8,
  },
  finalCtaTitle: {
    fontSize: 26, fontWeight: '900', color: '#fff',
    textAlign: 'center', lineHeight: 32,
    letterSpacing: -0.4, marginBottom: 12,
  },
  finalCtaSub: {
    fontSize: 14, color: 'rgba(255,255,255,0.65)',
    textAlign: 'center', lineHeight: 21, marginBottom: 24,
    paddingHorizontal: 8,
  },
  finalCtaBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', paddingVertical: 16, paddingHorizontal: 28,
    borderRadius: 14, width: '100%', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 4,
  },
  finalCtaBtnText: { fontSize: 16, fontWeight: '900', color: '#1B5E20' },
  finalCtaSignIn: { marginTop: 14 },
  finalCtaSignInText: { fontSize: 13, color: 'rgba(255,255,255,0.55)' },
  finalCtaSignInLink: { color: '#69F0AE', fontWeight: '800' },

  // ── FOOTER ───────────────────────────────────────────────────────────────────
  footer: { alignItems: 'center', paddingVertical: 24, gap: 5, marginTop: 10 },
  footerLeafRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  footerBrand: { fontSize: 13, fontWeight: '800', color: '#9E9E9E' },
  footerSub: { fontSize: 11, color: '#BDBDBD' },
  footerLinks: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  footerLink: { fontSize: 12, color: '#4CAF50', fontWeight: '600' },
  footerLinkDot: { fontSize: 12, color: '#D0D0D0' },
});

export default GuestHomeScreen;