import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { triggerPayment } from '../services/paymentService';
import { usePaystack } from 'react-native-paystack-webview';
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

  // Pulsing animation for required badges
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const deliveryFee = cartTotal >= 200 ? 0 : 40;
  const total = cartTotal; //+ deliveryFee;

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
    { id: 'morning', label: 'Morning (8AM–12PM)', icon: 'sunny-outline' },
    { id: 'afternoon', label: 'Afternoon (12PM–4PM)', icon: 'partly-sunny-outline' },
    { id: 'evening', label: 'Evening (4PM–8PM)', icon: 'moon-outline' },
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

  const prepareOrderData = () => ({
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
    //paymentId,
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
      Alert.alert('Address Required', 'Please select or add a delivery address.');
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
      if (!paymentResult?.success) { setPlacingOrder(false); return; }

      const orderData = prepareOrderData();
      const res = await order(orderData, authToken);
      if (res.status===200) {
        clearCart();
        Alert.alert(
          'Order Confirmed! 🎉',
          `Order #${res.data.data.orderNumber || res.data.data._id} placed successfully.`,
          [
            { text: 'View Order', onPress: () => navigation.navigate('OrderDetail', { orderId: res.data.data.id }) },
            { text: 'Continue Shopping', onPress: () => navigation.navigate('MainTabs', { screen: 'Home' }) },
          ]
        );
       
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

  // ── REQUIRED BADGE ──
  const RequiredBadge = () => (
    <Animated.View style={[styles.requiredBadge, { transform: [{ scale: pulseAnim }] }]}>
      <Text style={styles.requiredBadgeText}>REQUIRED</Text>
    </Animated.View>
  );

  // ── SECTION HEADER ──
  const SectionHeader = ({ icon, title, required, filled }) => (
    <View style={styles.sectionHeaderRow}>
      <View style={[styles.sectionIconWrap, filled && styles.sectionIconWrapFilled]}>
        <Ionicons name={icon} size={18} color={filled ? '#fff' : '#2E7D32'} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
      {required && !filled && <RequiredBadge />}
      {filled && (
        <View style={styles.filledBadge}>
          <Ionicons name="checkmark-circle" size={16} color="#2E7D32" />
          <Text style={styles.filledBadgeText}>Done</Text>
        </View>
      )}
    </View>
  );

  const renderCartItem = (item, i) => {
    const p = item.product || item;
    const qty = item.quantity || 1;
    const price = p.price;
    const lineTotal = (qty * price).toFixed(2);
    return (
      <View key={i} style={[styles.cartRow, i === cartItems.length - 1 && { borderBottomWidth: 0 }]}>
        <Image source={{ uri: p.image || 'https://via.placeholder.com/64' }} style={styles.cartThumb} />
        <View style={styles.cartInfo}>
          <Text style={styles.cartName} numberOfLines={2}>{p.name}</Text>
          <Text style={styles.cartMeta}>{qty} × GH₵{price.toFixed(2)} • {p.unit || 'unit'}</Text>
          <Text style={styles.cartSubtotal}>GH₵ {lineTotal}</Text>
        </View>
      </View>
    );
  };

  const renderStepIndicator = () => (
    <View style={styles.stepBar}>
      {['Details', 'Delivery', 'Payment'].map((label, i) => (
        <React.Fragment key={i}>
          <View style={styles.stepItem}>
            <View style={[
              styles.stepDot,
              currentStep > i + 1 ? styles.stepDone : currentStep === i + 1 ? styles.stepActive : null,
            ]}>
              {currentStep > i + 1
                ? <Ionicons name="checkmark" size={14} color="#fff" />
                : <Text style={[styles.stepNumber, currentStep === i + 1 && { color: '#fff' }]}>{i + 1}</Text>
              }
            </View>
            <Text style={[styles.stepLabel, currentStep >= i + 1 && styles.stepLabelActive]}>{label}</Text>
          </View>
          {i < 2 && <View style={[styles.stepLine, currentStep > i + 1 && styles.stepLineDone]} />}
        </React.Fragment>
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
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.heroHeader}>
          <TouchableOpacity style={styles.heroBackBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.heroHeaderTitle}>Checkout</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.center}>
          <Ionicons name="cart-outline" size={80} color="#C8E6C9" />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate('Products')}>
            <Ionicons name="storefront-outline" size={18} color="#fff" />
            <Text style={styles.shopBtnText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar backgroundColor="#1B5E20" barStyle="light-content" />

      {/* ══════════════════════════════════════════
          RICH HERO HEADER
          ══════════════════════════════════════════ */}
      <View style={styles.heroHeader}>
        <TouchableOpacity style={styles.heroBackBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>

        <View style={styles.heroHeaderCenter}>
          <Text style={styles.heroHeaderTitle}>Checkout</Text>
          <Text style={styles.heroHeaderSub}>
            {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} · GH₵ {total.toFixed(2)}
          </Text>
        </View>

        {/* Secure badge */}
        <View style={styles.heroSecureBadge}>
          <Ionicons name="shield-checkmark" size={14} color="#A5D6A7" />
          <Text style={styles.heroSecureText}>Secure</Text>
        </View>
      </View>

      {/* ── STEP INDICATOR ── */}
      {renderStepIndicator()}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ══════════════════════════════════════════
              REQUIRED FIELDS CALLOUT BANNER
              Shown at the very top so users see it immediately
              ══════════════════════════════════════════ */}
          {(!selectedAddress || !paymentEmail) && (
            <View style={styles.requiredCallout}>
              <Ionicons name="alert-circle" size={20} color="#E65100" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.requiredCalloutTitle}>Action needed before checkout</Text>
                <Text style={styles.requiredCalloutBody}>
                  {[
                    !selectedAddress && '• Add or select a delivery address',
                    !paymentEmail && '• Enter your payment email',
                  ].filter(Boolean).join('\n')}
                </Text>
              </View>
            </View>
          )}

          {/* ══════════════════════════════════════════
              1 · DELIVERY ADDRESS  — REQUIRED
              ══════════════════════════════════════════ */}
          <View style={[styles.card, !selectedAddress && styles.cardHighlighted]}>
            <SectionHeader
              icon="location"
              title="Delivery Address"
              required
              filled={!!selectedAddress}
            />

            {/* Empty-state nudge when no address is set */}
            {!selectedAddress && !showAddAddress && (
              <View style={styles.emptyFieldNudge}>
                <Ionicons name="home-outline" size={36} color="#BDBDBD" />
                <Text style={styles.emptyFieldNudgeText}>Where should we deliver?</Text>
                <Text style={styles.emptyFieldNudgeSub}>
                  Tap "Add New Address" below to get started
                </Text>
              </View>
            )}

            {showAddAddress ? (
              <View style={styles.form}>
                <Text style={styles.formGroupLabel}>Street Address <Text style={styles.asterisk}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 12 Accra Road, East Legon"
                  value={newAddress.address}
                  onChangeText={t => setNewAddress({ ...newAddress, address: t })}
                />
                <Text style={styles.formGroupLabel}>City <Text style={styles.asterisk}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Accra"
                  value={newAddress.city}
                  onChangeText={t => setNewAddress({ ...newAddress, city: t })}
                />
                <Text style={styles.formGroupLabel}>Phone Number <Text style={styles.asterisk}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 0244000000"
                  value={newAddress.phone}
                  onChangeText={t => setNewAddress({ ...newAddress, phone: t })}
                  keyboardType="phone-pad"
                />
                <Text style={styles.formGroupLabel}>Nearest Landmark</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Behind Total Filling Station"
                  value={newAddress.nearestLandmark}
                  onChangeText={t => setNewAddress({ ...newAddress, nearestLandmark: t })}
                />
                <View style={styles.formActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddAddress(false)}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveBtn} onPress={handleAddAddress}>
                    <Ionicons name="checkmark" size={16} color="#fff" />
                    <Text style={styles.saveText}>Save Address</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                {addresses.map((addr, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.addressCard, selectedAddress === addr && styles.addressSelected]}
                    onPress={() => setSelectedAddress(addr)}
                  >
                    <View style={[styles.radioCircle, selectedAddress === addr && styles.radioCircleActive]}>
                      {selectedAddress === addr && <View style={styles.radioInner} />}
                    </View>
                    <View style={styles.addressContent}>
                      <Text style={styles.addressMain}>{addr.address}</Text>
                      <Text style={styles.addressSecondary}>{addr.city}{addr.phone ? ` · ${addr.phone}` : ''}</Text>
                    </View>
                    {selectedAddress === addr && (
                      <View style={styles.addressCheckBadge}>
                        <Ionicons name="checkmark-circle" size={20} color="#2E7D32" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  style={[styles.addNewBtn, !selectedAddress && styles.addNewBtnPrimary]}
                  onPress={() => setShowAddAddress(true)}
                >
                  <Ionicons name="add-circle" size={20} color={!selectedAddress ? '#fff' : '#2E7D32'} />
                  <Text style={[styles.addNewText, !selectedAddress && styles.addNewTextLight]}>
                    Add New Address
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* ══════════════════════════════════════════
              2 · PAYMENT EMAIL  — REQUIRED
              ══════════════════════════════════════════ */}
          <View style={[styles.card, !paymentEmail && styles.cardHighlighted]}>
            <SectionHeader
              icon="mail"
              title="Payment Email"
              required
              filled={!!paymentEmail && validateEmail(paymentEmail)}
            />

            <View style={styles.emailInfoBanner}>
              <Ionicons name="information-circle-outline" size={16} color="#1565C0" />
              <Text style={styles.emailInfoText}>
                Used to send your payment receipt and order confirmation
              </Text>
            </View>

            {/* Empty-state nudge */}
            {!paymentEmail && (
              <View style={styles.emptyEmailNudge}>
                <Text style={styles.emptyEmailNudgeText}>
                  📧 Enter your email to proceed to payment
                </Text>
              </View>
            )}

            <Text style={styles.formGroupLabel}>
              Email Address <Text style={styles.asterisk}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.emailInput,
                paymentEmailError ? styles.inputError : paymentEmail && validateEmail(paymentEmail) ? styles.inputSuccess : null,
              ]}
              placeholder="yourname@example.com"
              value={paymentEmail}
              onChangeText={t => {
                setPaymentEmail(t.trim());
                if (paymentEmailError && validateEmail(t.trim())) setPaymentEmailError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* Inline validation feedback */}
            {paymentEmailError ? (
              <View style={styles.fieldFeedbackRow}>
                <Ionicons name="close-circle" size={16} color="#D32F2F" />
                <Text style={styles.fieldError}>{paymentEmailError}</Text>
              </View>
            ) : paymentEmail && validateEmail(paymentEmail) ? (
              <View style={styles.fieldFeedbackRow}>
                <Ionicons name="checkmark-circle" size={16} color="#2E7D32" />
                <Text style={styles.fieldSuccess}>Looks good!</Text>
              </View>
            ) : null}
          </View>

          {/* ══════════════════════════════════════════
              3 · ORDER SUMMARY
              ══════════════════════════════════════════ */}
          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionIconWrap}>
                <Ionicons name="receipt-outline" size={18} color="#2E7D32" />
              </View>
              <Text style={styles.sectionTitle}>Order Summary</Text>
              <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('Cart')} disabled={placingOrder}>
                <Ionicons name="pencil-outline" size={14} color="#2E7D32" />
                <Text style={styles.editBtnText}>Edit Cart</Text>
              </TouchableOpacity>
            </View>

            {cartItems.map((item, i) => renderCartItem(item, i))}

            <View style={styles.summaryBreakdown}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal ({cartItems.length} item{cartItems.length !== 1 ? 's' : ''})</Text>
                <Text style={styles.summaryValue}>GH₵ {cartTotal.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery fee</Text>
                <Text style={[styles.summaryValue, deliveryFee === 0 && styles.freeText]}>
                  {deliveryFee === 0 ? '🎉 FREE' : `GH₵ ${deliveryFee.toFixed(2)}`}
                </Text>
              </View>
              {deliveryFee > 0 && (
                <View style={styles.freeDeliveryHint}>
                  <Ionicons name="information-circle-outline" size={14} color="#F57F17" />
                  <Text style={styles.freeDeliveryHintText}>
                    Add GH₵ {(200 - cartTotal).toFixed(2)} more for free delivery
                  </Text>
                </View>
              )}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalAmount}>GH₵ {total.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          {/* ══════════════════════════════════════════
              4 · DELIVERY SCHEDULE
              ══════════════════════════════════════════ */}
          <View style={styles.card}>
            <SectionHeader icon="calendar-outline" title="Delivery Schedule" filled={!!(deliveryDay && deliveryTime)} />

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
                  <View style={[styles.timeIconWrap, deliveryTime === time.id && styles.timeIconWrapActive]}>
                    <Ionicons name={time.icon} size={18} color={deliveryTime === time.id ? '#fff' : '#757575'} />
                  </View>
                  <Text style={[styles.timeText, deliveryTime === time.id && styles.timeTextActive]}>{time.label}</Text>
                  {deliveryTime === time.id && <Ionicons name="checkmark-circle" size={18} color="#2E7D32" style={{ marginLeft: 'auto' }} />}
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Delivery Note (optional)</Text>
            <TextInput
              style={[styles.input, styles.noteInput]}
              placeholder="e.g. Call when you arrive, leave at gate..."
              value={deliveryNote}
              onChangeText={setDeliveryNote}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={{ height: 200 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ══════════════════════════════════════════
          FIXED BOTTOM BAR
          ══════════════════════════════════════════ */}
      <View style={styles.bottomBar}>
        {/* Mini checklist so user knows what's still missing */}
        <View style={styles.checklistRow}>
          <View style={styles.checklistItem}>
            <Ionicons
              name={selectedAddress ? 'checkmark-circle' : 'ellipse-outline'}
              size={16}
              color={selectedAddress ? '#2E7D32' : '#BDBDBD'}
            />
            <Text style={[styles.checklistText, selectedAddress && styles.checklistTextDone]}>Address</Text>
          </View>
          <View style={styles.checklistDivider} />
          <View style={styles.checklistItem}>
            <Ionicons
              name={paymentEmail && validateEmail(paymentEmail) ? 'checkmark-circle' : 'ellipse-outline'}
              size={16}
              color={paymentEmail && validateEmail(paymentEmail) ? '#2E7D32' : '#BDBDBD'}
            />
            <Text style={[styles.checklistText, paymentEmail && validateEmail(paymentEmail) && styles.checklistTextDone]}>
              Email
            </Text>
          </View>
          <View style={styles.checklistDivider} />
          <View style={styles.checklistItem}>
            <Ionicons name="checkmark-circle" size={16} color="#2E7D32" />
            <Text style={[styles.checklistText, styles.checklistTextDone]}>Schedule</Text>
          </View>
        </View>

        <View style={styles.bottomSummary}>
          <View>
            <Text style={styles.bottomLabel}>Total to pay</Text>
            <Text style={styles.bottomDelivery}>
              {deliveryFee === 0 ? '✅ Free delivery included' : `+ GH₵${deliveryFee.toFixed(2)} delivery`}
            </Text>
          </View>
          <Text style={styles.bottomTotal}>GH₵ {total.toFixed(2)}</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.confirmBtn,
            placingOrder && styles.confirmBtnDisabled,
            (!selectedAddress || !paymentEmail) && styles.confirmBtnIncomplete,
          ]}
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
              <Text style={styles.confirmText}>Pay Securely · GH₵ {total.toFixed(2)}</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.termsNote}>
          🔒 Secured by Paystack · By continuing you agree to our Terms
        </Text>
      </View>
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F1' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  centerText: { marginTop: 16, fontSize: 16, color: '#64748b' },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#1B5E20', marginTop: 16, marginBottom: 24 },
  shopBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#2E7D32', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 14,
  },
  shopBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  // ══ HERO HEADER ══
  heroHeader: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  heroBackBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  heroHeaderCenter: { flex: 1, alignItems: 'center' },
  heroHeaderTitle: { fontSize: 19, fontWeight: '800', color: '#fff', letterSpacing: 0.2 },
  heroHeaderSub: { fontSize: 12, color: '#A5D6A7', marginTop: 2, fontWeight: '500' },
  heroSecureBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
  },
  heroSecureText: { fontSize: 11, color: '#A5D6A7', fontWeight: '700' },

  // ══ STEP INDICATOR ══
  stepBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E8F5E9',
  },
  stepItem: { alignItems: 'center' },
  stepLine: { width: 40, height: 2, backgroundColor: '#E0E0E0', marginHorizontal: 4, marginBottom: 18 },
  stepLineDone: { backgroundColor: '#4CAF50' },
  stepDot: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center', alignItems: 'center',
  },
  stepActive: { backgroundColor: '#2E7D32' },
  stepDone: { backgroundColor: '#4CAF50' },
  stepNumber: { color: '#9E9E9E', fontWeight: '700', fontSize: 13 },
  stepLabel: { marginTop: 5, fontSize: 11, color: '#9E9E9E', fontWeight: '500' },
  stepLabelActive: { color: '#1B5E20', fontWeight: '700' },

  scrollContent: { paddingVertical: 12 },

  // ══ REQUIRED CALLOUT BANNER ══
  requiredCallout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF3E0',
    borderLeftWidth: 4,
    borderLeftColor: '#E65100',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 14,
  },
  requiredCalloutTitle: { fontSize: 13, fontWeight: '700', color: '#BF360C', marginBottom: 4 },
  requiredCalloutBody: { fontSize: 12, color: '#E65100', lineHeight: 18 },

  // ══ CARD ══
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  // Orange-tinted border when a required card is empty
  cardHighlighted: {
    borderWidth: 2,
    borderColor: '#FF8F00',
  },

  // ══ SECTION HEADER ══
  sectionHeaderRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 18,
  },
  sectionIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  sectionIconWrapFilled: { backgroundColor: '#2E7D32' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1B5E20', flex: 1 },

  // Pulsing "REQUIRED" badge
  requiredBadge: {
    backgroundColor: '#D32F2F',
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  requiredBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  // "Done" badge
  filledBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E8F5E9', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  filledBadgeText: { color: '#2E7D32', fontSize: 11, fontWeight: '700' },

  // ══ EMPTY-STATE NUDGES ══
  emptyFieldNudge: {
    alignItems: 'center', paddingVertical: 20,
    backgroundColor: '#FAFAFA', borderRadius: 12,
    borderWidth: 1.5, borderColor: '#E0E0E0', borderStyle: 'dashed',
    marginBottom: 16,
  },
  emptyFieldNudgeText: { fontSize: 15, fontWeight: '600', color: '#616161', marginTop: 8 },
  emptyFieldNudgeSub: { fontSize: 12, color: '#9E9E9E', marginTop: 4, textAlign: 'center' },

  emptyEmailNudge: {
    backgroundColor: '#FFF8E1', borderRadius: 10, padding: 12, marginBottom: 14,
    borderWidth: 1, borderColor: '#FFE082',
  },
  emptyEmailNudgeText: { fontSize: 13, color: '#F57F17', fontWeight: '600', textAlign: 'center' },

  emailInfoBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#E3F2FD', borderRadius: 10,
    padding: 10, marginBottom: 14,
  },
  emailInfoText: { flex: 1, fontSize: 12, color: '#1565C0', lineHeight: 16 },

  // ══ FORM ══
  form: { marginTop: 4 },
  formGroupLabel: { fontSize: 13, fontWeight: '600', color: '#424242', marginBottom: 6, marginTop: 4 },
  asterisk: { color: '#D32F2F' },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12, padding: 14,
    fontSize: 15, borderWidth: 1.5,
    borderColor: '#E0E0E0', marginBottom: 14, color: '#212121',
  },
  emailInput: { fontSize: 16, letterSpacing: 0.2 },
  inputError: { borderColor: '#D32F2F', backgroundColor: '#FFF5F5' },
  inputSuccess: { borderColor: '#2E7D32', backgroundColor: '#F1F8E9' },
  noteInput: { minHeight: 80, textAlignVertical: 'top', paddingTop: 12 },

  fieldFeedbackRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -8, marginBottom: 8 },
  fieldError: { color: '#D32F2F', fontSize: 13 },
  fieldSuccess: { color: '#2E7D32', fontSize: 13, fontWeight: '600' },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: '#1B5E20', marginBottom: 10 },

  formActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#F5F5F5', alignItems: 'center' },
  cancelText: { color: '#616161', fontWeight: '600' },
  saveBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#2E7D32', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  saveText: { color: '#fff', fontWeight: '700' },

  // ══ ADDRESS CARDS ══
  addressCard: {
    flexDirection: 'row', padding: 14,
    borderRadius: 12, borderWidth: 1.5, borderColor: '#E0E0E0',
    marginBottom: 10, alignItems: 'center', backgroundColor: '#FAFAFA',
  },
  addressSelected: { borderColor: '#2E7D32', backgroundColor: '#F1F8E9' },
  radioCircle: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: '#BDBDBD',
    justifyContent: 'center', alignItems: 'center',
  },
  radioCircleActive: { borderColor: '#2E7D32' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2E7D32' },
  addressContent: { flex: 1, marginLeft: 12 },
  addressMain: { fontSize: 14, fontWeight: '600', color: '#212121' },
  addressSecondary: { fontSize: 13, color: '#757575', marginTop: 3 },
  addressCheckBadge: { marginLeft: 8 },

  addNewBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 14, borderWidth: 2, borderColor: '#2E7D32',
    borderStyle: 'dashed', borderRadius: 12, marginTop: 4, gap: 8,
  },
  addNewBtnPrimary: {
    backgroundColor: '#2E7D32', borderStyle: 'solid',
  },
  addNewText: { color: '#2E7D32', fontWeight: '700', fontSize: 15 },
  addNewTextLight: { color: '#fff' },

  // ══ ORDER SUMMARY ══
  cartRow: {
    flexDirection: 'row', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  cartThumb: { width: 60, height: 60, borderRadius: 10, backgroundColor: '#F5F5F5' },
  cartInfo: { flex: 1, marginLeft: 14 },
  cartName: { fontSize: 14, fontWeight: '600', color: '#212121', marginBottom: 4 },
  cartMeta: { fontSize: 12, color: '#757575', marginBottom: 4 },
  cartSubtotal: { fontSize: 14, fontWeight: '700', color: '#2E7D32' },

  summaryBreakdown: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel: { fontSize: 14, color: '#616161' },
  summaryValue: { fontSize: 14, fontWeight: '600', color: '#212121' },
  freeText: { color: '#2E7D32', fontWeight: '800' },
  freeDeliveryHint: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFF8E1', borderRadius: 8, padding: 10, marginBottom: 10,
  },
  freeDeliveryHintText: { fontSize: 12, color: '#F57F17', fontWeight: '500' },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E0E0E0',
  },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#1B5E20' },
  totalAmount: { fontSize: 22, fontWeight: '800', color: '#1B5E20' },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    backgroundColor: '#F1F8E9', borderRadius: 8,
  },
  editBtnText: { color: '#2E7D32', fontWeight: '600', fontSize: 13 },

  // ══ SCHEDULE ══
  dayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  dayBtn: {
    flex: 1, minWidth: '22%', paddingVertical: 12,
    borderRadius: 10, backgroundColor: '#F8FAFC',
    borderWidth: 1.5, borderColor: '#E0E0E0', alignItems: 'center',
  },
  dayBtnActive: { backgroundColor: '#E8F5E9', borderColor: '#2E7D32' },
  dayText: { fontSize: 13, color: '#616161', fontWeight: '600' },
  dayTextActive: { color: '#1B5E20', fontWeight: '800' },

  timeList: { gap: 10 },
  timeBtn: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, borderRadius: 12,
    backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E0E0E0',
    gap: 12,
  },
  timeBtnActive: { backgroundColor: '#E8F5E9', borderColor: '#2E7D32' },
  timeIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center', alignItems: 'center',
  },
  timeIconWrapActive: { backgroundColor: '#2E7D32' },
  timeText: { fontSize: 14, color: '#616161' },
  timeTextActive: { color: '#1B5E20', fontWeight: '600' },

  // ══ BOTTOM BAR ══
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', padding: 16,
    borderTopWidth: 1, borderTopColor: '#E8F5E9',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 16,
  },
  checklistRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginBottom: 12, gap: 8,
  },
  checklistItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  checklistDivider: { width: 20, height: 1, backgroundColor: '#E0E0E0' },
  checklistText: { fontSize: 12, color: '#BDBDBD', fontWeight: '600' },
  checklistTextDone: { color: '#2E7D32' },

  bottomSummary: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  bottomLabel: { fontSize: 14, color: '#616161', fontWeight: '500' },
  bottomDelivery: { fontSize: 12, color: '#757575', marginTop: 2 },
  bottomTotal: { fontSize: 24, fontWeight: '800', color: '#1B5E20' },

  confirmBtn: {
    backgroundColor: '#2E7D32', paddingVertical: 17, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  confirmBtnDisabled: { backgroundColor: '#A5D6A7' },
  confirmBtnIncomplete: { backgroundColor: '#81C784' },
  confirmText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  termsNote: { fontSize: 11, color: '#9E9E9E', textAlign: 'center', marginTop: 10 },
});

export default OrderScreen;