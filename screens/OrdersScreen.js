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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { getMyOrder } from '../apis/orderApi';

const OrdersScreen = () => {
  const navigation = useNavigation();
  const { user, token, isAuthenticated } = useAuth();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, pending, delivered, cancelled
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    delivered: 0,
    cancelled: 0,
  });

  const filters = [
    { id: 'all', label: 'All Orders', icon: 'list' },
    { id: 'pending', label: 'Pending', icon: 'time' },
    { id: 'delivered', label: 'Delivered', icon: 'checkmark-circle' },
    { id: 'cancelled', label: 'Cancelled', icon: 'close-circle' },
  ];

  const statusColors = {
    'Pending': '#FF9800',
    'Processing': '#2196F3',
    'Out for Delivery': '#4CAF50',
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
    };

    ordersList.forEach(order => {
      const status = order.status || 'Pending';
      if (status === 'Delivered' || status === 'delivered') {
        statsData.delivered++;
      } else if (status === 'Cancelled' || status === 'cancelled') {
        statsData.cancelled++;
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
          return status !== 'delivered' && status !== 'cancelled';
        }
        return status === filter;
      });

  const formatDate = (dateString) => {
    try {
      
      const date = new Date(dateString);
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
      'Pending': 'Pending',
      'Processing': 'Processing',
      'Out for Delivery': 'Out for Delivery',
      'Delivered': 'Delivered',
      'Cancelled': 'Cancelled',
    };
    return statusMap[status] || 'Pending';
  };

  const renderOrderItem = ({ item }) => {
    const orderDate = item.createdAt || item.orderDate;
    const formattedDate = formatDate(orderDate);
    const status = item.status || 'Pending';
    const normalizedStatus = status.toLowerCase();
    const statusColor = statusColors[getOrderStatusText(status)] || '#FF9800';
    const statusIcon = statusIcons[getOrderStatusText(status)] || 'time-outline';
    const itemCount = item.itemsCount || item.orderItems?.length || 0;
    const totalPrice = item.totalPrice || item.orderTotal || 0;

    // Get first product image for preview
    const firstProduct = item.orderItems?.[0] || item.items?.[0];
    const firstProductImage = firstProduct?.image || 
                             firstProduct?.product?.image || 
                             'https://via.placeholder.com/100';

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => navigation.navigate('OrderDetail', { orderId: item.id || item._id })}
        activeOpacity={0.7}
      >
        {/* Order Header */}
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderId}>
              Order #{item.orderNumber || item._id?.substring(0, 8).toUpperCase()}
            </Text>
            <Text style={styles.orderDate}>{orderDate }</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
            <Ionicons name={statusIcon} size={14} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {getOrderStatusText(status)}
            </Text>
          </View>
        </View>

        {/* Order Preview */}
        <View style={styles.orderPreview}>
          {/* Product Images */}
          <View style={styles.productImages}>
            <Image
              source={{ uri: firstProductImage }}
              style={styles.productImage}
              resizeMode="cover"
            />
            {itemCount > 1 && (
              <View style={styles.moreItemsOverlay}>
                <Text style={styles.moreItemsText}>+{itemCount - 1}</Text>
              </View>
            )}
          </View>

          {/* Order Details */}
          <View style={styles.orderDetails}>
            <Text style={styles.itemCount}>
              {itemCount} item{itemCount !== 1 ? 's' : ''}
            </Text>
            <Text style={styles.orderTotal}>
              Total: GH₵ {totalPrice}
            </Text>
            <Text style={styles.deliveryInfo}>
              Delivery: {item.deliverySchedule?.preferredDay || 'Not scheduled'}
            </Text>
          </View>
        </View>

        {/* Order Actions */}
        <View style={styles.orderActions}>
          {normalizedStatus === 'delivered' ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.reorderButton]}
              onPress={() => handleReorder(item)}
            >
              <Ionicons name="refresh-outline" size={16} color="#4CAF50" />
              <Text style={styles.reorderButtonText}>Reorder</Text>
            </TouchableOpacity>
          ) /*: normalizedStatus === 'pending' || normalizedStatus === 'processing' || normalizedStatus === 'out_for_delivery' ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.trackButton]}
              onPress={() => navigation.navigate('TrackOrder', { orderId: item._id })}
            >
              <Ionicons name="locate-outline" size={16} color="#2196F3" />
              <Text style={styles.trackButtonText}>Track Order</Text>
            </TouchableOpacity>
          ) */: null}

          <TouchableOpacity
            style={[styles.actionButton, styles.detailsButton]}
            onPress={() => navigation.navigate('OrderDetail', { orderId: item.id || item._id })}
          >
            <Text style={styles.detailsButtonText}>View Details</Text>
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const handleReorder = (order) => {
    Alert.alert(
      'Reorder',
      'Add all items from this order to your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reorder', 
          onPress: () => {
            // TODO: Implement reorder logic
            Alert.alert('Coming Soon', 'Reorder feature will be available soon!');
          }
        }
      ]
    );
  };

  
  const renderListHeader = () => (
    <View style={styles.listHeader}>
      
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterTitle}>Filter by Status</Text>
        <View style={styles.filterTabs}>
          {filters.map((filterItem) => (
            <TouchableOpacity
              key={filterItem.id}
              style={[
                styles.filterTab,
                filter === filterItem.id && styles.filterTabActive,
              ]}
              onPress={() => setFilter(filterItem.id)}
            >
              <Ionicons 
                name={filterItem.icon} 
                size={18} 
                color={filter === filterItem.id ? '#FFFFFF' : '#666'} 
              />
              <Text style={[
                styles.filterTabText,
                filter === filterItem.id && styles.filterTabTextActive,
              ]}>
                {filterItem.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Orders Title */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {filter !== 'all' ? `${filter.charAt(0).toUpperCase() + filter.slice(1)} Orders` : 'All Orders'}
          {filteredOrders.length > 0 && ` (${filteredOrders.length})`}
        </Text>
      </View>
    </View>
  );

  // ========== LIST EMPTY COMPONENT ==========
  const renderListEmpty = () => (
    <View style={styles.listEmptyContainer}>
      <Ionicons name="search-outline" size={60} color="#E0E0E0" />
      <Text style={styles.listEmptyTitle}>
        No {filter !== 'all' ? filter : ''} orders found
      </Text>
      <Text style={styles.listEmptyText}>
        {filter === 'all' 
          ? "You haven't placed any orders yet" 
          : `You don't have any ${filter} orders`}
      </Text>
      <TouchableOpacity
        style={styles.resetFilterButton}
        onPress={() => setFilter('all')}
      >
        <Text style={styles.resetFilterText}>Show All Orders</Text>
      </TouchableOpacity>
    </View>
  );

  // ========== AUTHENTICATION STATES ==========
  if (!isAuthenticated && !loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="My Orders"
          showBack
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={80} color="#E0E0E0" />
          <Text style={styles.emptyTitle}>Please Login</Text>
          <Text style={styles.emptyText}>
            Login to view your order history and track deliveries
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Ionicons name="log-in-outline" size={20} color="#FFFFFF" />
            <Text style={styles.loginButtonText}>Login to View Orders</Text>
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

  // ========== MAIN RENDER ==========
  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="My Orders"
        showBack
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
            <Ionicons name="refresh-outline" size={24} color="#2E7D32" />
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
        // Sticky header for section header if needed
        stickyHeaderIndices={[]} // Empty for now, but you can add [2] if you want section header to stick
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
    padding: 8,
    marginRight: 8,
  },
  
  // ========== LIST HEADER STYLES ==========
  listHeader: {
    paddingBottom: 16,
  },
  
  // Stats Section
  statsContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  statsHeader: {
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B5E20',
  },
  statsCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    marginHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
  },
  statCardActive: {
    backgroundColor: '#F0F7F0',
    borderColor: '#4CAF50',
    transform: [{ scale: 1.05 }],
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  
  // Filter Tabs
  filterContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  filterTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
  },
  filterTabActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  filterTabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    marginLeft: 8,
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  
  // Section Header
  sectionHeader: {
    marginTop: 24,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1B5E20',
  },
  
  // ========== FLATLIST CONTENT ==========
  flatListContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  
  // ========== LIST EMPTY STYLES ==========
  listEmptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 20,
  },
  listEmptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1B5E20',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  listEmptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  resetFilterButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  resetFilterText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // ========== ORDER CARD STYLES ==========
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
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
  orderId: {
    fontSize: 17,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 6,
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
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
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
  },
  moreItemsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreItemsText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  orderDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  itemCount: {
    fontSize: 15,
    color: '#666',
    marginBottom: 6,
    fontWeight: '500',
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 6,
  },
  deliveryInfo: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1.5,
    borderTopColor: '#F0F0F0',
    paddingTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  reorderButton: {
    backgroundColor: '#F0F7F0',
    borderWidth: 1.5,
    borderColor: '#C8E6C9',
  },
  reorderButtonText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 6,
  },
  trackButton: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1.5,
    borderColor: '#BBDEFB',
  },
  trackButtonText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
    marginLeft: 6,
  },
  detailsButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
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
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1B5E20',
    marginTop: 20,
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
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E7D32',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 10,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default OrdersScreen;