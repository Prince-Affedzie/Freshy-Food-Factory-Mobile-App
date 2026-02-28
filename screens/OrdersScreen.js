// src/screens/OrdersScreen.js
import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { getMyOrder } from '../apis/orderApi';

const { width } = Dimensions.get('window');

const OrdersScreen = () => {
  const navigation = useNavigation();
  const { user, token, isAuthenticated } = useAuth();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    delivered: 0,
    cancelled: 0,
  });

  const filters = [
    { id: 'all', label: 'All Orders', icon: 'receipt-outline', color: '#4CAF50' },
    { id: 'pending', label: 'Pending', icon: 'time-outline', color: '#FF9800' },
    { id: 'processing', label: 'Processing', icon: 'sync-outline', color: '#2196F3' },
    { id: 'out_for_delivery', label: 'Out for Delivery', icon: 'bicycle-outline', color: '#9C27B0' },
    { id: 'delivered', label: 'Delivered', icon: 'checkmark-circle-outline', color: '#2E7D32' },
    { id: 'cancelled', label: 'Cancelled', icon: 'close-circle-outline', color: '#F44336' },
  ];

  const statusColors = {
    'Pending': '#FF9800',
    'Processing': '#2196F3',
    'Out for Delivery': '#9C27B0',
    'Delivered': '#2E7D32',
    'Cancelled': '#F44336',
  };

  const statusIcons = {
    'Pending': 'time-outline',
    'Processing': 'sync-outline',
    'Out for Delivery': 'bicycle-outline',
    'Delivered': 'checkmark-circle-outline',
    'Cancelled': 'close-circle-outline',
  };

  const statusBackgrounds = {
    'Pending': '#FFF3E0',
    'Processing': '#E3F2FD',
    'Out for Delivery': '#F3E5F5',
    'Delivered': '#E8F5E9',
    'Cancelled': '#FFEBEE',
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await getMyOrder();
      
      if (response.data && response.status === 200) {
        const ordersData = response.data.data || response.data.orders || [];
        setOrders(ordersData);
        calculateStats(ordersData);
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

  const calculateStats = (ordersList) => {
    const statsData = {
      total: ordersList.length,
      pending: 0,
      delivered: 0,
      cancelled: 0,
      processing: 0,
      out_for_delivery: 0,
    };

    ordersList.forEach(order => {
      const status = (order.status || 'Pending').toLowerCase();
      if (status === 'delivered') {
        statsData.delivered++;
      } else if (status === 'cancelled') {
        statsData.cancelled++;
      } else if (status === 'processing') {
        statsData.processing++;
      } else if (status === 'out_for_delivery') {
        statsData.out_for_delivery++;
      } else {
        statsData.pending++;
      }
    });

    setStats(statsData);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
  };

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(order => {
        const status = (order.status || 'Pending').toLowerCase();
        if (filter === 'pending') {
          return status === 'pending' || status === 'processing' || status === 'out_for_delivery';
        }
        return status === filter;
      });

  const getFilterCount = (filterId) => {
    if (filterId === 'all') return stats.total;
    if (filterId === 'pending') return stats.pending + stats.processing + stats.out_for_delivery;
    return stats[filterId] || 0;
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return `Today, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
      } else if (diffDays === 1) {
        return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
      } else if (diffDays < 7) {
        return `${diffDays} days ago`;
      }
      
      return date.toLocaleDateString('en-GH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getOrderStatusText = (status) => {
    const statusMap = {
      'pending': 'Pending',
      'processing': 'Processing',
      'out_for_delivery': 'Out for Delivery',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled',
    };
    return statusMap[status.toLowerCase()] || 'Pending';
  };

  const renderFilterChip = (filterItem) => {
    const isActive = filter === filterItem.id;
    const count = getFilterCount(filterItem.id);
    
    return (
      <TouchableOpacity
        key={filterItem.id}
        style={[
          styles.filterChip,
          isActive && { backgroundColor: filterItem.color, borderColor: filterItem.color },
          !isActive && styles.filterChipInactive
        ]}
        onPress={() => setFilter(filterItem.id)}
        activeOpacity={0.7}
      >
        <Ionicons 
          name={filterItem.icon} 
          size={16} 
          color={isActive ? '#FFFFFF' : '#666'} 
        />
        <Text style={[
          styles.filterChipText,
          isActive && styles.filterChipTextActive,
        ]}>
          {filterItem.label}
        </Text>
        {count > 0 && (
          <View style={[
            styles.filterChipBadge,
            isActive ? styles.filterChipBadgeActive : styles.filterChipBadgeInactive
          ]}>
            <Text style={[
              styles.filterChipBadgeText,
              isActive && styles.filterChipBadgeTextActive
            ]}>
              {count > 99 ? '99+' : count}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderOrderItem = ({ item }) => {
    const orderDate = item.createdAt || item.orderDate;
    const formattedDate = formatDate(orderDate);
    const status = item.status || 'Pending';
    const normalizedStatus = status.toLowerCase();
    const statusColor = statusColors[getOrderStatusText(status)] || '#FF9800';
    const statusIcon = statusIcons[getOrderStatusText(status)] || 'time-outline';
    const statusBg = statusBackgrounds[getOrderStatusText(status)] || '#FFF3E0';
    const itemCount = item.itemsCount || item.orderItems?.length || 0;
    const totalPrice = item.totalPrice || item.orderTotal || 0;

    const firstProduct = item.orderItems?.[0] || item.items?.[0];
    const firstProductImage = firstProduct?.image || 
                             firstProduct?.product?.image || 
                             'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80';

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => navigation.navigate('OrderDetail', { orderId: item.id || item._id })}
        activeOpacity={0.95}
      >
        {/* Order Header with Status Bar */}
        <View style={[styles.statusBar, { backgroundColor: statusColor }]} />
        
        <View style={styles.orderCardContent}>
          {/* Order Header */}
          <View style={styles.orderHeader}>
            <View style={styles.orderInfo}>
              <View style={styles.orderIdContainer}>
                <Ionicons name="receipt-outline" size={18} color="#666" />
                <Text style={styles.orderId}>
                  Order #{item.orderNumber || item._id?.substring(0, 8).toUpperCase()}
                </Text>
              </View>
              <View style={styles.orderDateContainer}>
                <Ionicons name="calendar-outline" size={14} color="#999" />
                <Text style={styles.orderDate}>{formattedDate}</Text>
              </View>
            </View>
            
            <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
              <Ionicons name={statusIcon} size={12} color={statusColor} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {getOrderStatusText(status)}
              </Text>
            </View>
          </View>

          {/* Order Preview */}
          <View style={styles.orderPreview}>
            <View style={styles.productImages}>
              <Image
                source={{ uri: firstProductImage }}
                style={styles.productImage}
                resizeMode="cover"
              />
              {itemCount > 1 && (
                <View style={styles.moreItemsBadge}>
                  <View style={[styles.moreItemsOverlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
                    <Text style={styles.moreItemsText}>+{itemCount - 1}</Text>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.orderDetails}>
              <Text style={styles.itemCount}>
                {itemCount} {itemCount === 1 ? 'Item' : 'Items'}
              </Text>
              <View style={styles.priceContainer}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.orderTotal}>
                  GH₵ {totalPrice.toFixed ? totalPrice.toFixed(2) : totalPrice}
                </Text>
              </View>
              {item.deliverySchedule?.preferredDay && (
                <View style={styles.deliveryInfoContainer}>
                  <Ionicons name="location-outline" size={12} color="#4CAF50" />
                  <Text style={styles.deliveryInfo}>
                    {item.deliverySchedule.preferredDay}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Order Actions */}
          <View style={styles.orderActions}>
            {normalizedStatus === 'delivered' ? (
              <TouchableOpacity
                style={[styles.actionButton, styles.reorderButton]}
                onPress={() => handleReorder(item)}
              >
                <View style={[styles.actionButtonContent, { backgroundColor: '#4CAF50' }]}>
                  <Ionicons name="refresh-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Reorder</Text>
                </View>
              </TouchableOpacity>
            ) : normalizedStatus === 'cancelled' ? null : (
              <TouchableOpacity
                style={[styles.actionButton, styles.trackButton]}
                onPress={() => navigation.navigate('OrderDetail', { orderId: item.id || item._id })}
              >
                <View style={[styles.actionButtonContent, { backgroundColor: '#2196F3' }]}>
                  <Ionicons name="locate-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Track Order</Text>
                </View>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.actionButton, styles.detailsButton]}
              onPress={() => navigation.navigate('OrderDetail', { orderId: item.id || item._id })}
            >
              <View style={styles.detailsButtonContent}>
                <Text style={styles.detailsButtonText}>View Details</Text>
                <Ionicons name="chevron-forward" size={16} color="#666" />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const handleReorder = (order) => {
    Alert.alert(
      'Reorder Items',
      'Would you like to add all items from this order to your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reorder', 
          onPress: () => {
            // TODO: Implement reorder logic
            Alert.alert('Success', 'Items added to your cart!');
          },
          style: 'default'
        }
      ]
    );
  };

  const renderListHeader = () => (
    <View style={styles.listHeader}>
      {/* Welcome Message */}
      <View style={styles.welcomeSection}>
        <View>
          <Text style={styles.welcomeTitle}>My Orders</Text>
          <Text style={styles.welcomeSubtitle}>
            {stats.total > 0 
              ? `You have ${stats.total} order${stats.total > 1 ? 's' : ''}`
              : 'No orders yet'
            }
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.filterMenuButton}
          onPress={() => setShowFilterDropdown(!showFilterDropdown)}
        >
          <Ionicons name="options-outline" size={20} color="#2E7D32" />
        </TouchableOpacity>
      </View>

      {/* Stats Overview Cards */}
      {stats.total > 0 && (
        <View style={styles.statsOverview}>
          <View style={styles.statCard}>
            {/*<View style={[styles.statIconContainer, { backgroundColor: '#4CAF50' }]}>
              <Ionicons name="bag-handle-outline" size={20} color="#FFFFFF" />
            </View>*/}
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            {/*<View style={[styles.statIconContainer, { backgroundColor: '#FF9800' }]}>
              <Ionicons name="time-outline" size={20} color="#FFFFFF" />
            </View>*/}
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{stats.pending + stats.processing + stats.out_for_delivery}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
          </View>

          <View style={styles.statCard}>
           {/* <View style={[styles.statIconContainer, { backgroundColor: '#2E7D32' }]}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
            </View>*/}
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{stats.delivered}</Text>
              <Text style={styles.statLabel}>Delivered</Text>
            </View>
          </View>
        </View>
      )}

      {/* Filter Chips - Horizontal Scroll */}
      <View style={styles.filterSection}>
        <Text style={styles.filterSectionTitle}>Filter by Status</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipsContainer}
        >
          {filters.map(renderFilterChip)}
        </ScrollView>
      </View>

      {/* Results Summary */}
      <View style={styles.resultsSummary}>
        <Text style={styles.resultsText}>
          Showing {filteredOrders.length} {filter !== 'all' ? filter : ''} order{filteredOrders.length !== 1 ? 's' : ''}
        </Text>
        {filter !== 'all' && (
          <TouchableOpacity 
            style={styles.clearFilter}
            onPress={() => setFilter('all')}
          >
            <Ionicons name="close-circle" size={16} color="#999" />
            <Text style={styles.clearFilterText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderListEmpty = () => (
    <View style={styles.listEmptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="bag-handle-outline" size={60} color="#BDBDBD" />
      </View>
      <Text style={styles.emptyTitle}>
        {filter === 'all' 
          ? "No orders yet" 
          : `No ${filter} orders`}
      </Text>
      <Text style={styles.emptyText}>
        {filter === 'all' 
          ? "Looks like you haven't placed any orders. Start shopping to see your orders here!"
          : `You don't have any ${filter} orders at the moment`}
      </Text>
      {filter !== 'all' ? (
        <TouchableOpacity
          style={styles.emptyActionButton}
          onPress={() => setFilter('all')}
        >
          <View style={[styles.emptyActionGradient, { backgroundColor: '#4CAF50' }]}>
            <Text style={styles.emptyActionText}>View All Orders</Text>
          </View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.emptyActionButton}
          onPress={() => navigation.navigate('Products')}
        >
          <View style={[styles.emptyActionGradient, { backgroundColor: '#4CAF50' }]}>
            <Ionicons name="cart-outline" size={18} color="#FFFFFF" />
            <Text style={styles.emptyActionText}>Start Shopping</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );

  if (!isAuthenticated && !loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="My Orders"
          showBack
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="receipt-outline" size={80} color="#BDBDBD" />
          </View>
          <Text style={styles.emptyTitle}>Please Login</Text>
          <Text style={styles.emptyText}>
            Login to view your order history and track deliveries
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <View style={[styles.loginGradient, { backgroundColor: '#2E7D32' }]}>
              <Ionicons name="log-in-outline" size={20} color="#FFFFFF" />
              <Text style={styles.loginButtonText}>Login to View Orders</Text>
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading && !refreshing && orders.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading your orders...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="My Orders"
        showBack
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
            <View style={styles.refreshGradient}>
              <Ionicons name="refresh-outline" size={20} color="#2E7D32" />
            </View>
          </TouchableOpacity>
        }
      />

      <FlatList
        data={filteredOrders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id || item._id}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#4CAF50']}
            tintColor="#4CAF50"
          />
        }
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderListEmpty}
        contentContainerStyle={styles.flatListContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  refreshButton: {
    marginRight: 16,
  },
  refreshGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },

  // ========== LIST HEADER STYLES ==========
  listHeader: {
    paddingBottom: 16,
  },
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1B5E20',
    letterSpacing: -0.5,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: '#666',
    marginTop: 4,
  },
  filterMenuButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },

  // Stats Overview
  statsOverview: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
    lineHeight: 22,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },

  // Filter Section
  filterSection: {
    backgroundColor: '#FFFFFF',
    paddingTop: 20,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  filterChipsContainer: {
    paddingHorizontal: 20,
    gap: 10,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterChipInactive: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E8E8E8',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    marginLeft: 8,
    marginRight: 4,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  filterChipBadge: {
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  filterChipBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  filterChipBadgeInactive: {
    backgroundColor: '#E0E0E0',
  },
  filterChipBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#666',
  },
  filterChipBadgeTextActive: {
    color: '#FFFFFF',
  },

  // Results Summary
  resultsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  clearFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  clearFilterText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },

  // ========== FLATLIST CONTENT ==========
  flatListContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },

  // ========== ORDER CARD STYLES ==========
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  statusBar: {
    height: 4,
    width: '100%',
  },
  orderCardContent: {
    padding: 20,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderInfo: {
    flex: 1,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
    marginLeft: 8,
  },
  orderDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderDate: {
    fontSize: 13,
    color: '#999',
    marginLeft: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  orderPreview: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  productImages: {
    position: 'relative',
    marginRight: 16,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  moreItemsBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    overflow: 'hidden',
  },
  moreItemsOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreItemsText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  orderDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  itemCount: {
    fontSize: 15,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  priceContainer: {
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  orderTotal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2E7D32',
  },
  deliveryInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryInfo: {
    fontSize: 13,
    color: '#4CAF50',
    marginLeft: 6,
    fontWeight: '500',
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  detailsButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  detailsButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  detailsButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    marginRight: 6,
  },

  // ========== EMPTY STATES ==========
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  listEmptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 20,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingHorizontal: 20,
  },
  emptyActionButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  emptyActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  loginButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  loginGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});

export default OrdersScreen;