// src/screens/MarketsScreen.js
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Dimensions,
  StatusBar,
  FlatList,
  Modal,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getVendorsByMarket } from '../apis/vendorApi';

const { width } = Dimensions.get('window');

const HERO_SLIDES = [
  {
    id: '1',
    marketName: 'Madina Market',
    tag: '📍 Madina Market',
    title: 'Fresh Produce,\nDelivered Daily',
    subtitle: 'Vegetables, fruits & staples from trusted vendors',
    image: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1769990080/vegetables_cpp5n5.jpg',
  },
  {
    id: '2',
    marketName: 'Makola Market',
    tag: '🛒 Makola Market',
    title: "Accra's Biggest\nMarket, Online",
    subtitle: 'Hundreds of vendors at your fingertips',
    image: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1777893982/makola_img_1_ryp6no.jpg',
  },
  {
    id: '3',
    marketName: null,
    tag: '🍎 Seasonal Picks',
    title: 'Juicy Fruits,\nEvery Season',
    subtitle: 'Tropical & local fruits sourced weekly',
    image: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1770885485/colorful-fruits-tasty-fresh-ripe-juicy-white-desk_utdxnl.jpg',
  },
  {
    id: '4',
    marketName: null,
    tag: '⚡ Free Delivery',
    title: 'Free Delivery\nOver GH₵ 200',
    subtitle: 'Shop from any Accra market and save on delivery',
    image: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1769989775/free_delivery_tsytih.jpg',
  },
];

const AUTO_SCROLL_MS = 4200;

const ALL_MARKETS = [
  'Madina Market',
  'Makola Market',
  'Kaneshie Market',
  'Mallam Market',
  'Tema Market',
  'Dansoman Market',
  'Agbogbloshie Market',
  'Dome Market',
];

const ALL_CATEGORIES = [
  'Tubers and Roots',
  'Fruits',
  'Vegetables',
  'Grains, Cereals & Legumes',
  'Meat',
  'Cold Store',
  'Super Market',
];

const CATEGORY_META = {
  'Tubers and Roots':          { emoji: '🥔', color: '#795548', bg: '#EFEBE9' },
  'Fruits':                    { emoji: '🍎', color: '#C62828', bg: '#FFEBEE' },
  'Vegetables':                { emoji: '🥦', color: '#2E7D32', bg: '#E8F5E9' },
  'Grains, Cereals & Legumes': { emoji: '🌾', color: '#F57F17', bg: '#FFF9C4' },
  'Meat':                      { emoji: '🥩', color: '#B71C1C', bg: '#FCE4EC' },
  'Cold Store':                { emoji: '❄️', color: '#1565C0', bg: '#E3F2FD' },
  'Super Market':              { emoji: '🏪', color: '#6A1B9A', bg: '#F3E5F5' },
};

const MARKET_PALETTE = {
  'Madina Market':       { accent: '#1B5E20', bg: '#E8F5E9', emoji: '🏬' },
  'Makola Market':       { accent: '#E65100', bg: '#FFF3E0', emoji: '🛒' },
  'Kaneshie Market':     { accent: '#1565C0', bg: '#E3F2FD', emoji: '🏪' },
  'Mallam Market':       { accent: '#00695C', bg: '#E0F2F1', emoji: '🌿' },
  'Tema Market':         { accent: '#6A1B9A', bg: '#F3E5F5', emoji: '🏭' },
  'Dansoman Market':     { accent: '#AD1457', bg: '#FCE4EC', emoji: '🏘️' },
  'Agbogbloshie Market': { accent: '#F57F17', bg: '#FFF9C4', emoji: '🌳' },
  'Dome Market':         { accent: '#4E342E', bg: '#EFEBE9', emoji: '🏙️' },
};
const DEFAULT_MARKET_PALETTE = { accent: '#2E7D32', bg: '#E8F5E9', emoji: '🛒' };

const PLACEHOLDER_COLORS = [
  { bg: '#E8F5E9', text: '#2E7D32' },
  { bg: '#FFF8E1', text: '#F9A825' },
  { bg: '#FCE4EC', text: '#AD1457' },
  { bg: '#E3F2FD', text: '#1565C0' },
  { bg: '#F3E5F5', text: '#6A1B9A' },
  { bg: '#FFF3E0', text: '#E65100' },
  { bg: '#E0F2F1', text: '#00695C' },
];

// ─────────────────────────────────────────────
// Hero Carousel
// ─────────────────────────────────────────────
const HeroCarousel = ({ onSlidePress }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);
  const timerRef = useRef(null);

  const startAutoScroll = useCallback(() => {
    timerRef.current = setInterval(() => {
      setActiveIndex(prev => {
        const next = (prev + 1) % HERO_SLIDES.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, AUTO_SCROLL_MS);
  }, []);

  useEffect(() => {
    startAutoScroll();
    return () => clearInterval(timerRef.current);
  }, [startAutoScroll]);

  const handleMomentumEnd = (e) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
    clearInterval(timerRef.current);
    startAutoScroll();
  };

  const renderSlide = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={() => onSlidePress(item)}
      style={{ width, height: 210, position: 'relative' }}
    >
      <Image source={{ uri: item.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,40,0,0.5)' }]} />
      <View style={heroStyles.content}>
        <View style={heroStyles.tag}>
          <Text style={heroStyles.tagText}>{item.tag}</Text>
        </View>
        <Text style={heroStyles.title}>{item.title}</Text>
        <Text style={heroStyles.subtitle}>{item.subtitle}</Text>
        <View style={heroStyles.btn}>
          <Text style={heroStyles.btnText}>
            {item.marketName ? `Shop ${item.marketName.split(' ')[0]}` : 'Browse All'}
          </Text>
          <Ionicons name="arrow-forward" size={13} color="#fff" />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View>
      <FlatList
        ref={flatListRef}
        data={HERO_SLIDES}
        renderItem={renderSlide}
        keyExtractor={i => i.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumEnd}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
      />
      <View style={heroStyles.dotsRow}>
        {HERO_SLIDES.map((_, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => {
              flatListRef.current?.scrollToIndex({ index: i, animated: true });
              setActiveIndex(i);
              clearInterval(timerRef.current);
              startAutoScroll();
            }}
          >
            <View style={[heroStyles.dot, i === activeIndex ? heroStyles.dotActive : heroStyles.dotInactive]} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const heroStyles = StyleSheet.create({
  content: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20 },
  tag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  tagText: { fontSize: 11, color: '#fff', fontWeight: '600' },
  title: {
    fontSize: 23,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 28,
    letterSpacing: -0.4,
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.82)', marginBottom: 12 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  btnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    backgroundColor: '#1B5E20',
  },
  dot: { borderRadius: 4, height: 5 },
  dotActive: { width: 20, backgroundColor: '#fff' },
  dotInactive: { width: 5, backgroundColor: 'rgba(255,255,255,0.35)' },
});

// ─────────────────────────────────────────────
// REUSABLE BOTTOM-SHEET MODAL
// Properly scrollable — the key fix.
// ─────────────────────────────────────────────
const BottomSheetModal = ({ visible, onClose, title, children }) => (
  <Modal
    visible={visible}
    transparent
    animationType="slide"
    statusBarTranslucent
    onRequestClose={onClose}
  >
    {/* ✅ FIX: outer flex: 1 with justifyContent ensures the sheet
        anchors to the bottom and the backdrop fills the rest */}
    <View style={bsStyles.root}>
      {/* Backdrop tap to close */}
      <TouchableOpacity style={bsStyles.backdrop} activeOpacity={1} onPress={onClose} />

      {/* Sheet — fixed max height, content scrolls inside */}
      <View style={bsStyles.sheet}>
        {/* Drag handle */}
        <View style={bsStyles.handle} />

        {/* Title — stays fixed at the top of the sheet */}
        <Text style={bsStyles.title}>{title}</Text>

        {/* ✅ FIX: ScrollView wraps all list items so they can scroll
            when the content overflows the sheet's maxHeight.
            nestedScrollEnabled prevents conflicts with the parent ScrollView. */}
        <ScrollView
          showsVerticalScrollIndicator
          bounces
          nestedScrollEnabled
          contentContainerStyle={bsStyles.listContent}
          indicatorStyle="black"
        >
          {children}
          {/* Bottom breathing room so the last item isn't flush against the edge */}
          <View style={{ height: 28 }} />
        </ScrollView>
      </View>
    </View>
  </Modal>
);

const bsStyles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',   // sheet stays anchored at bottom
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.48)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 12,
    // ✅ maxHeight keeps the sheet from filling the whole screen;
    // the ScrollView inside handles overflow.
    maxHeight: '78%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 16,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center', marginBottom: 18,
  },
  title: {
    fontSize: 18, fontWeight: '800', color: '#1B5E20',
    marginBottom: 14,
  },
  listContent: {
    paddingBottom: 4,
  },
});

// ─────────────────────────────────────────────
// Shared modal row component
// ─────────────────────────────────────────────
const ModalRow = ({ emoji, bg, label, meta, isActive, accentColor, onPress }) => (
  <TouchableOpacity
    style={[rowStyles.row, isActive && rowStyles.rowActive]}
    onPress={onPress}
    activeOpacity={0.75}
  >
    <View style={[rowStyles.iconWrap, { backgroundColor: bg || '#F5F5F5' }, isActive && rowStyles.iconWrapActive]}>
      <Text style={rowStyles.emoji}>{emoji}</Text>
    </View>
    <View style={rowStyles.body}>
      <Text style={[rowStyles.label, isActive && { color: accentColor || '#1B5E20', fontWeight: '700' }]}>
        {label}
      </Text>
      <Text style={rowStyles.meta}>{meta}</Text>
    </View>
    {isActive && <Ionicons name="checkmark-circle" size={22} color={accentColor || '#2E7D32'} />}
  </TouchableOpacity>
);

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 10,
    borderRadius: 14, marginBottom: 6, gap: 12,
  },
  rowActive: { backgroundColor: '#F1F8E9' },
  iconWrap: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  iconWrapActive: { borderWidth: 2, borderColor: '#A5D6A7' },
  emoji:  { fontSize: 21 },
  body:   { flex: 1 },
  label:  { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 2 },
  meta:   { fontSize: 11, color: '#9E9E9E', fontWeight: '500' },
});

// ─────────────────────────────────────────────
// Vendor Card
// ─────────────────────────────────────────────
const VendorCard = ({ vendor, onPress }) => {
  const imageUrl = vendor.profile_image;
  const name = vendor.name || 'Unknown Store';
  const productCount = vendor.products?.length || 0;
  const isVerified = vendor.is_verified;
  const marketName = vendor.market_name;
  const categories = vendor.categories || [];
  const palette = MARKET_PALETTE[marketName] || DEFAULT_MARKET_PALETTE;

  const colorIdx = (name.charCodeAt(0) || 0) % PLACEHOLDER_COLORS.length;
  const { bg: placeholderBg, text: placeholderText } = PLACEHOLDER_COLORS[colorIdx];

  return (
    <TouchableOpacity style={styles.vendorCard} onPress={() => onPress(vendor)} activeOpacity={0.82}>
      <View style={styles.vendorImageContainer}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.vendorImage} resizeMode="cover" />
        ) : (
          <View style={[styles.vendorPlaceholder, { backgroundColor: placeholderBg }]}>
            <Text style={[styles.vendorPlaceholderText, { color: placeholderText }]}>
              {name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        {isVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={17} color="#2E7D32" />
          </View>
        )}
        <View style={styles.productOverlay}>
          <Ionicons name="cube-outline" size={11} color="#fff" />
          <Text style={styles.productOverlayText}>
            {productCount} product{productCount !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>
      <View style={styles.vendorInfo}>
        <Text style={styles.vendorName} numberOfLines={1}>{name}</Text>
        {marketName && (
          <View style={[styles.marketTag, { backgroundColor: palette.bg }]}>
            <Text style={[styles.marketTagText, { color: palette.accent }]}>
              {palette.emoji} {marketName.replace(' Market', '')}
            </Text>
          </View>
        )}
        {categories.length > 0 && (
          <View style={styles.categoryRow}>
            {categories.slice(0, 2).map(cat => {
              const meta = CATEGORY_META[cat] || { emoji: '🏷', color: '#555', bg: '#F5F5F5' };
              return (
                <View key={cat} style={[styles.catPill, { backgroundColor: meta.bg }]}>
                  <Text style={[styles.catPillText, { color: meta.color }]}>
                    {meta.emoji} {cat.length > 10 ? cat.substring(0, 10) + '…' : cat}
                  </Text>
                </View>
              );
            })}
            {categories.length > 2 && (
              <View style={styles.catPillMore}>
                <Text style={styles.catPillMoreText}>+{categories.length - 2}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// ─────────────────────────────────────────────
// Stats Row
// ─────────────────────────────────────────────
const StatsRow = ({ allVendors, filteredCount, hasFilters }) => {
  const totalProducts = allVendors.reduce((acc, v) => acc + (v.products?.length || 0), 0);
  const uniqueMarkets = [...new Set(allVendors.map(v => v.market_name))].length;
  const stats = [
    { label: 'Markets', value: uniqueMarkets },
    { label: 'Vendors', value: hasFilters ? `${filteredCount}/${allVendors.length}` : allVendors.length },
    { label: 'Products', value: totalProducts > 999 ? `${(totalProducts / 1000).toFixed(1)}k` : totalProducts },
  ];
  return (
    <View style={styles.statsRow}>
      {stats.map((s, i) => (
        <View key={s.label} style={[styles.statChip, i < stats.length - 1 && styles.statChipBorder]}>
          <Text style={styles.statNum}>{s.value}</Text>
          <Text style={styles.statLabel}>{s.label}</Text>
        </View>
      ))}
    </View>
  );
};

// ─────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────
const MarketsScreen = ({ navigation }) => {
  const [allVendors, setAllVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [marketFilter, setMarketFilter] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [marketModalVisible, setMarketModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  const fetchVendors = useCallback(async () => {
    try {
      setError(null);
      const res = await getVendorsByMarket();
      if (res?.data?.success) {
        const markets = res.data.data || [];
        const flat = markets.flatMap(m =>
          (m.vendors || []).map(v => ({ ...v, market_name: v.market_name || m._id }))
        );
        setAllVendors(flat);
      } else {
        setError('Failed to load vendors.');
      }
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Could not load vendors');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);
  const onRefresh = () => { setRefreshing(true); fetchVendors(); };

  const filteredVendors = useMemo(() => {
    let result = allVendors;
    if (marketFilter)   result = result.filter(v => v.market_name === marketFilter);
    if (categoryFilter) result = result.filter(v => (v.categories || []).includes(categoryFilter));
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        v =>
          v.name?.toLowerCase().includes(q) ||
          v.market_name?.toLowerCase().includes(q) ||
          (v.categories || []).some(c => c.toLowerCase().includes(q))
      );
    }
    return result;
  }, [allVendors, marketFilter, categoryFilter, search]);

  const hasFilters = !!(marketFilter || categoryFilter || search.trim());

  const handleVendorPress = (vendor) =>
    navigation.navigate('VendorDetail', { vendorId: vendor._id, vendor });

  const handleSlidePress = (slide) => {
    if (slide.marketName) setMarketFilter(slide.marketName);
    else navigation.navigate('Products');
  };

  const clearAll = () => { setMarketFilter(null); setCategoryFilter(null); setSearch(''); };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#1B5E20" />
        <View style={styles.loadingHeader}>
          <Text style={styles.loadingHeaderTitle}>Accra Markets</Text>
        </View>
        <View style={styles.loadingBody}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Loading vendors…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#1B5E20" />

      {/* ══════════════════════════════════════
          MARKET BOTTOM-SHEET MODAL (now scrollable)
          ══════════════════════════════════════ */}
      <BottomSheetModal
        visible={marketModalVisible}
        onClose={() => setMarketModalVisible(false)}
        title="Filter by Market"
      >
        <ModalRow
          emoji="🏙️"
          bg="#F5F5F5"
          label="All Markets"
          meta={`${allVendors.length} vendors`}
          isActive={marketFilter === null}
          onPress={() => { setMarketFilter(null); setMarketModalVisible(false); }}
        />
        {ALL_MARKETS.map(market => {
          const p = MARKET_PALETTE[market] || DEFAULT_MARKET_PALETTE;
          const count = allVendors.filter(v => v.market_name === market).length;
          return (
            <ModalRow
              key={market}
              emoji={p.emoji}
              bg={p.bg}
              label={market}
              meta={`${count} vendor${count !== 1 ? 's' : ''}`}
              isActive={marketFilter === market}
              accentColor={p.accent}
              onPress={() => { setMarketFilter(market); setMarketModalVisible(false); }}
            />
          );
        })}
      </BottomSheetModal>

      {/* ══════════════════════════════════════
          CATEGORY BOTTOM-SHEET MODAL (now scrollable)
          ══════════════════════════════════════ */}
      <BottomSheetModal
        visible={categoryModalVisible}
        onClose={() => setCategoryModalVisible(false)}
        title="Filter by Category"
      >
        <ModalRow
          emoji="🏷️"
          bg="#F5F5F5"
          label="All Categories"
          meta={`${allVendors.length} vendors`}
          isActive={categoryFilter === null}
          onPress={() => { setCategoryFilter(null); setCategoryModalVisible(false); }}
        />
        {ALL_CATEGORIES.map(cat => {
          const meta = CATEGORY_META[cat] || { emoji: '🏷', color: '#555', bg: '#F5F5F5' };
          const count = allVendors.filter(v => (v.categories || []).includes(cat)).length;
          return (
            <ModalRow
              key={cat}
              emoji={meta.emoji}
              bg={meta.bg}
              label={cat}
              meta={`${count} vendor${count !== 1 ? 's' : ''}`}
              isActive={categoryFilter === cat}
              accentColor={meta.color}
              onPress={() => { setCategoryFilter(cat); setCategoryModalVisible(false); }}
            />
          );
        })}
      </BottomSheetModal>

      {/* Fixed green header */}
      <View style={styles.fixedHeader}>
        <View style={styles.fixedHeaderRow}>
          <View>
            <Text style={styles.fixedHeaderLabel}>Explore</Text>
            <Text style={styles.fixedHeaderTitle}>Accra Markets Vendors</Text>
          </View>
          <View style={styles.fixedHeaderBtns}>
            <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.navigate('Notification')}>
              <Ionicons name="notifications-outline" size={18} color="#E8F5E9" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIconBtn}>
              <Ionicons name="storefront-outline" size={18} color="#E8F5E9" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" colors={['#2E7D32']} />
        }
        contentContainerStyle={styles.scrollContent}
        stickyHeaderIndices={[1]}
        keyboardShouldPersistTaps="handled"
      >
        {/* 0 — Hero carousel */}
        <HeroCarousel onSlidePress={handleSlidePress} />

        {/* 1 — STICKY: search + toolbar */}
        <View style={styles.stickyBlock}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color="#9E9E9E" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search vendors, markets, categories…"
              placeholderTextColor="#BDBDBD"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={18} color="#BDBDBD" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.toolbar}>
            <View style={styles.toolbarRight}>
              <TouchableOpacity
                style={[styles.toolbarBtn, marketFilter && styles.toolbarBtnActive]}
                onPress={() => setMarketModalVisible(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="location-outline" size={15} color={marketFilter ? '#fff' : '#2E7D32'} />
                <Text style={[styles.toolbarBtnText, marketFilter && styles.toolbarBtnTextActive]} numberOfLines={1}>
                  {marketFilter ? marketFilter.replace(' Market', '') : 'Market'}
                </Text>
                <Ionicons name="chevron-down" size={13} color={marketFilter ? '#fff' : '#2E7D32'} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.toolbarBtn, categoryFilter && styles.toolbarBtnActive]}
                onPress={() => setCategoryModalVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 13 }}>
                  {categoryFilter ? (CATEGORY_META[categoryFilter]?.emoji || '🏷') : '🏷'}
                </Text>
                <Text style={[styles.toolbarBtnText, categoryFilter && styles.toolbarBtnTextActive]} numberOfLines={1}>
                  {categoryFilter
                    ? (categoryFilter.length > 10 ? categoryFilter.split(' ')[0] : categoryFilter)
                    : 'Category'}
                </Text>
                <Ionicons name="chevron-down" size={13} color={categoryFilter ? '#fff' : '#2E7D32'} />
              </TouchableOpacity>

              {hasFilters && (
                <TouchableOpacity style={styles.clearBtn} onPress={clearAll} activeOpacity={0.8}>
                  <Ionicons name="close" size={14} color="#E65100" />
                  <Text style={styles.clearBtnText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* 2 — Stats */}
        {allVendors.length > 0 && (
          <StatsRow allVendors={allVendors} filteredCount={filteredVendors.length} hasFilters={hasFilters} />
        )}

        {/* 3 — Section label */}
        <View style={styles.sectionLabelRow}>
          <Text style={styles.sectionLabel}>
            {hasFilters ? 'Filtered Vendors' : 'All Vendors'}
          </Text>
          <Text style={styles.sectionLabelCount}>{filteredVendors.length} found</Text>
        </View>

        {/* 4 — Vendor grid */}
        {error && allVendors.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="cloud-offline-outline" size={34} color="#A5D6A7" />
            </View>
            <Text style={styles.emptyTitle}>Couldn't load vendors</Text>
            <Text style={styles.emptySubtitle}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchVendors}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : filteredVendors.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="storefront-outline" size={34} color="#A5D6A7" />
            </View>
            <Text style={styles.emptyTitle}>No vendors found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your filters or search query</Text>
            {hasFilters && (
              <TouchableOpacity style={styles.retryBtn} onPress={clearAll}>
                <Text style={styles.retryBtnText}>Clear Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.vendorGrid}>
            {filteredVendors.map(vendor => (
              <VendorCard key={vendor._id} vendor={vendor} onPress={handleVendorPress} />
            ))}
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const CARD_WIDTH = (width - 16 * 2 - 12) / 2;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2EE' },

  fixedHeader: { backgroundColor: '#1B5E20', paddingHorizontal: 18, paddingTop: 10, paddingBottom: 14 },
  fixedHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  fixedHeaderLabel: { fontSize: 11, color: '#81C784', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  fixedHeaderTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.4 },
  fixedHeaderBtns: { flexDirection: 'row', gap: 8, marginTop: 4 },
  headerIconBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },

  scrollContent: { backgroundColor: '#F0F2EE' },

  stickyBlock: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 },

  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F7F9F7', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, margin: 12, borderWidth: 1, borderColor: '#E8F5E9' },
  searchInput: { flex: 1, fontSize: 14, color: '#1B2714', paddingVertical: 0 },

  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#fff', marginHorizontal:28 },
  toolbarRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  toolbarBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F8E9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 5, borderWidth: 1.5, borderColor: '#C8E6C9', maxWidth: 130 },
  toolbarBtnActive: { backgroundColor: '#2E7D32', borderColor: '#2E7D32', shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  toolbarBtnText: { fontSize: 12, color: '#2E7D32', fontWeight: '700', flex: 1 },
  toolbarBtnTextActive: { color: '#fff' },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFF3E0', borderWidth: 1, borderColor: '#FFCCBC' },
  clearBtnText: { fontSize: 12, fontWeight: '700', color: '#E65100' },

  statsRow: { flexDirection: 'row', backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 14, borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  statChip: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  statChipBorder: { borderRightWidth: 1, borderRightColor: '#F0F0F0' },
  statNum: { fontSize: 20, fontWeight: '800', color: '#1B5E20' },
  statLabel: { fontSize: 11, color: '#888', fontWeight: '500', marginTop: 2 },

  sectionLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingTop: 18, paddingBottom: 10 },
  sectionLabel: { fontSize: 17, fontWeight: '800', color: '#1B2714', letterSpacing: -0.2 },
  sectionLabelCount: { fontSize: 13, color: '#2E7D32', fontWeight: '600' },

  vendorGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12 },

  vendorCard: { width: CARD_WIDTH, backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3, borderWidth: 1, borderColor: '#F5F5F5' },
  vendorImageContainer: { height: 120, position: 'relative' },
  vendorImage: { width: '100%', height: '100%' },
  vendorPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  vendorPlaceholderText: { fontSize: 38, fontWeight: '800' },
  verifiedBadge: { position: 'absolute', top: 7, right: 7, backgroundColor: '#FFFFFF', borderRadius: 10, padding: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  productOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.44)', flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5 },
  productOverlayText: { fontSize: 10, color: '#fff', fontWeight: '600' },
  vendorInfo: { padding: 10 },
  vendorName: { fontSize: 13, fontWeight: '700', color: '#1B2714', marginBottom: 6 },
  marketTag: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 6 },
  marketTagText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  catPill: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  catPillText: { fontSize: 9, fontWeight: '700' },
  catPillMore: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, backgroundColor: '#F5F5F5' },
  catPillMoreText: { fontSize: 9, fontWeight: '700', color: '#9E9E9E' },

  emptyState: { alignItems: 'center', paddingHorizontal: 40, paddingTop: 70 },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1B2714', marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: '#757575', textAlign: 'center', lineHeight: 20 },

  loadingHeader: { backgroundColor: '#1B5E20', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  loadingHeaderTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  loadingBody: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F2EE' },
  loadingText: { marginTop: 14, fontSize: 15, color: '#757575' },

  retryBtn: { backgroundColor: '#2E7D32', paddingHorizontal: 32, paddingVertical: 13, borderRadius: 12, marginTop: 22 },
  retryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
});

export default MarketsScreen;