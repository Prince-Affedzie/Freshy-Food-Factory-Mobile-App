import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { triggerPayment } from '../services/paymentService';
import { usePaystack } from "react-native-paystack-webview";
import { order } from '../apis/orderApi';

const OrderScreen = ({ route }) => {
  const navigation = useNavigation();
  const { cartItems, cartTotal, clearCart, refreshCart, loading: cartLoading } = useCart();
  const { user, token } = useAuth();
  const { package: packageInfo } = route.params || {};
  const { popup } = usePaystack();

  const [loading, setLoading] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [deliveryDay, setDeliveryDay] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [paymentEmail, setPaymentEmail] = useState('');
  const [paymentEmailError, setPaymentEmailError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);

  const [newAddress, setNewAddress] = useState({
    address: '',
    city: '',
    region: '',
    nearestLandmark: '',
    phone: user?.phone || '',
  });

  const deliveryFee = cartTotal >= 200 ? 0 : 40;
  const total = cartTotal + deliveryFee;

  const deliveryDays = [
    { id: 'monday', label: 'Mon' },
    { id: 'tuesday', label: 'Tue' },
    { id: 'wednesday', label: 'Wed' },
    { id: 'thursday', label: 'Thu' },
    { id: 'friday', label: 'Fri' },
    { id: 'saturday', label: 'Sat' },
    { id: 'sunday', label: 'Sun' },
  ];

  const deliveryTimes = [
    { id: 'morning', label: 'Morning (8AM–12PM)', icon: 'sunny' },
    { id: 'afternoon', label: 'Afternoon (12PM–4PM)', icon: 'partly-sunny' },
    { id: 'evening', label: 'Evening (4PM–8PM)', icon: 'moon' },
  ];

  useEffect(() => {
    loadUserAddresses();
    const today = new Date().getDay();
    const nextDay = deliveryDays[(today + 1) % 7];
    setDeliveryDay(nextDay.id);
    setDeliveryTime('afternoon');
    refreshCart();
  }, []);

  const loadUserAddresses = async () => {
    try {
      if (user?.addresses?.length > 0) {
        setAddresses(user.addresses);
        const def = user.addresses.find(a => a.isDefault) || user.addresses[0];
        setSelectedAddress(def);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleAddAddress = () => {
    if (!newAddress.address || !newAddress.city || !newAddress.phone) {
      Alert.alert('Missing Fields', 'Please fill address, city and phone.');
      return;
    }

    const addr = { ...newAddress, isDefault: addresses.length === 0 };
    setAddresses(prev => [...prev, addr]);
    setSelectedAddress(addr);
    setShowAddAddress(false);
    setNewAddress({ address: '', city: '', region: '', nearestLandmark: '', phone: user?.phone || '' });
  };

  const prepareOrderItems = () =>
    cartItems.map(item => ({
      productId: item.product?._id || item.productId || item.id,
      name: item.product?.name || item.name,
      quantity: item.quantity || 1,
      unit: item.product?.unit || 'piece',
      price: item.product?.price || item.price,
      product: item.product?._id || item.productId || item.id,
    }));

  const prepareOrderData = (paymentId) => ({
    orderItems: prepareOrderItems(),
    shippingAddress: {
      address: selectedAddress.address,
      city: selectedAddress.city,
      region: selectedAddress.region || '',
      nearestLandmark: selectedAddress.nearestLandmark || '',
      phone: selectedAddress.phone || user?.phone,
    },
    deliverySchedule: { preferredDay: deliveryDay, preferredTime: deliveryTime },
    deliveryNote: deliveryNote.trim(),
    paymentId,
    paymentMethod: 'paystack',
    ...(packageInfo && {
      package: {
        id: packageInfo.id || packageInfo._id,
        name: packageInfo.name,
        basePrice: packageInfo.price,
        valuePrice: packageInfo.originalPrice || null,
      },
    }),
  });

  const isFormValid = () => {
    if (cartItems.length === 0) {
      Alert.alert('Cart Empty', 'Add items first.');
      navigation.navigate('Products');
      return false;
    }
    if (!selectedAddress) {
      Alert.alert('Address Required', 'Please select or add delivery address.');
      return false;
    }
    if (!deliveryDay || !deliveryTime) {
      Alert.alert('Schedule Required', 'Please choose delivery day and time.');
      return false;
    }
    if (!paymentEmail.trim()) {
      setPaymentEmailError('Email is required for payment');
      return false;
    }
    if (!validateEmail(paymentEmail)) {
      setPaymentEmailError('Invalid email format');
      return false;
    }

    const outOfStock = cartItems.filter(item => {
      const stock = item.product?.countInStock ?? item.product?.stock ?? 0;
      return stock < (item.quantity || 1);
    });

    if (outOfStock.length > 0) {
      Alert.alert(
        'Stock Issue',
        `Not enough stock for: ${outOfStock.map(i => i.product?.name || i.name).join(', ')}`,
        [{ text: 'OK', onPress: () => navigation.navigate('Cart') }]
      );
      return false;
    }

    return true;
  };

  const handlePlaceOrder = async () => {
    if (!isFormValid()) return;

    setPlacingOrder(true);

    try {
      const authToken = token || (await AsyncStorage.getItem('@freshyfood_token'));
      if (!authToken) {
        Alert.alert('Login Required', 'Please sign in to continue.');
        navigation.navigate('Login');
        return;
      }

      const paymentResult = await triggerPayment({
        popup,
        email: paymentEmail.trim(),
        phone: user?.phone || selectedAddress?.phone,
        amount: total,
        authToken,
      });

      if (!paymentResult?.success) {
        setPlacingOrder(false);
        return;
      }

      const orderData = prepareOrderData(paymentResult.paymentId);
      const res = await order(orderData, authToken);

      if (res.data?.success) {
        clearCart();
        Alert.alert(
          'Order Confirmed!',
          `Order #${res.data.data.orderNumber || res.data.data._id} placed successfully.`,
          [
            { text: 'View Order', onPress: () => navigation.navigate('OrderDetail', { orderId: res.data.data.id }) },
            { text: 'Continue Shopping', onPress: () => navigation.navigate('MainTabs', { screen: 'Home' }) },
          ]
        );
        navigation.navigate('OrderConfirmation', { orderId: res.data.data.id, orderData: res.data.data });
      } else {
        Alert.alert('Order Failed', res.data?.message || 'Something went wrong.');
      }
    } catch (err) {
      console.error(err);
      setPlacingOrder(false);

      if (err.response) {
        if (err.response.status === 400 && err.response.data.outOfStockItems) {
          const names = err.response.data.outOfStockItems.map(i => i.name).join(', ');
          Alert.alert('Stock Error', `Out of stock: ${names}`, [{ text: 'OK', onPress: () => navigation.navigate('Cart') }]);
        } else if (err.response.status === 401) {
          Alert.alert('Session Expired', 'Please sign in again.');
          navigation.navigate('Login');
        } else {
          Alert.alert('Error', err.response.data?.message || 'Failed to process order.');
        }
      } else {
        Alert.alert('Network Error', 'Please check your connection and try again.');
      }
    }
  };

  const renderCartItem = ({ item }) => {
    const p = item.product || item;
    const qty = item.quantity || 1;
    const price = p.price;
    const total = (qty * price).toFixed(2);

    return (
      <View style={styles.cartRow}>
        <Image source={{ uri: p.image || 'https://via.placeholder.com/64' }} style={styles.cartThumb} />
        <View style={styles.cartInfo}>
          <Text style={styles.cartName} numberOfLines={2}>{p.name}</Text>
          <Text style={styles.cartMeta}>
            {qty} × GH₵{price.toFixed(2)} • {p.unit || 'unit'}
          </Text>
          <Text style={styles.cartSubtotal}>GH₵{total}</Text>
        </View>
      </View>
    );
  };

  const renderStepIndicator = () => (
    <View style={styles.stepBar}>
      {['Details', 'Delivery', 'Payment'].map((label, i) => (
        <View key={i} style={styles.stepItem}>
          <View style={[styles.stepDot, currentStep > i + 1 ? styles.stepDone : currentStep === i + 1 && styles.stepActive]}>
            {currentStep > i + 1 ? (
              <Ionicons name="checkmark" size={14} color="#fff" />
            ) : (
              <Text style={styles.stepNumber}>{i + 1}</Text>
            )}
          </View>
          <Text style={[styles.stepLabel, currentStep >= i + 1 && styles.stepLabelActive]}>{label}</Text>
        </View>
      ))}
    </View>
  );

  if (cartLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.centerText}>Preparing checkout...</Text>
      </View>
    );
  }

  if (cartItems.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Checkout" showBack onBackPress={() => navigation.goBack()} />
        <View style={styles.center}>
          <Ionicons name="cart-outline" size={80} color="#e0e0e0" />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate('Products')}>
            <Text style={styles.shopBtnText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Checkout" showBack onBackPress={() => navigation.goBack()} />

      {renderStepIndicator()}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* ORDER SUMMARY */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="receipt-outline" size={20} color="#2E7D32" />
              <Text style={styles.cardTitle}>Order Summary</Text>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => navigation.navigate('Cart')}
                disabled={placingOrder}
              >
                <Ionicons name="pencil" size={16} color="#4CAF50" />
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
            </View>

            {cartItems.map((item, i) => renderCartItem({ item, index: i }))}

            <View style={styles.summaryBreakdown}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal ({cartItems.length} items)</Text>
                <Text style={styles.summaryValue}>GH₵ {cartTotal.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery</Text>
                <Text style={[styles.summaryValue, deliveryFee === 0 && styles.free]}>
                  {deliveryFee === 0 ? 'FREE' : `GH₵ ${deliveryFee.toFixed(2)}`}
                </Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalAmount}>GH₵ {total.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          {/* DELIVERY ADDRESS */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="location-outline" size={20} color="#2E7D32" />
              <Text style={styles.cardTitle}>Delivery Address</Text>
            </View>

            {showAddAddress ? (
              <View style={styles.form}>
                <TextInput style={styles.input} placeholder="Street Address *" value={newAddress.address} onChangeText={t => setNewAddress({ ...newAddress, address: t })} />
                <TextInput style={styles.input} placeholder="City *" value={newAddress.city} onChangeText={t => setNewAddress({ ...newAddress, city: t })} />
                <TextInput style={styles.input} placeholder="Phone Number *" value={newAddress.phone} onChangeText={t => setNewAddress({ ...newAddress, phone: t })} keyboardType="phone-pad" />
                <View style={styles.formActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddAddress(false)}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveBtn} onPress={handleAddAddress}>
                    <Text style={styles.saveText}>Save Address</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                {addresses.length > 0 ? (
                  addresses.map((addr, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[styles.addressCard, selectedAddress === addr && styles.addressSelected]}
                      onPress={() => setSelectedAddress(addr)}
                    >
                      <Ionicons name={selectedAddress === addr ? 'radio-button-on' : 'radio-button-off'} size={20} color="#4CAF50" />
                      <View style={styles.addressContent}>
                        <Text style={styles.addressMain}>{addr.address}</Text>
                        <Text style={styles.addressSecondary}>{addr.city} • {addr.phone}</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.noData}>No saved addresses yet</Text>
                )}

                <TouchableOpacity style={styles.addNewBtn} onPress={() => setShowAddAddress(true)}>
                  <Ionicons name="add" size={20} color="#4CAF50" />
                  <Text style={styles.addNewText}>Add New Address</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* DELIVERY SCHEDULE */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="calendar-outline" size={20} color="#2E7D32" />
              <Text style={styles.cardTitle}>Delivery Schedule</Text>
            </View>

            <Text style={styles.fieldLabel}>Preferred Day</Text>
            <View style={styles.dayGrid}>
              {deliveryDays.map(day => (
                <TouchableOpacity
                  key={day.id}
                  style={[styles.dayBtn, deliveryDay === day.id && styles.dayBtnActive]}
                  onPress={() => setDeliveryDay(day.id)}
                >
                  <Text style={[styles.dayText, deliveryDay === day.id && styles.dayTextActive]}>{day.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Preferred Time</Text>
            <View style={styles.timeList}>
              {deliveryTimes.map(time => (
                <TouchableOpacity
                  key={time.id}
                  style={[styles.timeBtn, deliveryTime === time.id && styles.timeBtnActive]}
                  onPress={() => setDeliveryTime(time.id)}
                >
                  <Ionicons name={time.icon} size={18} color={deliveryTime === time.id ? '#4CAF50' : '#757575'} />
                  <Text style={[styles.timeText, deliveryTime === time.id && styles.timeTextActive]}>{time.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* PAYMENT EMAIL */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="mail-outline" size={20} color="#2E7D32" />
              <Text style={styles.cardTitle}>Payment Email</Text>
            </View>
            <Text style={styles.fieldLabel}>Email for receipt & confirmation *</Text>
            <TextInput
              style={[styles.input, paymentEmailError && styles.inputError]}
              placeholder="your.email@example.com"
              value={paymentEmail}
              onChangeText={t => {
                setPaymentEmail(t.trim());
                if (paymentEmailError && validateEmail(t.trim())) setPaymentEmailError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {paymentEmailError && <Text style={styles.fieldError}>{paymentEmailError}</Text>}
          </View>

          {/* BOTTOM SPACER */}
          <View style={{ height: 180 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* FIXED BOTTOM BAR */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomSummary}>
          <View>
            <Text style={styles.bottomLabel}>Total</Text>
            <Text style={styles.bottomDelivery}>
              {deliveryFee === 0 ? 'Free delivery' : `Delivery: GH₵${deliveryFee.toFixed(2)}`}
            </Text>
          </View>
          <Text style={styles.bottomTotal}>GH₵ {total.toFixed(2)}</Text>
        </View>

        <TouchableOpacity
          style={[styles.confirmBtn, placingOrder && styles.confirmBtnDisabled]}
          onPress={handlePlaceOrder}
          disabled={placingOrder}
        >
          {placingOrder ? (
            <>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.confirmText}>Processing...</Text>
            </>
          ) : (
            <>
              <Ionicons name="lock-closed" size={18} color="#fff" />
              <Text style={styles.confirmText}>Pay Securely</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.termsNote}>By continuing you agree to our Terms & Privacy Policy</Text>
      </View>
    </SafeAreaView>
  );
};

// ────────────────────────────────────────────────
// Styles (cleaner, more premium look)
// ────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  centerText: { marginTop: 16, fontSize: 16, color: '#64748b' },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#1e293b', marginTop: 16 },
  shopBtn: { marginTop: 24, backgroundColor: '#4f46e5', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12 },
  shopBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },

  stepBar: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  stepItem: { alignItems: 'center' },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepActive: { backgroundColor: '#4f46e5' },
  stepDone: { backgroundColor: '#10b981' },
  stepNumber: { color: '#64748b', fontWeight: '600' },
  stepLabel: { marginTop: 6, fontSize: 12, color: '#64748b' },
  stepLabelActive: { color: '#1e293b', fontWeight: '600' },

  scrollContent: { paddingBottom: 220 },

  card: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginLeft: 10, flex: 1 },

  cartRow: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  cartThumb: { width: 64, height: 64, borderRadius: 10, backgroundColor: '#f1f5f9' },
  cartInfo: { flex: 1, marginLeft: 16 },
  cartName: { fontSize: 15, fontWeight: '600', color: '#1e293b', marginBottom: 4 },
  cartMeta: { fontSize: 13, color: '#64748b', marginBottom: 4 },
  cartSubtotal: { fontSize: 14, fontWeight: '700', color: '#10b981' },

  summaryBreakdown: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel: { fontSize: 15, color: '#475569' },
  summaryValue: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  free: { color: '#10b981', fontWeight: '700' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  totalLabel: { fontSize: 17, fontWeight: '700', color: '#1e293b' },
  totalAmount: { fontSize: 22, fontWeight: '800', color: '#10b981' },

  form: { marginTop: 8 },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  inputError: { borderColor: '#ef4444' },
  formActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center' },
  cancelText: { color: '#475569', fontWeight: '600' },
  saveBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#4f46e5', alignItems: 'center' },
  saveText: { color: 'white', fontWeight: '700' },

  addressCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  addressSelected: { borderColor: '#4f46e5', backgroundColor: '#f0fdfa' },
  addressContent: { flex: 1, marginLeft: 12 },
  addressMain: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  addressSecondary: { fontSize: 14, color: '#64748b', marginTop: 4 },

  addNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: '#4f46e5',
    borderStyle: 'dashed',
    borderRadius: 12,
    marginTop: 8,
  },
  addNewText: { color: '#4f46e5', fontWeight: '700', marginLeft: 8 },

  dayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  dayBtn: {
    flex: 1,
    minWidth: '22%',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  dayBtnActive: { backgroundColor: '#ecfdf5', borderColor: '#10b981' },
  dayText: { fontSize: 14, color: '#475569', fontWeight: '600' },
  dayTextActive: { color: '#10b981' },

  timeList: { gap: 10 },
  timeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  timeBtnActive: { backgroundColor: '#ecfdf5', borderColor: '#10b981' },
  timeText: { marginLeft: 12, fontSize: 15, color: '#475569' },
  timeTextActive: { color: '#10b981', fontWeight: '600' },

  fieldLabel: { fontSize: 15, fontWeight: '600', color: '#1e293b', marginBottom: 8 },
  fieldError: { color: '#ef4444', fontSize: 13, marginTop: 6 },

  editBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#f0fdf4', borderRadius: 8 },
  editBtnText: { color: '#15803d', fontWeight: '600', marginLeft: 4 },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 16,
  },
  bottomSummary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  bottomLabel: { fontSize: 15, color: '#475569' },
  bottomDelivery: { fontSize: 13, color: '#64748b', marginTop: 2 },
  bottomTotal: { fontSize: 22, fontWeight: '800', color: '#10b981' },
  confirmBtn: {
    backgroundColor: '#4caf50',
    paddingVertical: 18,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  confirmBtnDisabled: { backgroundColor: '#a5b4fc' },
  confirmText: { color: 'white', fontSize: 17, fontWeight: '700' },
  termsNote: { fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 12 },
});

export default OrderScreen;