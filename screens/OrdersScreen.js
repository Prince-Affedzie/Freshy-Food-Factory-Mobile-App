// src/screens/OrdersScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Alert,
  Dimensions,
  ScrollView,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { getMyOrder } from '../apis/orderApi';

const { width } = Dimensions.get('window');

// ─── Avatar component — shows photo or initials ───────────────────────────────
const Avatar = ({ user, size = 52 }) => {
  const initials = user
    ? `${(user.firstName || user.name || '?')[0]}${(user.lastName || '')[0] || ''}`.toUpperCase()
    : '?';

  if (user?.avatar || user?.profileImage) {
    return (
      <Image
        source={{ uri: user.avatar || user.profileImage }}
        style={[styles.avatarImg, { width: size, height: size, borderRadius: size / 2 }]}
      />
    );
  }
  return (
    <View style={[styles.avatarInitials, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.36 }]}>{initials}</Text>
    </View>
  );
};

// ─── Stat bubble in the hero ──────────────────────────────────────────────────
const HeroStat = ({ value, label, color = '#fff' }) => (
  <View style={styles.heroStat}>
    <Text style={[styles.heroStatValue, { color }]}>{value}</Text>
    <Text style={styles.heroStatLabel}>{label}</Text>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
const OrdersScreen = () => {
  const navigation = useNavigation();
  const { user, token, isAuthenticated } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0, pending: 0, delivered: 0, cancelled: 0, processing: 0, out_for_delivery: 0,
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  const filters = [
    { id: 'all',             label: 'All',          icon: 'apps-outline',              color: '#2E7D32' },
    { id: 'pending',         label: 'Pending',       icon: 'time-outline',              color: '#F57F17' },
    { id: 'processing',      label: 'Processing',    icon: 'sync-outline',              color: '#1565C0' },
    { id: 'out_for_delivery',label: 'On the way',    icon: 'bicycle-outline',           color: '#6A1B9A' },
    { id: 'delivered',       label: 'Delivered',     icon: 'checkmark-circle-outline',  color: '#2E7D32' },
    { id: 'cancelled',       label: 'Cancelled',     icon: 'close-circle-outline',      color: '#C62828' },
  ];

  const STATUS_META = {
    'Pending':          { color: '#F57F17', bg: '#FFF8E1', icon: 'time-outline' },
    'Processing':       { color: '#1565C0', bg: '#E3F2FD', icon: 'sync-outline' },
    'Out for Delivery': { color: '#6A1B9A', bg: '#F3E5F5', icon: 'bicycle-outline' },
    'Delivered':        { color: '#2E7D32', bg: '#E8F5E9', icon: 'checkmark-circle-outline' },
    'Cancelled':        { color: '#C62828', bg: '#FFEBEE', icon: 'close-circle-outline' },
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 11, useNativeDriver: true }),
    ]).start();
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await getMyOrder();
      if (response.data && response.status === 200) {
        const data = response.data.data || response.data.orders || [];
        setOrders(data);
        calculateStats(data);
        animateIn();
      } else {
        Alert.alert('Error', 'Failed to load orders. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('Error', 'Failed to load orders. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = (list) => {
    const s = { total: list.length, pending: 0, delivered: 0, cancelled: 0, processing: 0, out_for_delivery: 0 };
    list.forEach(o => {
      const st = (o.status || 'Pending').toLowerCase().replace(/ /g, '_');
      if (st === 'delivered') s.delivered++;
      else if (st === 'cancelled') s.cancelled++;
      else if (st === 'processing') s.processing++;
      else if (st === 'out_for_delivery') s.out_for_delivery++;
      else s.pending++;
    });
    setStats(s);
  };

  const onRefresh = async () => { setRefreshing(true); await fetchOrders(); };

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter(o => {
        const st = (o.status || 'Pending').toLowerCase().replace(/ /g, '_');
        if (filter === 'pending') return ['pending', 'processing', 'out_for_delivery'].includes(st);
        return st === filter;
      });

  const getFilterCount = (id) => {
    if (id === 'all') return stats.total;
    if (id === 'pending') return stats.pending + stats.processing + stats.out_for_delivery;
    return stats[id] || 0;
  };

  const formatDate = (ds) => {
    try {
      const d = new Date(ds), now = new Date();
      const days = Math.ceil(Math.abs(now - d) / 86400000);
      if (days === 0) return `Today · ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
      if (days === 1) return `Yesterday · ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
      if (days < 7) return `${days} days ago`;
      return d.toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return 'Invalid date'; }
  };

  const getStatusText = (status) => {
    const map = { pending: 'Pending', processing: 'Processing', out_for_delivery: 'Out for Delivery', delivered: 'Delivered', cancelled: 'Cancelled' };
    return map[(status || 'Pending').toLowerCase().replace(/ /g, '_')] || 'Pending';
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleReorder = (order) => {
    Alert.alert(
      'Reorder Items',
      'Feature Coming Soon',
      [
        { text: 'Okay', style: 'cancel' },
        
      ]
    );
  };

  // ── NOT AUTHENTICATED ───────────────────────────────────────────────────────
  if (!isAuthenticated && !loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar backgroundColor="#1B5E20" barStyle="light-content" />
        <View style={styles.authHero}>
          <TouchableOpacity style={styles.heroBack} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.authHeroInner}>
            <View style={styles.authHeroIcon}>
              <Ionicons name="bag-handle-outline" size={32} color="#A5D6A7" />
            </View>
            <Text style={styles.authHeroTitle}>My Orders</Text>
            <Text style={styles.authHeroSub}>Sign in to view your order history</Text>
          </View>
        </View>
        <View style={styles.authBody}>
          <View style={styles.authCard}>
            <Ionicons name="lock-closed-outline" size={40} color="#C8E6C9" style={{ marginBottom: 16 }} />
            <Text style={styles.authCardTitle}>Login Required</Text>
            <Text style={styles.authCardSub}>
              Sign in to track your deliveries, view past orders and manage your account.
            </Text>
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.85}
            >
              <Ionicons name="log-in-outline" size={18} color="#fff" />
              <Text style={styles.loginBtnText}>Sign In to Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── LOADING ─────────────────────────────────────────────────────────────────
  if (loading && !refreshing && orders.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar backgroundColor="#1B5E20" barStyle="light-content" />
        <View style={styles.loadingHero}>
          <TouchableOpacity style={styles.heroBack} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.loadingHeroInner}>
            <Avatar user={user} size={52} />
            <Text style={styles.loadingHeroTitle}>My Orders</Text>
          </View>
        </View>
        <View style={styles.loadingBody}>
          <View style={styles.loadingIconWrap}>
            <ActivityIndicator size="large" color="#4CAF50" />
          </View>
          <Text style={styles.loadingTitle}>Loading your orders</Text>
          <Text style={styles.loadingSub}>Fetching your latest order history…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── HERO HEADER ─────────────────────────────────────────────────────────────
  const renderHero = () => {
    const firstName = user?.firstName || user?.name?.split(' ')[0] || 'there';
    const activeCount = stats.pending + stats.processing + stats.out_for_delivery;

    return (
      <View style={styles.hero}>
        {/* Two-layer scrim for depth */}
        <View style={styles.heroPatternOverlay} />

        {/* Nav row */}
        <View style={styles.heroNav}>
          <TouchableOpacity style={styles.heroBack} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.heroNavRight}>
            <TouchableOpacity style={styles.heroIconBtn} onPress={onRefresh}>
              <Ionicons name="refresh-outline" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.heroIconBtn}
              onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
            >
              <Ionicons name="home-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* User identity row */}
        <View style={styles.heroIdentity}>
          <View style={styles.heroAvatarWrap}>
            <Avatar user={user} size={56} />
            {/* Online dot */}
            <View style={styles.heroOnlineDot} />
          </View>

          <View style={styles.heroIdentityText}>
            <Text style={styles.heroGreeting}>{getGreeting()},</Text>
            <Text style={styles.heroName} numberOfLines={1}>{firstName} 👋</Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.heroStatsRow}>
          <View style={styles.heroStatCard}>
            <HeroStat value={stats.total} label="Total Orders" />
          </View>
          <View style={styles.heroStatSep} />
          <View style={styles.heroStatCard}>
            <HeroStat value={activeCount} label="Active" color={activeCount > 0 ? '#FFD54F' : '#fff'} />
          </View>
          <View style={styles.heroStatSep} />
          <View style={styles.heroStatCard}>
            <HeroStat value={stats.delivered} label="Delivered" color="#A5D6A7" />
          </View>
        </View>

        {/* Active order nudge */}
        {activeCount > 0 && (
          <View style={styles.heroNudge}>
            <View style={styles.heroNudgeDot} />
            <Text style={styles.heroNudgeText}>
              You have {activeCount} active order{activeCount > 1 ? 's' : ''} in progress
            </Text>
            <Ionicons name="chevron-forward" size={14} color="#FFD54F" />
          </View>
        )}
      </View>
    );
  };

  // ── FILTER CHIPS ────────────────────────────────────────────────────────────
  const renderFilters = () => (
    <View style={styles.filtersWrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersScroll}
      >
        {filters.map(f => {
          const active = filter === f.id;
          const count = getFilterCount(f.id);
          return (
            <TouchableOpacity
              key={f.id}
              style={[styles.filterChip, active && { backgroundColor: f.color, borderColor: f.color }]}
              onPress={() => setFilter(f.id)}
              activeOpacity={0.75}
            >
              <Ionicons name={f.icon} size={14} color={active ? '#fff' : '#666'} />
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                {f.label}
              </Text>
              {count > 0 && (
                <View style={[styles.filterBadge, active ? styles.filterBadgeActive : styles.filterBadgeInactive]}>
                  <Text style={[styles.filterBadgeText, active && { color: '#fff' }]}>
                    {count > 99 ? '99+' : count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  // ── RESULTS ROW ─────────────────────────────────────────────────────────────
  const renderResultsRow = () => (
    <View style={styles.resultsRow}>
      <Text style={styles.resultsText}>
        {filteredOrders.length} {filter !== 'all' ? filter.replace('_', ' ') : ''} order{filteredOrders.length !== 1 ? 's' : ''}
      </Text>
      {filter !== 'all' && (
        <TouchableOpacity style={styles.clearBtn} onPress={() => setFilter('all')}>
          <Ionicons name="close-circle" size={15} color="#9E9E9E" />
          <Text style={styles.clearBtnText}>Clear filter</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // ── ORDER CARD ──────────────────────────────────────────────────────────────
  const renderOrderItem = ({ item, index }) => {
    const statusText = getStatusText(item.status);
    const meta = STATUS_META[statusText] || STATUS_META['Pending'];
    const normalizedStatus = (item.status || 'Pending').toLowerCase().replace(/ /g, '_');
    const itemCount = item.itemsCount || item.orderItems?.length || 0;
    const totalPrice = item.totalPrice || item.orderTotal || 0;
    const firstItem = item.orderItems?.[0] || item.items?.[0];
    const firstImg = firstItem?.image || firstItem?.product?.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80';

    return (
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <TouchableOpacity
          style={styles.orderCard}
          onPress={() => navigation.navigate('OrderDetail', { orderId: item.id || item._id })}
          activeOpacity={0.92}
        >
          {/* Status accent bar */}
          <View style={[styles.orderAccent, { backgroundColor: meta.color }]} />

          <View style={styles.orderCardInner}>
            {/* ── Header row ── */}
            <View style={styles.orderCardHeader}>
              <View style={styles.orderIdRow}>
                <View style={[styles.orderIdIcon, { backgroundColor: meta.bg }]}>
                  <Ionicons name="receipt-outline" size={14} color={meta.color} />
                </View>
                <View>
                  <Text style={styles.orderIdText}>
                    #{item.orderNumber || (item._id || '').substring(0, 8).toUpperCase()}
                  </Text>
                  <Text style={styles.orderDateText}>
                    {item.createdAt || item.orderDate}
                  </Text>
                </View>
              </View>

              <View style={[styles.statusPill, { backgroundColor: meta.bg }]}>
                <Ionicons name={meta.icon} size={11} color={meta.color} />
                <Text style={[styles.statusPillText, { color: meta.color }]}>{statusText}</Text>
              </View>
            </View>

            {/* ── Preview row ── */}
            <View style={styles.orderPreviewRow}>
              {/* Product image + extra count */}
              <View style={styles.previewImageWrap}>
                <Image source={{ uri: firstImg }} style={styles.previewImage} />
                {itemCount > 1 && (
                  <View style={styles.previewMore}>
                    <Text style={styles.previewMoreText}>+{itemCount - 1}</Text>
                  </View>
                )}
              </View>

              {/* Details */}
              <View style={styles.previewDetails}>
                <View style={styles.previewItemCountRow}>
                  <Ionicons name="layers-outline" size={13} color="#9E9E9E" />
                  <Text style={styles.previewItemCount}>
                    {itemCount} item{itemCount !== 1 ? 's' : ''}
                  </Text>
                </View>
                <Text style={styles.previewTotal}>
                  GH₵ {totalPrice.toFixed ? totalPrice.toFixed(2) : totalPrice}
                </Text>
                {item.deliverySchedule?.preferredDay && (
                  <View style={styles.previewDelivery}>
                    <Ionicons name="calendar-outline" size={12} color="#4CAF50" />
                    <Text style={styles.previewDeliveryText}>
                      {item.deliverySchedule.preferredDay}
                    </Text>
                  </View>
                )}
              </View>

              {/* Quick action icon button */}
              <TouchableOpacity
                style={[styles.quickAction, { backgroundColor: meta.bg }]}
                onPress={() => navigation.navigate('OrderDetail', { orderId: item.id || item._id })}
              >
                <Ionicons
                  name={normalizedStatus === 'delivered' ? 'receipt-outline' : 'navigate-outline'}
                  size={18}
                  color={meta.color}
                />
              </TouchableOpacity>
            </View>

            {/* ── Actions row ── */}
            <View style={styles.orderActionsRow}>
              {normalizedStatus === 'delivered' ? (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnPrimary]}
                  onPress={() => handleReorder(item)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="refresh-outline" size={14} color="#fff" />
                  <Text style={styles.actionBtnPrimaryText}>Reorder</Text>
                </TouchableOpacity>
              ) : normalizedStatus !== 'cancelled' ? (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnTrack]}
                  onPress={() => navigation.navigate('OrderDetail', { orderId: item.id || item._id })}
                  activeOpacity={0.8}
                >
                  <Ionicons name="locate-outline" size={14} color="#1565C0" />
                  <Text style={styles.actionBtnTrackText}>Track Order</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.actionBtnPlaceholder} />
              )}

              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnGhost]}
                onPress={() => navigation.navigate('OrderDetail', { orderId: item.id || item._id })}
                activeOpacity={0.8}
              >
                <Text style={styles.actionBtnGhostText}>View Details</Text>
                <Ionicons name="chevron-forward" size={14} color="#9E9E9E" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // ── EMPTY ────────────────────────────────────────────────────────────────────
  const renderEmpty = () => (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIconBg}>
        <Ionicons name="bag-handle-outline" size={38} color="#A5D6A7" />
      </View>
      <Text style={styles.emptyTitle}>
        {filter === 'all' ? 'No orders yet' : `No ${filter.replace('_', ' ')} orders`}
      </Text>
      <Text style={styles.emptySub}>
        {filter === 'all'
          ? "You haven't placed any orders yet. Start shopping to see them here!"
          : `You don't have any ${filter.replace('_', ' ')} orders at the moment.`}
      </Text>
      {filter !== 'all' ? (
        <TouchableOpacity style={styles.emptyBtn} onPress={() => setFilter('all')}>
          <Ionicons name="apps-outline" size={16} color="#fff" />
          <Text style={styles.emptyBtnText}>View All Orders</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('Products')}>
          <Ionicons name="storefront-outline" size={16} color="#fff" />
          <Text style={styles.emptyBtnText}>Start Shopping</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar backgroundColor="#1B5E20" barStyle="light-content" />

      <FlatList
        data={filteredOrders}
        renderItem={renderOrderItem}
        keyExtractor={item => item.id || item._id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4CAF50']}
            tintColor="#4CAF50"
          />
        }
        ListHeaderComponent={
          <>
            {renderHero()}
            {renderFilters()}
            {renderResultsRow()}
          </>
        }
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F4' },
  listContent: { flexGrow: 1, paddingBottom: 32 },

  // ── AVATAR ──────────────────────────────────────────────────────────────────
  avatarImg: {
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarInitials: {
    backgroundColor: '#388E3C',
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', letterSpacing: 0.5 },

  // ── HERO ────────────────────────────────────────────────────────────────────
  hero: {
     backgroundColor: '#2E7D32',
     borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingBottom: 24,
    position: 'relative',
    overflow: 'hidden',
    marginHorizontal: 2,
  },
  heroPatternOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  heroNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  heroBack: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  heroNavRight: { flexDirection: 'row', gap: 8 },
  heroIconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },

  // Identity
  heroIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 22,
    gap: 14,
  },
  heroAvatarWrap: { position: 'relative' },
  heroOnlineDot: {
    position: 'absolute', bottom: 1, right: 1,
    width: 13, height: 13, borderRadius: 7,
    backgroundColor: '#69F0AE',
    borderWidth: 2, borderColor: '#1B5E20',
  },
  heroIdentityText: { flex: 1 },
  heroGreeting: { fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: '500', marginBottom: 1 },
  heroName: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: 0.2 },

  // Stats
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  heroStatCard: { flex: 1, alignItems: 'center' },
  heroStatSep: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.2)' },
  heroStat: { alignItems: 'center' },
  heroStatValue: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 2 },
  heroStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },

  // Nudge
  heroNudge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: 'rgba(255,213,79,0.12)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,213,79,0.25)',
  },
  heroNudgeDot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: '#FFD54F',
  },
  heroNudgeText: { flex: 1, fontSize: 12, color: '#FFD54F', fontWeight: '600' },

  // ── AUTH / LOADING STATES ────────────────────────────────────────────────────
  authHero: {
    backgroundColor: '#1B5E20',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 32,
  },
  authHeroInner: { alignItems: 'center', paddingTop: 20, gap: 10 },
  authHeroIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  authHeroTitle: { fontSize: 26, fontWeight: '800', color: '#fff' },
  authHeroSub: { fontSize: 14, color: 'rgba(255,255,255,0.65)' },
  authBody: { flex: 1, padding: 20, justifyContent: 'center' },
  authCard: {
    backgroundColor: '#fff', borderRadius: 20,
    padding: 28, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  authCardTitle: { fontSize: 20, fontWeight: '800', color: '#1B5E20', marginBottom: 8 },
  authCardSub: {
    fontSize: 14, color: '#9E9E9E', textAlign: 'center',
    lineHeight: 20, marginBottom: 24,
  },
  loginBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#2E7D32', paddingVertical: 14, paddingHorizontal: 28,
    borderRadius: 14, gap: 8,
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  loginBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  loadingHero: {
    backgroundColor: '#1B5E20',
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 24,
  },
  loadingHeroInner: { alignItems: 'center', paddingTop: 16, gap: 10 },
  loadingHeroTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  loadingBody: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#F1F8E9',
    justifyContent: 'center', alignItems: 'center', marginBottom: 18,
  },
  loadingTitle: { fontSize: 18, fontWeight: '800', color: '#1B5E20', marginBottom: 6 },
  loadingSub: { fontSize: 13, color: '#9E9E9E', textAlign: 'center' },

  // ── FILTERS ──────────────────────────────────────────────────────────────────
  filtersWrap: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  filtersScroll: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
    flexDirection: 'row',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    backgroundColor: '#F5F5F5',
    gap: 5,
  },
  filterChipText: { fontSize: 13, color: '#666', fontWeight: '600' },
  filterChipTextActive: { color: '#fff' },
  filterBadge: {
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 20,
    alignItems: 'center',
  },
  filterBadgeActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  filterBadgeInactive: { backgroundColor: '#E0E0E0' },
  filterBadgeText: { fontSize: 10, fontWeight: '800', color: '#666' },

  // ── RESULTS ROW ──────────────────────────────────────────────────────────────
  resultsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 10,
  },
  resultsText: { fontSize: 13, color: '#9E9E9E', fontWeight: '500' },
  clearBtn: {
    flexDirection: 'row', alignItems: 'center',
    gap: 4, backgroundColor: '#F5F5F5',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14,
  },
  clearBtnText: { fontSize: 12, color: '#9E9E9E', fontWeight: '600' },

  // ── ORDER CARD ───────────────────────────────────────────────────────────────
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginHorizontal: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
  },
  orderAccent: {
    height: 3.5,
    width: '100%',
  },
  orderCardInner: { padding: 16 },

  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  orderIdRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  orderIdIcon: {
    width: 34, height: 34, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center',
  },
  orderIdText: { fontSize: 14, fontWeight: '700', color: '#212121' },
  orderDateText: { fontSize: 11, color: '#9E9E9E', marginTop: 2 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, gap: 4,
  },
  statusPillText: { fontSize: 11, fontWeight: '700' },

  orderPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  previewImageWrap: { position: 'relative' },
  previewImage: {
    width: 72, height: 72, borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  previewMore: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center', alignItems: 'center',
  },
  previewMoreText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  previewDetails: { flex: 1 },
  previewItemCountRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  previewItemCount: { fontSize: 12, color: '#9E9E9E', fontWeight: '500' },
  previewTotal: { fontSize: 22, fontWeight: '800', color: '#1B5E20', marginBottom: 4 },
  previewDelivery: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  previewDeliveryText: { fontSize: 12, color: '#4CAF50', fontWeight: '600' },
  quickAction: {
    width: 46, height: 46, borderRadius: 23,
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },

  orderActionsRow: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 10,
    borderRadius: 10, gap: 5,
  },
  actionBtnPrimary: {
    backgroundColor: '#2E7D32',
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 5, elevation: 3,
  },
  actionBtnPrimaryText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  actionBtnTrack: { backgroundColor: '#E3F2FD' },
  actionBtnTrackText: { color: '#1565C0', fontSize: 13, fontWeight: '700' },
  actionBtnGhost: {
    backgroundColor: '#F8F8F8',
    borderWidth: 1, borderColor: '#EEEEEE',
  },
  actionBtnGhostText: { color: '#757575', fontSize: 13, fontWeight: '600' },
  actionBtnPlaceholder: { flex: 1 },

  // ── EMPTY ────────────────────────────────────────────────────────────────────
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 48, paddingHorizontal: 40, paddingBottom: 32,
  },
  emptyIconBg: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#F1F8E9',
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#1B5E20', marginBottom: 8, textAlign: 'center' },
  emptySub: {
    fontSize: 14, color: '#9E9E9E', textAlign: 'center',
    lineHeight: 21, marginBottom: 28,
  },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#2E7D32', paddingVertical: 13, paddingHorizontal: 24,
    borderRadius: 13, gap: 8,
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  emptyBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

export default OrdersScreen;