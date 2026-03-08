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
  Modal,
  TextInput,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getOrderById, cancelOrder } from '../apis/orderApi';

const OrderDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { orderId } = route.params;
  const { user, token, isAuthenticated } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState('status');
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Cancellation reasons
  const cancellationReasons = [
    { id: 'changed_mind', label: 'Changed my mind', icon: 'heart-dislike' },
    { id: 'found_cheaper', label: 'Found cheaper elsewhere', icon: 'pricetag' },
    { id: 'delivery_time', label: 'Delivery time too long', icon: 'time' },
    { id: 'ordered_mistake', label: 'Ordered by mistake', icon: 'alert-circle' },
    { id: 'payment_issues', label: 'Payment issues', icon: 'card' },
    { id: 'other', label: 'Other reason', icon: 'chatbubble' },
  ];

  // Status styling
  const statusStyles = {
    Pending: { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa', icon: 'time' },
    Processing: { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe', icon: 'sync' },
    'Out for Delivery': { bg: '#f0fdf4', text: '#15803d', border: '#86efac', icon: 'bicycle' },
    Delivered: { bg: '#f0fdf4', text: '#166534', border: '#86efac', icon: 'checkmark-circle' },
    Cancelled: { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca', icon: 'close-circle' },
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
    Linking.openURL('tel:+233505671577');
  };

  const handleTrackOrder = () => {
    Alert.alert(
      'Track Order',
      'Real-time tracking will be available soon! You will be notified when your order is out for delivery.',
      [{ text: 'OK' }]
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
            Alert.alert('Coming Soon', 'Reorder feature will be available soon!');
          }
        }
      ]
    );
  };

  // Handle order cancellation
  const handleCancelOrder = () => {
    if (!order) return;
    
    // Check if order can be cancelled
    if (!['Pending', 'Processing'].includes(order.status?.current)) {
      Alert.alert(
        'Cannot Cancel',
        `Orders with status "${order.status?.current}" cannot be cancelled.`
      );
      return;
    }

    if (order.payment?.isPaid) {
      Alert.alert(
        'Paid Order',
        'This order has already been paid. Please contact support for assistance with cancellation and refund.'
      );
      return;
    }

    // Reset state and show modal
    setCancelReason('');
    setCustomReason('');
    setCancelModalVisible(true);
  };

  const selectReason = (reasonId) => {
    setCancelReason(reasonId);
    if (reasonId !== 'other') {
      setCustomReason('');
    }
  };

  const submitCancellation = async () => {
    // Determine the final reason text
    let finalReason = '';
    if (cancelReason === 'other') {
      if (!customReason.trim()) {
        Alert.alert('Error', 'Please enter your reason for cancellation');
        return;
      }
      finalReason = customReason.trim();
    } else {
      const selected = cancellationReasons.find(r => r.id === cancelReason);
      if (!selected) {
        Alert.alert('Error', 'Please select a reason for cancellation');
        return;
      }
      finalReason = selected.label;
    }

    setCancelling(true);
    try {
      const response = await cancelOrder(orderId, { reason: finalReason });
      
      if (response.status === 200 && response.data?.success) {
        Alert.alert(
          'Order Cancelled',
          'Your order has been successfully cancelled.',
          [{ text: 'OK', onPress: () => {
            setCancelModalVisible(false);
            fetchOrder(); // Refresh order details
          }}]
        );
      } else {
        Alert.alert('Error', response.data?.message || 'Failed to cancel order');
      }
    } catch (error) {
      console.error('Cancel order error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to cancel order. Please try again.'
      );
    } finally {
      setCancelling(false);
    }
  };

  const getStatusStyle = (status) => statusStyles[status] || statusStyles.Pending;

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar backgroundColor="#2E7D32" barStyle="light-content" />
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Order Details</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.headerIconBtn}
              onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
            >
              <Ionicons name="home-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.centerText}>Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar backgroundColor="#2E7D32" barStyle="light-content" />
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Order Details</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.headerIconBtn}
              onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
            >
              <Ionicons name="home-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={80} color="#ef4444" />
          <Text style={styles.emptyTitle}>Order Not Found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>← Back to Orders</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const status = order.status?.current || 'Pending';
  const statusStyle = getStatusStyle(status);
  const canCancel = ['Pending', 'Processing'].includes(status) && !order.payment?.isPaid;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar backgroundColor="#2E7D32" barStyle="light-content" />
      
      {/* Green Header - Matching other screens */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Order Details</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.headerIconBtn}
            onPress={onRefresh}
          >
            <Ionicons name="refresh" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerIconBtn}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
          >
            <Ionicons name="home-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Cancellation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={cancelModalVisible}
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Ionicons name="close-circle-outline" size={28} color="#b91c1c" />
                <Text style={styles.modalTitle}>Cancel Order</Text>
              </View>
              <TouchableOpacity 
                onPress={() => setCancelModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalBody}>
                {/* Order Summary */}
                <View style={styles.orderSummary}>
                  <Text style={styles.summaryLabel}>Order #{order.orderNumber || order._id?.slice(-8).toUpperCase()}</Text>
                  <Text style={styles.summaryTotal}>GH₵ {order.pricing?.totalPrice || '—'}</Text>
                </View>

                <Text style={styles.modalSubtitle}>
                  Please let us know why you're cancelling this order
                </Text>

                {/* Cancellation reasons grid */}
                <View style={styles.reasonsGrid}>
                  {cancellationReasons.map((reason) => (
                    <TouchableOpacity
                      key={reason.id}
                      style={[
                        styles.reasonCard,
                        cancelReason === reason.id && styles.reasonCardSelected
                      ]}
                      onPress={() => selectReason(reason.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        styles.reasonIconContainer,
                        cancelReason === reason.id && styles.reasonIconContainerSelected
                      ]}>
                        <Ionicons 
                          name={reason.icon} 
                          size={24} 
                          color={cancelReason === reason.id ? '#15803d' : '#64748b'} 
                        />
                      </View>
                      <Text style={[
                        styles.reasonCardText,
                        cancelReason === reason.id && styles.reasonCardTextSelected
                      ]}>
                        {reason.label}
                      </Text>
                      {cancelReason === reason.id && (
                        <View style={styles.selectedIndicator}>
                          <Ionicons name="checkmark-circle" size={20} color="#15803d" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Custom reason input for "Other" */}
                {cancelReason === 'other' && (
                  <View style={styles.customReasonContainer}>
                    <Text style={styles.customReasonLabel}>Please specify your reason:</Text>
                    <TextInput
                      style={styles.customReasonInput}
                      placeholder="Enter your reason here..."
                      placeholderTextColor="#94a3b8"
                      value={customReason}
                      onChangeText={setCustomReason}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                      autoFocus
                    />
                  </View>
                )}

                {/* Cancellation policy notice */}
                <View style={styles.policyNotice}>
                  <Ionicons name="information-circle-outline" size={20} color="#3b82f6" />
                  <Text style={styles.policyNoticeText}>
                    By cancelling this order, any pending payments will be voided and items will be returned to stock.
                  </Text>
                </View>
              </View>
            </ScrollView>

            {/* Modal Footer with Actions */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.footerCancelButton}
                onPress={() => setCancelModalVisible(false)}
                disabled={cancelling}
              >
                <Text style={styles.footerCancelButtonText}>Keep Order</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.footerConfirmButton, 
                  (!cancelReason || (cancelReason === 'other' && !customReason.trim()) || cancelling) && 
                  styles.footerConfirmButtonDisabled
                ]}
                onPress={submitCancellation}
                disabled={!cancelReason || (cancelReason === 'other' && !customReason.trim()) || cancelling}
              >
                {cancelling ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={18} color="#fff" style={styles.footerConfirmIcon} />
                    <Text style={styles.footerConfirmButtonText}>Confirm </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2E7D32" />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* STATUS CARD - Enhanced */}
        <View style={[styles.statusCard, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusIconContainer, { backgroundColor: statusStyle.text }]}>
              <Ionicons name={statusStyle.icon} size={24} color="#fff" />
            </View>
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
            {['Pending', 'Processing', 'Out for Delivery', 'Delivered'].map((s, i) => {
              const isActive = s === status;
              const isPast = 
                (status === 'Processing' && s === 'Pending') ||
                (status === 'Out for Delivery' && (s === 'Pending' || s === 'Processing')) ||
                (status === 'Delivered' && s !== 'Delivered');
              
              return (
                <View key={s} style={styles.timelineStep}>
                  <View style={[
                    styles.timelineDot,
                    isActive ? styles.timelineDotActive : 
                    isPast ? styles.timelineDotPast : 
                    styles.timelineDotInactive
                  ]} />
                  <Text style={[
                    styles.timelineLabel,
                    isActive && { color: statusStyle.text, fontWeight: '600' }
                  ]}>
                    {s === 'Out for Delivery' ? 'Out for' : s}
                    {s === 'Out for Delivery' && <Text style={styles.timelineLabelSmall}> Delivery</Text>}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Tracking info placeholder */}
          {status === 'Out for Delivery' && (
            <TouchableOpacity style={styles.trackingPreview} onPress={handleTrackOrder}>
              <Ionicons name="location" size={16} color="#15803d" />
              <Text style={styles.trackingPreviewText}>Tap to track your order</Text>
              <Ionicons name="chevron-forward" size={16} color="#15803d" />
            </TouchableOpacity>
          )}
        </View>

        {/* ORDER ITEMS */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('items')}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="basket-outline" size={20} color="#2E7D32" />
              <Text style={styles.sectionTitle}>Items ({order.orderItems?.length || 0})</Text>
            </View>
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
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="location-outline" size={20} color="#2E7D32" />
              <Text style={styles.sectionTitle}>Delivery</Text>
            </View>
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
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="card-outline" size={20} color="#2E7D32" />
              <Text style={styles.sectionTitle}>Payment</Text>
            </View>
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
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="calculator-outline" size={20} color="#2E7D32" />
              <Text style={styles.sectionTitle}>Summary</Text>
            </View>
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

        {/* ORDER TIMELINE */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('timeline')}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="time-outline" size={20} color="#2E7D32" />
              <Text style={styles.sectionTitle}>Order Timeline</Text>
            </View>
            <Ionicons name={expanded === 'timeline' ? 'chevron-up' : 'chevron-down'} size={20} color="#64748b" />
          </TouchableOpacity>

          {expanded === 'timeline' && (
            <View style={styles.timelineBlock}>
              <View style={styles.timelineItem}>
                <View style={styles.timelineItemLeft}>
                  <View style={styles.timelineItemDot} />
                  <View style={styles.timelineItemLine} />
                </View>
                <View style={styles.timelineItemContent}>
                  <Text style={styles.timelineItemTitle}>Order Placed</Text>
                  <Text style={styles.timelineItemTime}>{formatDate(order.createdAt)}</Text>
                </View>
              </View>

              <View style={styles.timelineItem}>
                <View style={styles.timelineItemLeft}>
                  <View style={[
                    styles.timelineItemDot,
                    ['Processing', 'Out for Delivery', 'Delivered'].includes(status) && styles.timelineItemDotActive
                  ]} />
                  <View style={[
                    styles.timelineItemLine,
                    ['Out for Delivery', 'Delivered'].includes(status) && styles.timelineItemLineActive
                  ]} />
                </View>
                <View style={styles.timelineItemContent}>
                  <Text style={[
                    styles.timelineItemTitle,
                    ['Processing', 'Out for Delivery', 'Delivered'].includes(status) && styles.timelineItemTitleActive
                  ]}>Order Confirmed</Text>
                  {['Processing', 'Out for Delivery', 'Delivered'].includes(status) && (
                    <Text style={styles.timelineItemTime}>Processing started</Text>
                  )}
                </View>
              </View>

              <View style={styles.timelineItem}>
                <View style={styles.timelineItemLeft}>
                  <View style={[
                    styles.timelineItemDot,
                    ['Out for Delivery', 'Delivered'].includes(status) && styles.timelineItemDotActive
                  ]} />
                  <View style={[
                    styles.timelineItemLine,
                    status === 'Delivered' && styles.timelineItemLineActive
                  ]} />
                </View>
                <View style={styles.timelineItemContent}>
                  <Text style={[
                    styles.timelineItemTitle,
                    ['Out for Delivery', 'Delivered'].includes(status) && styles.timelineItemTitleActive
                  ]}>Out for Delivery</Text>
                  {status === 'Out for Delivery' && (
                    <Text style={styles.timelineItemTime}>Your order is on the way</Text>
                  )}
                </View>
              </View>

              <View style={styles.timelineItem}>
                <View style={styles.timelineItemLeft}>
                  <View style={[
                    styles.timelineItemDot,
                    status === 'Delivered' && styles.timelineItemDotActive
                  ]} />
                </View>
                <View style={styles.timelineItemContent}>
                  <Text style={[
                    styles.timelineItemTitle,
                    status === 'Delivered' && styles.timelineItemTitleActive
                  ]}>Delivered</Text>
                  {status === 'Delivered' && (
                    <Text style={styles.timelineItemTime}>{formatDate(order.deliveredAt)}</Text>
                  )}
                </View>
              </View>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* BOTTOM ACTIONS - Enhanced */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.actionSupport} onPress={handleContactSupport}>
          <Ionicons name="help-circle-outline" size={20} color="#fff" />
          <Text style={styles.actionText}>Support</Text>
        </TouchableOpacity>

        {(status === 'Out for Delivery') && (
          <TouchableOpacity style={styles.actionTrack} onPress={handleTrackOrder}>
            <Ionicons name="location-outline" size={20} color="#fff" />
            <Text style={styles.actionText}>Track</Text>
          </TouchableOpacity>
        )}

        {status === 'Delivered' && (
          <TouchableOpacity style={styles.actionReorder} onPress={() => handleReorder(order)}>
            <Ionicons name="repeat-outline" size={20} color="#fff" />
            <Text style={styles.actionText}>Reorder</Text>
          </TouchableOpacity>
        )}

        {canCancel && (
          <TouchableOpacity style={styles.actionCancel} onPress={handleCancelOrder}>
            <Ionicons name="close-circle-outline" size={20} color="#fff" />
            <Text style={styles.actionText}>Cancel</Text>
          </TouchableOpacity>
        )}

        {!order.payment?.isPaid && status !== 'Cancelled' && !canCancel && status !== 'Delivered' && (
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
  
  // ── TOP BAR (Green header like other screens) ──
  topBar: {
    backgroundColor: '#2E7D32',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopLeftRadius:12,
    borderTopRightRadius:12,
  },
  backBtn: { 
    padding: 4,
  },
  topBarTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#fff', 
    flex: 1, 
    textAlign: 'center' 
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBtn: {
    padding: 4,
    position: 'relative',
  },
  
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  centerText: { marginTop: 16, fontSize: 16, color: '#64748b' },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#1e293b', marginTop: 16 },
  backButton: { marginTop: 24, backgroundColor: '#2E7D32', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12 },
  backButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },

  scrollContent: { paddingBottom: 140 },

  // Status Card - Enhanced
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
  statusIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusInfo: { flex: 1 },
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
  timelineDotActive: { backgroundColor: '#15803d', width: 14, height: 14, borderRadius: 7 },
  timelineDotPast: { backgroundColor: '#15803d', opacity: 0.5 },
  timelineDotInactive: { backgroundColor: '#cbd5e1' },
  timelineLabel: { fontSize: 11, color: '#64748b', textAlign: 'center' },
  timelineLabelSmall: { fontSize: 9 },

  trackingPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    gap: 8,
  },
  trackingPreviewText: {
    fontSize: 14,
    color: '#15803d',
    fontWeight: '600',
  },

  // Sections
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
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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

  // Timeline Block
  timelineBlock: {
    padding: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  timelineItemLeft: {
    width: 30,
    alignItems: 'center',
  },
  timelineItemDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#cbd5e1',
    zIndex: 1,
  },
  timelineItemDotActive: {
    backgroundColor: '#15803d',
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  timelineItemLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#cbd5e1',
    marginTop: 2,
    marginBottom: 2,
  },
  timelineItemLineActive: {
    backgroundColor: '#15803d',
  },
  timelineItemContent: {
    flex: 1,
    paddingBottom: 16,
  },
  timelineItemTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 2,
  },
  timelineItemTitleActive: {
    color: '#1e293b',
    fontWeight: '600',
  },
  timelineItemTime: {
    fontSize: 12,
    color: '#94a3b8',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 24,
    width: '100%',
    maxHeight: '80%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginLeft: 12,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  orderSummary: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  summaryTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#15803d',
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 16,
  },
  reasonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  reasonCard: {
    width: '48%',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    position: 'relative',
  },
  reasonCardSelected: {
    borderColor: '#15803d',
    backgroundColor: '#f0fdf4',
  },
  reasonIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  reasonIconContainerSelected: {
    backgroundColor: '#dcfce7',
    borderColor: '#15803d',
  },
  reasonCardText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  reasonCardTextSelected: {
    color: '#15803d',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  customReasonContainer: {
    marginBottom: 20,
  },
  customReasonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  customReasonInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    color: '#1e293b',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    minHeight: 100,
  },
  policyNotice: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginBottom: 8,
  },
  policyNoticeText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: 'white',
    gap: 12,
  },
  footerCancelButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  footerCancelButtonText: {
    color: '#475569',
    fontSize: 16,
    fontWeight: '600',
  },
  footerConfirmButton: {
    flex: 1,
    backgroundColor: '#b91c1c',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerConfirmButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  footerConfirmIcon: {
    marginRight: 8,
  },
  footerConfirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // Bottom Actions
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
  actionSupport: { 
    flex: 1, 
    backgroundColor: '#3b82f6', 
    paddingVertical: 14, 
    borderRadius: 12, 
    marginRight: 8, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: 24, 
  },
  actionTrack: { 
    flex: 1, 
    backgroundColor: '#10b981', 
    paddingVertical: 14, 
    borderRadius: 12, 
    marginRight: 8, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: 24, 
  },
  actionReorder: { 
    flex: 1, 
    backgroundColor: '#f59e0b', 
    paddingVertical: 14, 
    borderRadius: 12, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: 24, 
  },
  actionCancel: { 
    flex: 1, 
    backgroundColor: '#b91c1c', 
    paddingVertical: 14, 
    borderRadius: 12, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: 24, 
  },
  actionPay: { 
    flex: 1, 
    backgroundColor: '#15803d', 
    paddingVertical: 14, 
    borderRadius: 12, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: 24, 
  },
  actionText: { color: 'white', fontWeight: '700', marginLeft: 8, fontSize: 14 },
});

export default OrderDetailScreen;