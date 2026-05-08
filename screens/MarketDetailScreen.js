// src/screens/MarketDetailScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Animated,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getVendors } from '../apis/vendorApi';

const { width } = Dimensions.get('window');
const CARD_WIDTH    = (width - 44) / 2;
const HERO_HEIGHT   = 210;           // ← reduced from 300
const SLIDE_DURATION = 4000;

// ─────────────────────────────────────────────
// Category metadata (mirrors MarketsScreen)
// ─────────────────────────────────────────────
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
  'Tubers and Roots':          { emoji: '🥔', color: '#795548', bg: '#EFEBE9', icon: 'leaf-outline' },
  'Fruits':                    { emoji: '🍎', color: '#C62828', bg: '#FFEBEE', icon: 'nutrition-outline' },
  'Vegetables':                { emoji: '🥦', color: '#2E7D32', bg: '#E8F5E9', icon: 'flower-outline' },
  'Grains, Cereals & Legumes': { emoji: '🌾', color: '#F57F17', bg: '#FFF9C4', icon: 'ellipse-outline' },
  'Meat':                      { emoji: '🥩', color: '#B71C1C', bg: '#FCE4EC', icon: 'fast-food-outline' },
  'Cold Store':                { emoji: '❄️', color: '#1565C0', bg: '#E3F2FD', icon: 'snow-outline' },
  'Super Market':              { emoji: '🏪', color: '#6A1B9A', bg: '#F3E5F5', icon: 'storefront-outline' },
};

// ─────────────────────────────────────────────
// Per-market hero image sets
// ─────────────────────────────────────────────
const MARKET_SLIDES = {
  'Madina Market': [
    'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=1200&q=80',
    'https://res.cloudinary.com/duv3qvvjz/image/upload/v1777893983/makola_img_3_dbeymr.jpg',
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=80',
  ],
  'Mallam Market': [
    'https://res.cloudinary.com/duv3qvvjz/image/upload/v1777893978/mallam_img_2_m08mgf.jpg',
    'https://res.cloudinary.com/duv3qvvjz/image/upload/v1777893978/mallam_img_1_zdkq8f.jpg',
    'https://res.cloudinary.com/duv3qvvjz/image/upload/v1777893978/mallam_market_3_qzqkyi.jpg',
  ],
  'Makola Market': [
    'https://res.cloudinary.com/duv3qvvjz/image/upload/v1777893982/makola_img_1_ryp6no.jpg',
    'https://res.cloudinary.com/duv3qvvjz/image/upload/v1777893983/makola_img_2_gh3bsj.jpg',
    'https://res.cloudinary.com/duv3qvvjz/image/upload/v1777893983/makola_img_3_dbeymr.jpg',
  ],
  'Tema Market': [
    'https://res.cloudinary.com/duv3qvvjz/image/upload/v1777898155/local_african_market_1_nuzwm6.jpg',
    'https://res.cloudinary.com/duv3qvvjz/image/upload/v1777898155/local_african_market_2_yybfqv.jpg',
    'https://res.cloudinary.com/duv3qvvjz/image/upload/v1777893978/mallam_market_3_qzqkyi.jpg',
  ],
  'Dansoman Market': [
    'https://res.cloudinary.com/duv3qvvjz/image/upload/v1777898155/local_african_market_2_yybfqv.jpg',
    'https://res.cloudinary.com/duv3qvvjz/image/upload/v1777893978/mallam_market_3_qzqkyi.jpg',
    'https://res.cloudinary.com/duv3qvvjz/image/upload/v1777898155/local_african_market_1_nuzwm6.jpg',
  ],
  'Agbogbloshie Market': [
    'https://res.cloudinary.com/duv3qvvjz/image/upload/v1777898155/local_african_market_3_m8v0dr.jpg',
    'https://res.cloudinary.com/duv3qvvjz/image/upload/v1777898155/local_african_market_1_nuzwm6.jpg',
    'https://res.cloudinary.com/duv3qvvjz/image/upload/v1777898155/local_african_market_2_yybfqv.jpg',
  ],
  'Kaneshie Market': [
    'https://res.cloudinary.com/duv3qvvjz/image/upload/v1777899189/kanashie_img1_tnjmje.jpg',
    'https://res.cloudinary.com/duv3qvvjz/image/upload/v1777899189/kanashie_img_3_f7ywwz.jpg',
    'https://res.cloudinary.com/duv3qvvjz/image/upload/v1777899209/kanashie_img_2_koqxm4.jpg',
  ],
  'Dome Market': [
    'https://res.cloudinary.com/duv3qvvjz/image/upload/v1777899430/dome_market_img2_qxhyhq.jpg',
    'https://res.cloudinary.com/duv3qvvjz/image/upload/v1777899431/dome_market_img1_jweael.jpg',
    'https://res.cloudinary.com/duv3qvvjz/image/upload/v1777899430/dome_market_img3_i0ontt.jpg',
  ],
  default: [
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=80',
    'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=1200&q=80',
    'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=1200&q=80',
  ],
};

// ─────────────────────────────────────────────
// HERO CAROUSEL  (height now HERO_HEIGHT = 210)
// ─────────────────────────────────────────────
const HeroCarousel = ({
  marketName,
  vendorCount,
  loading,
  search,
  onSearchChange,
  onBack,
}) => {
  const slides      = MARKET_SLIDES[marketName] ?? MARKET_SLIDES.default;
  const [activeIdx, setActiveIdx] = useState(0);
  const flatListRef = useRef(null);
  const timerRef    = useRef(null);

  const progressAnims = useRef(slides.map(() => new Animated.Value(0))).current;
  const textOpacity   = useRef(new Animated.Value(0)).current;
  const textTranslate = useRef(new Animated.Value(10)).current;

  const animateTextIn = () => {
    textOpacity.setValue(0);
    textTranslate.setValue(10);
    Animated.parallel([
      Animated.timing(textOpacity,   { toValue: 1, duration: 480, useNativeDriver: true }),
      Animated.timing(textTranslate, { toValue: 0, duration: 420, useNativeDriver: true }),
    ]).start();
  };

  const startProgress = useCallback((idx) => {
    progressAnims.forEach(a => a.setValue(0));
    for (let i = 0; i < idx; i++) progressAnims[i].setValue(1);
    Animated.timing(progressAnims[idx], {
      toValue: 1, duration: SLIDE_DURATION, useNativeDriver: false,
    }).start();
  }, [progressAnims]);

  const goToSlide = useCallback((idx) => {
    clearInterval(timerRef.current);
    setActiveIdx(idx);
    flatListRef.current?.scrollToIndex({ index: idx, animated: true });
    startProgress(idx);
    animateTextIn();
    timerRef.current = setInterval(() => {
      setActiveIdx(prev => {
        const next = (prev + 1) % slides.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        startProgress(next);
        animateTextIn();
        return next;
      });
    }, SLIDE_DURATION);
  }, [slides.length, startProgress]);

  useEffect(() => {
    goToSlide(0);
    return () => clearInterval(timerRef.current);
  }, []);

  const handleMomentumScrollEnd = (e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    if (idx !== activeIdx) goToSlide(idx);
  };

  const renderSlide = ({ item }) => (
    <View style={styles.heroSlide}>
      <Image source={{ uri: item }} style={styles.heroSlideImage} resizeMode="cover" />
      <View style={styles.heroScrimTop} />
      <View style={styles.heroScrimBottom} />
    </View>
  );

  return (
    <View style={styles.heroWrap}>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        scrollEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        style={StyleSheet.absoluteFill}
      />

      {/* Nav bar */}
      <SafeAreaView edges={['top']} style={styles.heroNav}>
        <TouchableOpacity style={styles.heroBackBtn} onPress={onBack}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Animated.View style={[styles.heroTitleWrap, { opacity: textOpacity, transform: [{ translateY: textTranslate }] }]}>
          <Text style={styles.heroTitle} numberOfLines={1}>{marketName}</Text>
          {!loading && (
            <View style={styles.heroCountBadge}>
              <Ionicons name="storefront-outline" size={11} color="#fff" />
              <Text style={styles.heroCount}>{vendorCount} vendor{vendorCount !== 1 ? 's' : ''}</Text>
            </View>
          )}
        </Animated.View>
        <View style={{ width: 40 }} />
      </SafeAreaView>

      {/* Progress bars */}
      <View style={styles.heroProgressRow}>
        {slides.map((_, i) => (
          <TouchableOpacity key={i} style={styles.heroProgressTrack} onPress={() => goToSlide(i)}>
            <Animated.View
              style={[styles.heroProgressFill, {
                width: progressAnims[i].interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
              }]}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Floating search bar */}
      <View style={styles.heroSearchWrap}>
        <View style={styles.heroSearchBar}>
          <Ionicons name="search-outline" size={17} color="#4CAF50" style={{ marginLeft: 14 }} />
          <TextInput
            style={styles.heroSearchInput}
            placeholder="Search vendors..."
            placeholderTextColor="#9E9E9E"
            value={search}
            onChangeText={onSearchChange}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => onSearchChange('')} style={{ padding: 10 }}>
              <Ionicons name="close-circle" size={18} color="#BDBDBD" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────
// CATEGORY FILTER BAR
// Horizontally scrollable chip row.
// "All" chip + one chip per category that has
// at least one vendor in this market.
// ─────────────────────────────────────────────
const CategoryFilterBar = ({ vendors, activeCategory, onSelect }) => {
  // Only show categories that are actually used by vendors in this market
  const availableCategories = ALL_CATEGORIES.filter(cat =>
    vendors.some(v => (v.categories || []).includes(cat))
  );

  if (availableCategories.length === 0) return null;

  return (
    <View style={styles.catBarWrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catBarContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* "All" chip */}
        <TouchableOpacity
          style={[styles.catChip, activeCategory === null && styles.catChipActive]}
          onPress={() => onSelect(null)}
          activeOpacity={0.8}
        >
          <Text style={[styles.catChipText, activeCategory === null && styles.catChipTextActive]}>
            All
          </Text>
        </TouchableOpacity>

        {availableCategories.map(cat => {
          const meta    = CATEGORY_META[cat] || { emoji: '🏷', color: '#555', bg: '#F5F5F5' };
          const isActive = activeCategory === cat;
          const count   = vendors.filter(v => (v.categories || []).includes(cat)).length;
          return (
            <TouchableOpacity
              key={cat}
              style={[
                styles.catChip,
                isActive && styles.catChipActive,
                !isActive && { borderColor: meta.bg },
              ]}
              onPress={() => onSelect(isActive ? null : cat)}
              activeOpacity={0.8}
            >
              <Text style={styles.catChipEmoji}>{meta.emoji}</Text>
              <Text style={[styles.catChipText, isActive && styles.catChipTextActive]}>
                {cat.length > 14 ? cat.split(' ')[0] : cat}
              </Text>
              <View style={[
                styles.catChipBadge,
                isActive ? styles.catChipBadgeActive : { backgroundColor: meta.bg },
              ]}>
                <Text style={[styles.catChipBadgeText, isActive && { color: '#fff' }]}>
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

// ─────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────
const MarketDetailScreen = ({ route, navigation }) => {
  const { marketName } = route.params;

  const [vendors,          setVendors]          = useState([]);
  const [filteredVendors,  setFilteredVendors]  = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [refreshing,       setRefreshing]       = useState(false);
  const [error,            setError]            = useState(null);
  const [search,           setSearch]           = useState('');
  const [viewMode,         setViewMode]         = useState('grid');
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [sortBy,           setSortBy]           = useState('name');
  const [categoryFilter,   setCategoryFilter]   = useState(null);   // ← NEW

  const fetchVendors = useCallback(async () => {
    try {
      setError(null);
      const res = await getVendors({ market: marketName });
      if (res.data?.success) {
        const data = res.data.data;
        setVendors(data);
        setFilteredVendors(data);
      } else {
        setError('Failed to load vendors.');
      }
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Something went wrong');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [marketName]);

  useEffect(() => { setLoading(true); fetchVendors(); }, [fetchVendors]);
  const onRefresh = () => { setRefreshing(true); fetchVendors(); };

  // Filter + sort whenever search / categoryFilter / sortBy / vendors change
  useEffect(() => {
    let result = [...vendors];

    // Category filter
    if (categoryFilter) {
      result = result.filter(v => (v.categories || []).includes(categoryFilter));
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        v => v.name.toLowerCase().includes(q) ||
             (v.location && v.location.toLowerCase().includes(q))
      );
    }

    // Sort
    if (sortBy === 'name') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortBy === 'verification') {
      result.sort((a, b) => (b.is_verified ? 1 : 0) - (a.is_verified ? 1 : 0));
    }

    setFilteredVendors(result);
  }, [search, vendors, sortBy, categoryFilter]);

  const handleVendorPress = (vendor) =>
    navigation.navigate('VendorDetail', { vendorId: vendor._id, vendor });

  const sortOptions = [
    { id: 'name',         label: 'Name A–Z',      icon: 'text-outline' },
    { id: 'verification', label: 'Verified First', icon: 'checkmark-circle-outline' },
  ];
  const activeSortLabel = sortOptions.find(s => s.id === sortBy)?.label || 'Sort';

  const hasActiveFilters = !!(search.trim() || categoryFilter);

  // ── Error full-page state ──────────────────
  if (error && vendors.length === 0 && !loading) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <HeroCarousel
          marketName={marketName} vendorCount={0} loading={false}
          search={search} onSearchChange={setSearch}
          onBack={() => navigation.goBack()}
        />
        <View style={styles.centered}>
          <View style={styles.errorIconWrap}>
            <Ionicons name="alert-circle-outline" size={36} color="#E65100" />
          </View>
          <Text style={styles.errorTitle}>Couldn't load vendors</Text>
          <Text style={styles.errorSub}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); fetchVendors(); }}>
            <Ionicons name="refresh-outline" size={16} color="#fff" />
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>

      {/* ══════════ HERO ══════════ */}
      <HeroCarousel
        marketName={marketName}
        vendorCount={vendors.length}
        loading={loading}
        search={search}
        onSearchChange={setSearch}
        onBack={() => navigation.goBack()}
      />

      {/* ══════════ CATEGORY FILTER BAR ══════════ */}
      {!loading && vendors.length > 0 && (
        <CategoryFilterBar
          vendors={vendors}
          activeCategory={categoryFilter}
          onSelect={setCategoryFilter}
        />
      )}

      {/* ══════════ TOOLBAR ══════════ */}
      {!loading && (
        <View style={styles.toolbar}>
          <View style={styles.toolbarLeft}>
            <Text style={styles.toolbarCount}>
              <Text style={styles.toolbarCountNum}>{filteredVendors.length}</Text>
              <Text style={styles.toolbarCountOf}> of {vendors.length} vendor{vendors.length !== 1 ? 's' : ''}</Text>
            </Text>
            {hasActiveFilters && (
              <TouchableOpacity
                style={styles.clearFiltersBtn}
                onPress={() => { setSearch(''); setCategoryFilter(null); }}
              >
                <Ionicons name="close" size={11} color="#E65100" />
                <Text style={styles.clearFiltersText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.toolbarRight}>
            <TouchableOpacity
              style={styles.toolbarSortBtn}
              onPress={() => setSortModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="swap-vertical-outline" size={14} color="#2E7D32" />
              <Text style={styles.toolbarSortText}>{activeSortLabel.split(' ')[0]}</Text>
              <Ionicons name="chevron-down" size={12} color="#2E7D32" />
            </TouchableOpacity>
            <View style={styles.viewModeGroup}>
              <TouchableOpacity
                style={[styles.viewModeBtn, viewMode === 'grid' && styles.viewModeBtnOn]}
                onPress={() => setViewMode('grid')}
              >
                <Ionicons name="grid" size={15} color={viewMode === 'grid' ? '#2E7D32' : '#BDBDBD'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.viewModeBtn, viewMode === 'list' && styles.viewModeBtnOn]}
                onPress={() => setViewMode('list')}
              >
                <Ionicons name="list" size={15} color={viewMode === 'list' ? '#2E7D32' : '#BDBDBD'} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* ══════════ LOADING ══════════ */}
      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Loading vendors…</Text>
        </View>
      ) : (
        /* ══════════ VENDOR LIST / GRID ══════════ */
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2E7D32" />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {filteredVendors.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="storefront-outline" size={38} color="#A5D6A7" />
              </View>
              <Text style={styles.emptyTitle}>No vendors found</Text>
              <Text style={styles.emptySub}>
                {categoryFilter
                  ? `No vendors sell "${categoryFilter}" in this market.`
                  : search
                  ? `No results for "${search}" — try a different keyword.`
                  : "This market doesn't have any vendors yet."}
              </Text>
              {hasActiveFilters && (
                <TouchableOpacity
                  style={styles.clearSearchBtn}
                  onPress={() => { setSearch(''); setCategoryFilter(null); }}
                >
                  <Text style={styles.clearSearchText}>Clear Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : viewMode === 'list' ? (
            <View style={styles.listWrap}>
              {filteredVendors.map(vendor => (
                <VendorListItem key={vendor._id} vendor={vendor} onPress={handleVendorPress} />
              ))}
            </View>
          ) : (
            <View style={styles.gridWrap}>
              {filteredVendors.map(vendor => (
                <VendorGridCard key={vendor._id} vendor={vendor} onPress={handleVendorPress} />
              ))}
            </View>
          )}
          <View style={{ height: 50 }} />
        </ScrollView>
      )}

      {/* ══════════ SORT MODAL ══════════ */}
      {sortModalVisible && (
        <View style={styles.sortModalOverlay}>
          <TouchableOpacity style={styles.sortBackdrop} activeOpacity={1} onPress={() => setSortModalVisible(false)} />
          <View style={styles.sortSheet}>
            <View style={styles.sortHandle} />
            <Text style={styles.sortSheetTitle}>Sort vendors</Text>
            {sortOptions.map(option => {
              const isActive = sortBy === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[styles.sortRow, isActive && styles.sortRowActive]}
                  onPress={() => { setSortBy(option.id); setSortModalVisible(false); }}
                  activeOpacity={0.75}
                >
                  <View style={[styles.sortIconWrap, isActive && styles.sortIconWrapActive]}>
                    <Ionicons name={option.icon} size={17} color={isActive ? '#2E7D32' : '#9E9E9E'} />
                  </View>
                  <Text style={[styles.sortRowText, isActive && styles.sortRowTextActive]}>
                    {option.label}
                  </Text>
                  {isActive && <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────
// VENDOR GRID CARD
// ─────────────────────────────────────────────
const VendorGridCard = ({ vendor, onPress }) => {
  const { profile_image, name = 'Unknown Vendor', location = 'Accra',
          market_name, products, is_verified, categories = [] } = vendor;
  const productCount = products?.length || 0;

  return (
    <TouchableOpacity style={styles.gridCard} onPress={() => onPress(vendor)} activeOpacity={0.85}>
      <View style={styles.gridImageWrap}>
        {profile_image ? (
          <Image source={{ uri: profile_image }} style={styles.gridImage} />
        ) : (
          <View style={styles.gridImagePlaceholder}>
            <Text style={styles.gridInitial}>{name.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        {is_verified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#2E7D32" />
          </View>
        )}
        <View style={[styles.statusChip, is_verified ? styles.statusChipVerified : styles.statusChipPending]}>
          <View style={[styles.statusDot, is_verified ? styles.dotGreen : styles.dotOrange]} />
          <Text style={[styles.statusChipText, is_verified ? styles.statusChipTextVerified : styles.statusChipTextPending]}>
            {is_verified ? 'Verified' : 'Pending'}
          </Text>
        </View>
      </View>
      <View style={styles.gridInfo}>
        <Text style={styles.gridName} numberOfLines={2}>{name}</Text>
        <View style={styles.gridLocationRow}>
          <Ionicons name="location-outline" size={11} color="#9E9E9E" />
          <Text style={styles.gridLocation} numberOfLines={1}>{location}</Text>
        </View>
        {/* Category pills on the card */}
        {categories.length > 0 && (
          <View style={styles.gridCategoryRow}>
            {categories.slice(0, 2).map(cat => {
              const meta = CATEGORY_META[cat] || { emoji: '🏷', color: '#555', bg: '#F5F5F5' };
              return (
                <View key={cat} style={[styles.gridCatPill, { backgroundColor: meta.bg }]}>
                  <Text style={[styles.gridCatPillText, { color: meta.color }]}>
                    {meta.emoji} {cat.split(' ')[0]}
                  </Text>
                </View>
              );
            })}
            {categories.length > 2 && (
              <View style={[styles.gridCatPill, { backgroundColor: '#F5F5F5' }]}>
                <Text style={[styles.gridCatPillText, { color: '#9E9E9E' }]}>+{categories.length - 2}</Text>
              </View>
            )}
          </View>
        )}
        <View style={styles.gridFooter}>
          {market_name && (
            <View style={styles.marketPill}>
              <Text style={styles.marketPillText}>{market_name.replace(' Market', '')}</Text>
            </View>
          )}
          <Text style={styles.productCount}>{productCount} product{productCount !== 1 ? 's' : ''}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─────────────────────────────────────────────
// VENDOR LIST ITEM
// ─────────────────────────────────────────────
const VendorListItem = ({ vendor, onPress }) => {
  const { profile_image, name = 'Unknown Vendor', location = 'Accra',
          market_name, products, is_verified, categories = [] } = vendor;
  const productCount = products?.length || 0;

  return (
    <TouchableOpacity style={styles.listCard} onPress={() => onPress(vendor)} activeOpacity={0.85}>
      <View style={[styles.listStripe, { backgroundColor: is_verified ? '#4CAF50' : '#FF9800' }]} />
      <View style={styles.listImageWrap}>
        {profile_image ? (
          <Image source={{ uri: profile_image }} style={styles.listImage} />
        ) : (
          <View style={styles.listImagePlaceholder}>
            <Text style={styles.listInitial}>{name.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        {is_verified && (
          <View style={styles.listVerifiedBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#2E7D32" />
          </View>
        )}
      </View>
      <View style={styles.listContent}>
        <View style={styles.listTopRow}>
          <Text style={styles.listName} numberOfLines={1}>{name}</Text>
          <View style={[styles.listStatusChip, is_verified ? styles.listStatusVerified : styles.listStatusPending]}>
            <Text style={[styles.listStatusText, is_verified ? styles.listStatusTextVerified : styles.listStatusTextPending]}>
              {is_verified ? 'Verified' : 'Pending'}
            </Text>
          </View>
        </View>
        <View style={styles.listLocationRow}>
          <Ionicons name="location-outline" size={12} color="#9E9E9E" />
          <Text style={styles.listLocation} numberOfLines={1}>{location}</Text>
        </View>
        {/* Category pills on the list card */}
        {categories.length > 0 && (
          <View style={styles.listCategoryRow}>
            {categories.slice(0, 3).map(cat => {
              const meta = CATEGORY_META[cat] || { emoji: '🏷', color: '#555', bg: '#F5F5F5' };
              return (
                <View key={cat} style={[styles.gridCatPill, { backgroundColor: meta.bg }]}>
                  <Text style={[styles.gridCatPillText, { color: meta.color }]}>
                    {meta.emoji} {cat.split(' ')[0]}
                  </Text>
                </View>
              );
            })}
            {categories.length > 3 && (
              <View style={[styles.gridCatPill, { backgroundColor: '#F5F5F5' }]}>
                <Text style={[styles.gridCatPillText, { color: '#9E9E9E' }]}>+{categories.length - 3}</Text>
              </View>
            )}
          </View>
        )}
        <View style={styles.listBottomRow}>
          {market_name && (
            <View style={styles.marketPill}>
              <Text style={styles.marketPillText}>{market_name.replace(' Market', '')}</Text>
            </View>
          )}
          <Text style={styles.productCount}>{productCount} product{productCount !== 1 ? 's' : ''}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#BDBDBD" style={{ marginRight: 12 }} />
    </TouchableOpacity>
  );
};

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#F4F6F4' },
  scrollContent: { paddingTop: 12, paddingBottom: 20 },
  centered:      { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadingText:   { marginTop: 14, fontSize: 15, color: '#757575', fontWeight: '500' },

  // ── HERO (shorter) ──
  heroWrap: { height: HERO_HEIGHT, position: 'relative', overflow: 'hidden', backgroundColor: '#1B5E20' },
  heroSlide: { width, height: HERO_HEIGHT, position: 'relative' },
  heroSlideImage: { width: '100%', height: '100%', position: 'absolute' },
  heroScrimTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 100, backgroundColor: 'rgba(0,0,0,0.4)' },
  heroScrimBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 },

  heroNav: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, zIndex: 10,
  },
  heroBackBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center',
  },
  heroTitleWrap: { flex: 1, alignItems: 'center' },
  heroTitle: {
    fontSize: 19, fontWeight: '800', color: '#fff', letterSpacing: 0.2,
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6,
  },
  heroCountBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, marginTop: 4,
  },
  heroCount: { fontSize: 11, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },

  heroProgressRow: {
    position: 'absolute', bottom: 54, left: 16, right: 16,
    flexDirection: 'row', gap: 5, zIndex: 10,
  },
  heroProgressTrack: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.28)', overflow: 'hidden' },
  heroProgressFill:  { height: '100%', borderRadius: 2, backgroundColor: '#fff' },

  heroSearchWrap: { position: 'absolute', bottom: 12, left: 16, right: 16, zIndex: 10 },
  heroSearchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 13,
    borderWidth: 1.5, borderColor: '#4CAF50',
    shadowColor: '#4CAF50', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18, shadowRadius: 10, elevation: 6,
  },
  heroSearchInput: { flex: 1, fontSize: 14, color: '#212121', paddingVertical: 11, paddingHorizontal: 10 },

  // ── CATEGORY FILTER BAR ──
  catBarWrap: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingVertical: 10,
  },
  catBarContent: { paddingHorizontal: 14, gap: 8, flexDirection: 'row', alignItems: 'center' },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5, borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
  },
  catChipActive: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  catChipEmoji:  { fontSize: 13 },
  catChipText:   { fontSize: 12, fontWeight: '700', color: '#424242' },
  catChipTextActive: { color: '#fff' },
  catChipBadge: {
    minWidth: 18, height: 18, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4,
  },
  catChipBadgeActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  catChipBadgeText:   { fontSize: 10, fontWeight: '800', color: '#424242' },

  // ── TOOLBAR ──
  toolbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  toolbarLeft:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toolbarCountNum:  { fontSize: 15, fontWeight: '800', color: '#1B5E20' },
  toolbarCountOf:   { fontSize: 13, color: '#9E9E9E', fontWeight: '400' },
  toolbarRight:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  toolbarSortBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#F1F8E9', paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1, borderColor: '#C8E6C9',
  },
  toolbarSortText:  { fontSize: 12, color: '#2E7D32', fontWeight: '700' },
  viewModeGroup:    { flexDirection: 'row', backgroundColor: '#F5F5F5', borderRadius: 10, padding: 3, gap: 2 },
  viewModeBtn:      { padding: 6, borderRadius: 8 },
  viewModeBtnOn: {
    backgroundColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 2, elevation: 2,
  },
  clearFiltersBtn:  { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FFF3E0', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 12, borderWidth: 1, borderColor: '#FFCCBC' },
  clearFiltersText: { fontSize: 11, fontWeight: '700', color: '#E65100' },

  // ── ERROR ──
  errorIconWrap: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#FFF3E0', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  errorTitle:    { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginBottom: 6 },
  errorSub:      { fontSize: 13, color: '#9E9E9E', textAlign: 'center', marginBottom: 20 },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#2E7D32', paddingHorizontal: 22, paddingVertical: 11, borderRadius: 22,
  },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // ── EMPTY ──
  emptyState:    { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 30 },
  emptyIconWrap: { width: 76, height: 76, borderRadius: 38, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyTitle:    { fontSize: 18, fontWeight: '700', color: '#424242', marginBottom: 6 },
  emptySub:      { fontSize: 14, color: '#9E9E9E', textAlign: 'center', lineHeight: 20 },
  clearSearchBtn:  { marginTop: 16, backgroundColor: '#E8F5E9', paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20 },
  clearSearchText: { fontSize: 13, fontWeight: '700', color: '#2E7D32' },

  // ── SHARED ──
  marketPill:     { backgroundColor: '#FFF3E0', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  marketPillText: { fontSize: 10, fontWeight: '600', color: '#E65100' },
  productCount:   { fontSize: 11, color: '#9E9E9E', fontWeight: '500' },
  statusDot:      { width: 5, height: 5, borderRadius: 3 },
  dotGreen:       { backgroundColor: '#2E7D32' },
  dotOrange:      { backgroundColor: '#E65100' },

  // ── GRID CARD ──
  gridWrap: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 10 },
  gridCard: {
    width: CARD_WIDTH, backgroundColor: '#fff',
    borderRadius: 18, overflow: 'hidden',
    shadowColor: '#1B5E20', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09, shadowRadius: 8, elevation: 4, marginBottom: 4,
  },
  gridImageWrap: { height: 120, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  gridImage:            { width: '100%', height: '100%' },
  gridImagePlaceholder: { width: '100%', height: '100%', backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  gridInitial:          { fontSize: 36, fontWeight: '800', color: '#2E7D32' },
  verifiedBadge: {
    position: 'absolute', top: 8, right: 8, backgroundColor: '#fff',
    borderRadius: 12, width: 24, height: 24, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.12, shadowRadius: 3, elevation: 2,
  },
  statusChip: { position: 'absolute', top: 8, left: 8, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  statusChipVerified: { backgroundColor: 'rgba(232,245,233,0.95)' },
  statusChipPending:  { backgroundColor: 'rgba(255,243,224,0.95)' },
  statusChipText:             { fontSize: 10, fontWeight: '700' },
  statusChipTextVerified:     { color: '#2E7D32' },
  statusChipTextPending:      { color: '#E65100' },
  gridInfo:        { padding: 10 },
  gridName:        { fontSize: 13, fontWeight: '700', color: '#1A1A1A', marginBottom: 4, lineHeight: 18 },
  gridLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 6 },
  gridLocation:    { fontSize: 11, color: '#9E9E9E', flexShrink: 1 },
  gridCategoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 6 },
  gridCatPill:     { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  gridCatPillText: { fontSize: 9, fontWeight: '700' },
  gridFooter:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  // ── LIST ITEM ──
  listWrap: { paddingHorizontal: 12, gap: 10 },
  listCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 18, overflow: 'hidden',
    shadowColor: '#1B5E20', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  listStripe:           { width: 4, alignSelf: 'stretch' },
  listImageWrap:        { width: 84, height: 84, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  listImage:            { width: '100%', height: '100%' },
  listImagePlaceholder: { width: '100%', height: '100%', backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  listInitial:          { fontSize: 30, fontWeight: '800', color: '#2E7D32' },
  listVerifiedBadge:    { position: 'absolute', top: 6, right: 6, backgroundColor: '#fff', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  listContent:          { flex: 1, padding: 10, justifyContent: 'space-between', gap: 3 },
  listTopRow:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  listName:             { fontSize: 14, fontWeight: '700', color: '#1A1A1A', flex: 1, marginRight: 8 },
  listStatusChip:           { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  listStatusVerified:       { backgroundColor: '#F1F8E9' },
  listStatusPending:        { backgroundColor: '#FFF3E0' },
  listStatusText:           { fontSize: 10, fontWeight: '700' },
  listStatusTextVerified:   { color: '#2E7D32' },
  listStatusTextPending:    { color: '#E65100' },
  listLocationRow:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  listLocation:         { fontSize: 12, color: '#9E9E9E', flexShrink: 1 },
  listCategoryRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  listBottomRow:        { flexDirection: 'row', alignItems: 'center', gap: 10 },

  // ── SORT MODAL ──
  sortModalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 },
  sortBackdrop:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sortSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 26, borderTopRightRadius: 26,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 16,
  },
  sortHandle:     { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0', alignSelf: 'center', marginBottom: 20 },
  sortSheetTitle: { fontSize: 17, fontWeight: '800', color: '#1B5E20', marginBottom: 14 },
  sortRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 14, marginBottom: 6, gap: 12 },
  sortRowActive:      { backgroundColor: '#F1F8E9' },
  sortIconWrap:       { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
  sortIconWrapActive: { backgroundColor: '#E8F5E9' },
  sortRowText:        { flex: 1, fontSize: 15, color: '#424242', fontWeight: '500' },
  sortRowTextActive:  { color: '#1B5E20', fontWeight: '700' },
});

export default MarketDetailScreen;