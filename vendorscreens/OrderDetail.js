// src/vendorscreens/VendorOrderDetailScreen.js
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const STATUS_COLORS = {
  Pending:   { bg: '#FFF3E0', text: '#E65100', icon: 'time-outline' },
  Confirmed: { bg: '#E8F5E9', text: '#2E7D32', icon: 'checkmark-circle-outline' },
  Processing: { bg: '#E3F2FD', text: '#1565C0', icon: 'restaurant-outline' },
  Ready:     { bg: '#F3E5F5', text: '#6A1B9A', icon: 'cube-outline' },
  Delivered: { bg: '#E0F2F1', text: '#00695C', icon: 'checkmark-done-outline' },
  Cancelled: { bg: '#FFEBEE', text: '#C62828', icon: 'close-circle-outline' },
};

// ─── Helper: get product image from array ────────────────────────────────────
const getProductImage = (item) => {
  if (item?.images?.length > 0) return item.images[0];
  if (item?.image) return item.image;
  if (item?.product?.images?.length > 0) return item.product.images[0];
  if (item?.product?.image) return item.product.image;
  return null;
};

const VendorOrderDetailScreen = ({ navigation, route }) => {
  const { order } = route.params;
  
  const statusStyle = STATUS_COLORS[order?.status] || STATUS_COLORS.Pending;

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    });

  const formatTime = (dateString) =>
    new Date(dateString).toLocaleTimeString('en-GB', {
      hour: '2-digit', minute: '2-digit',
    });

  const getAddressString = (addr) => {
    if (!addr) return '';
    const parts = [addr.address, addr.nearestLandmark, addr.city, addr.region].filter(Boolean);
    return parts.join(', ');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── White Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Order Details</Text>
          <Text style={styles.headerOrderNum}>#{order.orderNumber}</Text>
        </View>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Status Banner ── */}
        <View style={[styles.statusBanner, { backgroundColor: statusStyle.bg, borderColor: statusStyle.text + '30' }]}>
          <View style={[styles.statusIconWrap, { backgroundColor: statusStyle.text + '18' }]}>
            <Ionicons name={statusStyle.icon} size={22} color={statusStyle.text} />
          </View>
          <View style={styles.statusInfo}>
            <Text style={[styles.statusLabel, { color: statusStyle.text }]}>
              {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
            </Text>
            <Text style={styles.statusDate}>
              Placed {formatDate(order.createdAt)} at {formatTime(order.createdAt)}
            </Text>
          </View>
        </View>

        {/* ── Customer Info ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer</Text>
          <View style={styles.card}>
            <View style={styles.customerAvatar}>
              <Text style={styles.customerAvatarText}>
                {order.customer?.firstName?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>
                {order.customer?.firstName} {order.customer?.lastName}
              </Text>
              {order.customer?.phone && (
                <View style={styles.contactPill}>
                  <Ionicons name="call-outline" size={12} color="#2E7D32" />
                  <Text style={styles.contactPillText}>{order.customer.phone}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* ── Shipping Address ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shipping Address</Text>
          <View style={styles.card}>
            <View style={styles.addressIconWrap}>
              <Ionicons name="location-outline" size={20} color="#2E7D32" />
            </View>
            <View style={styles.addressContent}>
              <Text style={styles.addressText}>
                {getAddressString(order.shippingAddress)}
              </Text>
              {order.shippingAddress?.phone && (
                <View style={styles.addressPhoneChip}>
                  <Ionicons name="call-outline" size={11} color="#2E7D32" />
                  <Text style={styles.addressPhoneText}>{order.shippingAddress.phone}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* ── Items ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Items ({order.items?.length || 0})
          </Text>
          {order.items && order.items.length > 0 ? (
            order.items.map((item, index) => {
              const imageUri = getProductImage(item.product || item);
              return (
                <View key={item._id || index} style={styles.itemCard}>
                  <View style={styles.itemImageContainer}>
                    {imageUri ? (
                      <Image source={{ uri: imageUri }} style={styles.itemImage} />
                    ) : (
                      <View style={styles.itemImagePlaceholder}>
                        <Ionicons name="cube-outline" size={22} color="#BDBDBD" />
                      </View>
                    )}
                  </View>
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {item.product?.name || item.name || 'Product'}
                    </Text>
                    <View style={styles.itemMetaRow}>
                      <Text style={styles.itemMeta}>
                        Qty: {item.quantity}
                      </Text>
                      <Text style={styles.itemMeta}>
                        × GH₵ {item.price?.toFixed(2)}
                      </Text>
                    </View>
                    <Text style={styles.itemTotal}>
                      GH₵ {((item.quantity || 0) * (item.price || 0)).toFixed(2)}
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyItems}>
              <Ionicons name="cube-outline" size={32} color="#D0D0D0" />
              <Text style={styles.noItemsText}>No items in this order</Text>
            </View>
          )}
        </View>

        {/* ── Delivery Schedule ── */}
        {order.deliverySchedule && (order.deliverySchedule.preferredDay || order.deliverySchedule.preferredTime) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Schedule</Text>
            <View style={styles.card}>
              <View style={styles.scheduleIconWrap}>
                <Ionicons name="calendar-outline" size={20} color="#2E7D32" />
              </View>
              <View style={styles.scheduleContent}>
                {order.deliverySchedule.preferredDay && (
                  <View style={styles.scheduleRow}>
                    <Text style={styles.scheduleLabel}>Day</Text>
                    <Text style={styles.scheduleValue}>
                      {order.deliverySchedule.preferredDay.charAt(0).toUpperCase() + order.deliverySchedule.preferredDay.slice(1)}
                    </Text>
                  </View>
                )}
                {order.deliverySchedule.preferredTime && (
                  <View style={styles.scheduleRow}>
                    <Text style={styles.scheduleLabel}>Time</Text>
                    <Text style={styles.scheduleValue}>
                      {order.deliverySchedule.preferredTime.charAt(0).toUpperCase() + order.deliverySchedule.preferredTime.slice(1)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F4' },

  // ── Header ──
  header: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.2 },
  headerOrderNum: { fontSize: 12, color: '#888', marginTop: 2, fontWeight: '500' },

  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 30 },

  // ── Status Banner ──
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    gap: 14,
  },
  statusIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusInfo: { flex: 1 },
  statusLabel: { fontSize: 16, fontWeight: '800', marginBottom: 3, textTransform: 'capitalize' },
  statusDate: { fontSize: 12, color: '#757575', fontWeight: '500' },

  // ── Section ──
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9E9E9E',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
    marginLeft: 4,
  },

  // ── Card ──
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  // ── Customer ──
  customerAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  customerAvatarText: { fontSize: 18, fontWeight: '800', color: '#2E7D32' },
  customerInfo: { flex: 1, justifyContent: 'center' },
  customerName: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },
  contactPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F1F8F3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  contactPillText: { fontSize: 12, color: '#2E7D32', fontWeight: '600' },

  // ── Address ──
  addressIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    marginTop: 2,
  },
  addressContent: { flex: 1 },
  addressText: { fontSize: 14, color: '#424242', lineHeight: 21, fontWeight: '500' },
  addressPhoneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F1F8F3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  addressPhoneText: { fontSize: 12, color: '#2E7D32', fontWeight: '600' },

  // ── Items ──
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  itemImageContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
    marginRight: 14,
  },
  itemImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  itemImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  itemDetails: { flex: 1, justifyContent: 'space-between' },
  itemName: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', marginBottom: 4, lineHeight: 19 },
  itemMetaRow: { flexDirection: 'row', gap: 4, marginBottom: 2 },
  itemMeta: { fontSize: 12, color: '#9E9E9E', fontWeight: '500' },
  itemTotal: { fontSize: 15, fontWeight: '800', color: '#1B5E20' },
  emptyItems: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  noItemsText: { fontSize: 14, color: '#BDBDBD', fontWeight: '500' },

  // ── Schedule ──
  scheduleIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  scheduleContent: { flex: 1, gap: 6 },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scheduleLabel: { fontSize: 13, color: '#9E9E9E', fontWeight: '500' },
  scheduleValue: { fontSize: 14, color: '#1A1A1A', fontWeight: '600', textTransform: 'capitalize' },
});

export default VendorOrderDetailScreen;