import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getOrderById } from '../apis/orderApi';

const OrderDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { orderId } = route.params;
  const { user, token, isAuthenticated } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState('status');

  // Status styling
  const statusStyles = {
    Pending: { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' },
    Processing: { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
    'Out for Delivery': { bg: '#f0fdf4', text: '#15803d', border: '#86efac' },
    Delivered: { bg: '#f0fdf4', text: '#166534', border: '#86efac' },
    Cancelled: { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' },
  };

  useEffect(() => {
    if (isAuthenticated) fetchOrder();
    else navigation.navigate('Login');
  }, [orderId, isAuthenticated]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await getOrderById(orderId);
      if (res.status === 200 && res.data?.data) {
        setOrder(res.data.data);
      } else {
        Alert.alert('Error', res.message || 'Could not load order');
        navigation.goBack();
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to load order. Check connection.');
      navigation.goBack();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrder();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-GH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toggleSection = (section) => {
    setExpanded(expanded === section ? null : section);
  };

  const handleContactSupport = () => {
    Linking.openURL('tel:+233501234567'); // ← change to real number
  };

  const handleTrackOrder = () => {
    Alert.alert('Track Order', 'Tracking link / map coming soon!');
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

  const getStatusStyle = (status) => statusStyles[status] || statusStyles.Pending;

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#15803d" />
        <Text style={styles.centerText}>Loading order details...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Order Details" showBack onBackPress={() => navigation.goBack()} />
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={80} color="#ef4444" />
          <Text style={styles.emptyTitle}>Order Not Found</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const status = order.status?.current || 'Pending';
  const statusStyle = getStatusStyle(status);

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Order Details"
        showBack
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity onPress={onRefresh}>
            <Ionicons name="refresh" size={24} color="#15803d" />
          </TouchableOpacity>
        }
      />

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#15803d" />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* STATUS CARD */}
        <View style={[styles.statusCard, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
          <View style={styles.statusHeader}>
            <Ionicons name="checkmark-circle" size={28} color={statusStyle.text} />
            <View style={styles.statusInfo}>
              <Text style={[styles.statusMain, { color: statusStyle.text }]}>
                {status}
              </Text>
              <Text style={styles.orderNumber}>
                Order #{order.orderNumber || order._id?.slice(-8).toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Simple timeline dots */}
          <View style={styles.timeline}>
            {['Pending', 'Processing', 'Out for Delivery', 'Delivered'].map((s, i) => (
              <View key={s} style={styles.timelineStep}>
                <View style={[
                  styles.timelineDot,
                  s === status ? styles.timelineDotActive : s === 'Delivered' && status === 'Delivered' ? styles.timelineDotDone : styles.timelineDotInactive
                ]} />
                <Text style={[
                  styles.timelineLabel,
                  (s === status || (s === 'Delivered' && status === 'Delivered')) && { color: statusStyle.text }
                ]}>
                  {s}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ORDER ITEMS */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('items')}>
            <Text style={styles.sectionTitle}>Items ({order.orderItems?.length || 0})</Text>
            <Ionicons name={expanded === 'items' ? 'chevron-up' : 'chevron-down'} size={20} color="#64748b" />
          </TouchableOpacity>

          {expanded === 'items' && (
            <View style={styles.itemsList}>
              {order.orderItems?.map((item, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <Image
                    source={{ uri: item.image || 'https://via.placeholder.com/64' }}
                    style={styles.itemThumb}
                  />
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.itemMeta}>
                      {item.quantity} × {item.unit || 'unit'} • GH₵{item.price}
                    </Text>
                    <Text style={styles.itemTotal}>
                      GH₵ {(item.quantity * item.price).toFixed(2)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* DELIVERY INFO */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('delivery')}>
            <Text style={styles.sectionTitle}>Delivery</Text>
            <Ionicons name={expanded === 'delivery' ? 'chevron-up' : 'chevron-down'} size={20} color="#64748b" />
          </TouchableOpacity>

          {expanded === 'delivery' && (
            <View style={styles.infoBlock}>
              <View style={styles.infoLine}>
                <Ionicons name="location-outline" size={18} color="#64748b" />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Address</Text>
                  <Text style={styles.infoValue}>
                    {order.shippingAddress?.address}, {order.shippingAddress?.city}
                  </Text>
                </View>
              </View>

              <View style={styles.infoLine}>
                <Ionicons name="call-outline" size={18} color="#64748b" />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoValue}>{order.shippingAddress?.phone || user?.phone}</Text>
                </View>
              </View>

              <View style={styles.infoLine}>
                <Ionicons name="calendar-outline" size={18} color="#64748b" />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Scheduled</Text>
                  <Text style={styles.infoValue}>
                    {order.deliverySchedule?.preferredDay?.charAt(0).toUpperCase() + order.deliverySchedule?.preferredDay?.slice(1) || '—'}{' '}
                    • {order.deliverySchedule?.preferredTime || '—'}
                  </Text>
                </View>
              </View>

              {order.deliveryNote && (
                <View style={styles.infoLine}>
                  <Ionicons name="document-text-outline" size={18} color="#64748b" />
                  <View style={styles.infoText}>
                    <Text style={styles.infoLabel}>Note</Text>
                    <Text style={styles.infoValue}>{order.deliveryNote}</Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>

        {/* PAYMENT INFO */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('payment')}>
            <Text style={styles.sectionTitle}>Payment</Text>
            <Ionicons name={expanded === 'payment' ? 'chevron-up' : 'chevron-down'} size={20} color="#64748b" />
          </TouchableOpacity>

          {expanded === 'payment' && (
            <View style={styles.infoBlock}>
              <View style={styles.infoLine}>
                <Ionicons name="card-outline" size={18} color="#64748b" />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Method</Text>
                  <Text style={styles.infoValue}>{order.payment?.method || 'Paystack'}</Text>
                </View>
              </View>

              <View style={styles.infoLine}>
                <Ionicons
                  name={order.payment?.isPaid ? 'checkmark-circle' : 'time-outline'}
                  size={18}
                  color={order.payment?.isPaid ? '#15803d' : '#ca8a04'}
                />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Status</Text>
                  <Text style={[
                    styles.infoValue,
                    { color: order.payment?.isPaid ? '#15803d' : '#ca8a04' }
                  ]}>
                    {order.payment?.isPaid ? 'Paid' : 'Pending'}
                  </Text>
                </View>
              </View>

              {order.payment?.paidAt && (
                <View style={styles.infoLine}>
                  <Ionicons name="calendar-check-outline" size={18} color="#64748b" />
                  <View style={styles.infoText}>
                    <Text style={styles.infoLabel}>Paid on</Text>
                    <Text style={styles.infoValue}>{formatDate(order.payment.paidAt)}</Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>

        {/* SUMMARY */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('summary')}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <Ionicons name={expanded === 'summary' ? 'chevron-up' : 'chevron-down'} size={20} color="#64748b" />
          </TouchableOpacity>

          {expanded === 'summary' && (
            <View style={styles.summaryBlock}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Items total</Text>
                <Text style={styles.summaryValue}>GH₵ {order.pricing?.itemsPrice || '—'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery</Text>
                <Text style={styles.summaryValue}>
                  {order.pricing?.deliveryFee === 0 ? 'Free' : `GH₵ ${order.pricing?.deliveryFee|| '—'}`}
                </Text>
              </View>
              <View style={styles.totalDivider} />
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Grand Total</Text>
                <Text style={styles.grandTotal}>GH₵ {order.pricing?.totalPrice || '—'}</Text>
              </View>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* BOTTOM ACTIONS */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.actionSupport} onPress={handleContactSupport}>
          <Ionicons name="help-circle-outline" size={20} color="#fff" />
          <Text style={styles.actionText}>Support</Text>
        </TouchableOpacity>

        {(status === 'Processing' || status === 'Out for Delivery') && (
          <TouchableOpacity style={styles.actionTrack} onPress={handleTrackOrder}>
            <Ionicons name="location-outline" size={20} color="#fff" />
            <Text style={styles.actionText}>Track</Text>
          </TouchableOpacity>
        )}

        {status === 'Delivered' && (
          <TouchableOpacity style={styles.actionReorder} onPress={handleReorder}>
            <Ionicons name="repeat-outline" size={20} color="#fff" />
            <Text style={styles.actionText}>Reorder</Text>
          </TouchableOpacity>
        )}

        {!order.payment?.isPaid && status !== 'Cancelled' && (
          <TouchableOpacity style={styles.actionPay} onPress={() => Alert.alert('Pay Now', 'Redirecting to payment...')}>
            <Ionicons name="card-outline" size={20} color="#fff" />
            <Text style={styles.actionText}>Pay Now</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  centerText: { marginTop: 16, fontSize: 16, color: '#64748b' },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#1e293b', marginTop: 16 },
  backBtn: { marginTop: 24, backgroundColor: '#15803d', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12 },
  backBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },

  scrollContent: { paddingBottom: 140 },

  statusCard: {
    margin: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  statusHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  statusInfo: { marginLeft: 12, flex: 1 },
  statusMain: { fontSize: 20, fontWeight: '700' },
  orderNumber: { fontSize: 14, color: '#64748b', marginTop: 4 },

  timeline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timelineStep: { alignItems: 'center', flex: 1 },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 6,
  },
  timelineDotActive: { backgroundColor: '#15803d' },
  timelineDotDone: { backgroundColor: '#166534' },
  timelineDotInactive: { backgroundColor: '#cbd5e1' },
  timelineLabel: { fontSize: 12, color: '#64748b', textAlign: 'center' },

  section: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },

  itemsList: { padding: 16 },
  itemRow: { flexDirection: 'row', marginBottom: 16 },
  itemThumb: { width: 60, height: 60, borderRadius: 10, backgroundColor: '#f1f5f9' },
  itemInfo: { flex: 1, marginLeft: 16 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#1e293b', marginBottom: 4 },
  itemMeta: { fontSize: 13, color: '#64748b', marginBottom: 4 },
  itemTotal: { fontSize: 14, fontWeight: '700', color: '#15803d' },

  infoBlock: { padding: 16 },
  infoLine: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-start' },
  infoText: { flex: 1, marginLeft: 12 },
  infoLabel: { fontSize: 13, color: '#64748b', marginBottom: 2 },
  infoValue: { fontSize: 15, color: '#1e293b', fontWeight: '500' },

  summaryBlock: { padding: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel: { fontSize: 14, color: '#475569' },
  summaryValue: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  totalDivider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  grandTotal: { fontSize: 20, fontWeight: '800', color: '#15803d' },

  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 16,
  },
  actionSupport: { flex: 1, backgroundColor: '#3b82f6', paddingVertical: 14, borderRadius: 12, marginRight: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',marginBottom:24, },
  actionTrack: { flex: 1, backgroundColor: '#10b981', paddingVertical: 14, borderRadius: 12, marginRight: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',marginBottom:24, },
  actionReorder: { flex: 1, backgroundColor: '#f59e0b', paddingVertical: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',marginBottom:24, },
  actionPay: { flex: 1, backgroundColor: '#15803d', paddingVertical: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',marginBottom:24, },
  actionText: { color: 'white', fontWeight: '700', marginLeft: 8, fontSize: 14 },
});

export default OrderDetailScreen;