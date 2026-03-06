// src/screens/main/SupportScreen.js
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  StatusBar,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const SupportScreen = ({ navigation }) => {
  const [activeFAQ, setActiveFAQ] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState('general');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const supportTopics = [
    { id: 'order', label: 'Orders', icon: 'receipt-outline' },
    { id: 'delivery', label: 'Delivery', icon: 'bicycle-outline' },
    { id: 'account', label: 'Account', icon: 'person-outline' },
    { id: 'payment', label: 'Payment', icon: 'card-outline' },
    { id: 'product', label: 'Quality', icon: 'leaf-outline' },
    { id: 'general', label: 'General', icon: 'help-circle-outline' },
  ];

  const faqs = [
    {
      id: 1,
      question: 'How do I place an order?',
      answer: 'Browse products and add items to your cart, then proceed to checkout. Select your delivery time and address, choose a payment method, and confirm your order. It\'s that simple!',
      category: 'order',
    },
    {
      id: 2,
      question: 'What are your delivery hours?',
      answer: 'We deliver daily from 7:00 AM to 9:00 PM. During checkout you can schedule a convenient delivery time slot that works best for you.',
      category: 'delivery',
    },
    {
      id: 3,
      question: 'How can I track my order?',
      answer: 'Navigate to "My Orders" in your account to view real-time order status and delivery tracking. You\'ll also receive SMS notifications at every stage.',
      category: 'order',
    },
    {
      id: 4,
      question: 'What payment methods do you accept?',
      answer: 'We accept mobile money (MTN, Vodafone, AirtelTigo), bank transfers, and cash on delivery for selected areas.',
      category: 'payment',
    },
    {
      id: 5,
      question: 'How do I reset my password?',
      answer: 'On the login screen, tap "Forgot Password" and enter your registered phone number or email to receive a secure reset link.',
      category: 'account',
    },
    {
      id: 6,
      question: 'What is your return policy?',
      answer: 'We accept returns within 24 hours for damaged or incorrect items. Contact support immediately with clear photos of the issue for a swift resolution.',
      category: 'product',
    },
    {
      id: 7,
      question: 'Do you offer bulk discounts?',
      answer: 'Yes! Contact our business sales team at freshyfoodfactory@gmail.com for special pricing on large orders for offices, restaurants, or events.',
      category: 'general',
    },
    {
      id: 8,
      question: 'How fresh are your products?',
      answer: 'We source directly from local farms and deliver within 24 hours of harvest. All products are stored in temperature-controlled facilities to preserve freshness.',
      category: 'product',
    },
  ];

  const handleCall = (phoneNumber) => {
    Alert.alert('Call Support', `Do you want to call ${phoneNumber}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Call', onPress: () => Linking.openURL(`tel:${phoneNumber}`) },
    ]);
  };

  const handleEmail = () => {
    Linking.openURL('mailto:freshyfoodfactory@gmail.com?subject=FreshyFood Support Request');
  };

  const handleWhatsApp = () => {
    Linking.openURL('https://wa.me/233505671577?text=Hello%20FreshyFood%20Support');
  };

  const handleFAQToggle = (id) => {
    setActiveFAQ(activeFAQ === id ? null : id);
  };

  const filteredFAQs =
    selectedTopic === 'all' ? faqs : faqs.filter((faq) => faq.category === selectedTopic);

  // Quick contact channels
  const channels = [
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      sub: 'Instant reply',
      icon: 'logo-whatsapp',
      color: '#25D366',
      bg: '#F0FDF4',
      onPress: handleWhatsApp,
    },
    {
      id: 'call',
      label: 'Call Us',
      sub: '+233 50 567 1577',
      icon: 'call',
      color: '#1565C0',
      bg: '#EFF6FF',
      onPress: () => handleCall('+233505671577'),
    },
    {
      id: 'email',
      label: 'Email',
      sub: 'Within 2 hours',
      icon: 'mail',
      color: '#C62828',
      bg: '#FEF2F2',
      onPress: handleEmail,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar backgroundColor="#1B5E20" barStyle="light-content" />

      {/* ── TOP BAR ── */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Help & Support</Text>
        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
        >
          <Ionicons name="home-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── HERO ── */}
        <View style={styles.hero}>
          {/* Decorative circles */}
          <View style={styles.heroCircle1} />
          <View style={styles.heroCircle2} />
          <View style={styles.heroCircle3} />

          <View style={styles.heroIconRing}>
            <View style={styles.heroIconInner}>
              <Ionicons name="headset" size={34} color="#2E7D32" />
            </View>
          </View>
          <Text style={styles.heroTitle}>How can we help?</Text>
          <Text style={styles.heroSub}>
            Our team is ready to assist you{'\n'}every step of the way
          </Text>

          {/* Availability pill */}
          <View style={styles.availPill}>
            <View style={styles.availDot} />
            <Text style={styles.availText}>Support available · 7AM – 9PM daily</Text>
          </View>
        </View>

        {/* ── CONTACT CHANNELS ── */}
        <View style={styles.channelsCard}>
          <Text style={styles.cardLabel}>REACH US VIA</Text>
          <View style={styles.channelsRow}>
            {channels.map((ch) => (
              <TouchableOpacity
                key={ch.id}
                style={[styles.channelBtn, { backgroundColor: ch.bg }]}
                onPress={ch.onPress}
                activeOpacity={0.75}
              >
                <View style={[styles.channelIconWrap, { backgroundColor: ch.color }]}>
                  <Ionicons name={ch.icon} size={22} color="#fff" />
                </View>
                <Text style={[styles.channelLabel, { color: ch.color }]}>{ch.label}</Text>
                <Text style={styles.channelSub}>{ch.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── BUSINESS CONTACT CARD ── */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <View style={styles.cardTitleIcon}>
              <Ionicons name="business" size={16} color="#2E7D32" />
            </View>
            <Text style={styles.cardTitle}>Business Inquiries</Text>
            <View style={styles.hoursTag}>
              <Text style={styles.hoursTagText}>8AM – 5PM · Weekdays</Text>
            </View>
          </View>

          <View style={styles.contactRow}>
            <View style={styles.contactInfoBlock}>
              <Text style={styles.contactType}>Bulk orders & partnerships</Text>
              <View style={styles.contactPhoneRow}>
                <Ionicons name="call-outline" size={14} color="#2E7D32" />
                <Text style={styles.contactPhone}>+233 50 567 1577</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.callChip}
              onPress={() => handleCall('+233505671577')}
              activeOpacity={0.8}
            >
              <Ionicons name="call" size={14} color="#fff" />
              <Text style={styles.callChipText}>Call</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── FAQ ── */}
        <View style={styles.card}>
          <View style={styles.faqHeaderRow}>
            <View style={styles.cardTitleRow}>
              <View style={styles.cardTitleIcon}>
                <Ionicons name="chatbubble-ellipses" size={16} color="#2E7D32" />
              </View>
              <Text style={styles.cardTitle}>Frequently Asked</Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedTopic('all')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          {/* Topic filter chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.topicsScroll}
          >
            <TouchableOpacity
              style={[styles.topicChip, selectedTopic === 'all' && styles.topicChipActive]}
              onPress={() => setSelectedTopic('all')}
            >
              <Text style={[styles.topicChipText, selectedTopic === 'all' && styles.topicChipTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            {supportTopics.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[styles.topicChip, selectedTopic === t.id && styles.topicChipActive]}
                onPress={() => setSelectedTopic(t.id)}
              >
                <Ionicons
                  name={t.icon}
                  size={12}
                  color={selectedTopic === t.id ? '#fff' : '#6B7280'}
                  style={{ marginRight: 5 }}
                />
                <Text style={[styles.topicChipText, selectedTopic === t.id && styles.topicChipTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* FAQ items */}
          <View style={styles.faqList}>
            {filteredFAQs.length === 0 ? (
              <View style={styles.emptyFAQ}>
                <Ionicons name="search-outline" size={40} color="#D1D5DB" />
                <Text style={styles.emptyFAQText}>No FAQs for this topic</Text>
                <TouchableOpacity onPress={() => setSelectedTopic('all')}>
                  <Text style={styles.emptyFAQLink}>View all FAQs →</Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredFAQs.map((faq, idx) => (
                <View
                  key={faq.id}
                  style={[styles.faqItem, idx === filteredFAQs.length - 1 && { borderBottomWidth: 0 }]}
                >
                  <TouchableOpacity
                    style={styles.faqRow}
                    onPress={() => handleFAQToggle(faq.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.faqNumBadge}>
                      <Text style={styles.faqNum}>{String(idx + 1).padStart(2, '0')}</Text>
                    </View>
                    <Text style={styles.faqQ}>{faq.question}</Text>
                    <Ionicons
                      name={activeFAQ === faq.id ? 'remove' : 'add'}
                      size={20}
                      color={activeFAQ === faq.id ? '#2E7D32' : '#9CA3AF'}
                    />
                  </TouchableOpacity>
                  {activeFAQ === faq.id && (
                    <View style={styles.faqAnswer}>
                      <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        </View>

        {/* ── BUSINESS HOURS ── */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <View style={styles.cardTitleIcon}>
              <Ionicons name="time" size={16} color="#2E7D32" />
            </View>
            <Text style={styles.cardTitle}>Business Hours</Text>
          </View>

          <View style={styles.hoursTable}>
            {[
              { day: 'Monday – Friday', time: '7:00 AM – 9:00 PM', active: true },
              { day: 'Saturday', time: '8:00 AM – 8:00 PM', active: true },
              { day: 'Sunday', time: '9:00 AM – 6:00 PM', active: false },
            ].map((row, i) => (
              <View key={i} style={[styles.hoursRow, i < 2 && styles.hoursRowBorder]}>
                <View style={styles.hoursDayRow}>
                  <View style={[styles.hoursDot, !row.active && styles.hoursDotOff]} />
                  <Text style={styles.hoursDay}>{row.day}</Text>
                </View>
                <Text style={[styles.hoursTime, !row.active && styles.hoursTimeOff]}>
                  {row.time}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.holidayBanner}>
            <Ionicons name="alert-circle-outline" size={16} color="#92400E" />
            <Text style={styles.holidayBannerText}>Limited hours on public holidays</Text>
          </View>
        </View>

        {/* ── LOCATION ──
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <View style={styles.cardTitleIcon}>
              <Ionicons name="location" size={16} color="#2E7D32" />
            </View>
            <Text style={styles.cardTitle}>Visit Our Office</Text>
          </View>

          <View style={styles.locationBlock}>
            <View style={styles.locationMapPin}>
              <Ionicons name="business-outline" size={28} color="#2E7D32" />
            </View>
            <View style={styles.locationDetails}>
              <Text style={styles.locationName}>FreshyFood Headquarters</Text>
              <Text style={styles.locationAddr}>
                123 Farm Fresh Avenue{'\n'}East Legon, Accra, Ghana
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.directionsBtn}
            onPress={() => Linking.openURL('https://maps.google.com/?q=FreshyFood+Factory+Accra')}
            activeOpacity={0.8}
          >
            <Ionicons name="navigate-outline" size={16} color="#2E7D32" />
            <Text style={styles.directionsBtnText}>Get Directions</Text>
          </TouchableOpacity>
        </View> */}

        {/* ── CTA FOOTER ── */}
        <View style={styles.ctaFooter}>
          <View style={styles.ctaIconRow}>
            <View style={styles.ctaIcon}>
              <Ionicons name="shield-checkmark" size={22} color="#2E7D32" />
            </View>
          </View>
          <Text style={styles.ctaTitle}>Still need help?</Text>
          <Text style={styles.ctaSub}>
            Our dedicated support team is standing by to resolve any issue quickly and professionally.
          </Text>
          <View style={styles.ctaButtons}>
            <TouchableOpacity
              style={styles.ctaPrimary}
              onPress={() => handleCall('+233505671577')}
              activeOpacity={0.85}
            >
              <Ionicons name="call" size={16} color="#fff" />
              <Text style={styles.ctaPrimaryText}>Call Support</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.ctaSecondary}
              onPress={handleEmail}
              activeOpacity={0.85}
            >
              <Ionicons name="mail-outline" size={16} color="#2E7D32" />
              <Text style={styles.ctaSecondaryText}>Send Email</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F4' },

  // ── TOP BAR ──
  topBar: {
    backgroundColor: '#1B5E20',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: { padding: 4, width: 36 },
  topBarTitle: {
    flex: 1, textAlign: 'center',
    fontSize: 17, fontWeight: '700', color: '#fff', letterSpacing: 0.3,
  },
  homeBtn: { padding: 4, width: 36, alignItems: 'flex-end' },

  scrollContent: { paddingBottom: 20 },

  // ── HERO ──
  hero: {
    backgroundColor: '#1B5E20',
    paddingTop: 32,
    paddingBottom: 52,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  heroCircle1: {
    position: 'absolute', width: 220, height: 220,
    borderRadius: 110, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    top: -60, right: -60,
  },
  heroCircle2: {
    position: 'absolute', width: 160, height: 160,
    borderRadius: 80, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    top: 40, left: -50,
  },
  heroCircle3: {
    position: 'absolute', width: 100, height: 100,
    borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: 10, right: 30,
  },
  heroIconRing: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heroIconInner: {
    width: 62, height: 62, borderRadius: 31,
    backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
  },
  heroTitle: {
    fontSize: 26, fontWeight: '800', color: '#fff',
    letterSpacing: -0.4, marginBottom: 10,
  },
  heroSub: {
    fontSize: 14, color: 'rgba(255,255,255,0.72)',
    textAlign: 'center', lineHeight: 22,
    marginBottom: 24,
  },
  availPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, gap: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  availDot: {
    width: 7, height: 7, borderRadius: 4, backgroundColor: '#4ADE80',
  },
  availText: { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },

  // ── CHANNELS CARD (overlaps hero) ──
  channelsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: -26,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.09,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 14,
  },
  cardLabel: {
    fontSize: 10, fontWeight: '700',
    color: '#9CA3AF', letterSpacing: 1.2,
    marginBottom: 14,
  },
  channelsRow: { flexDirection: 'row', gap: 10 },
  channelBtn: {
    flex: 1, alignItems: 'center',
    paddingVertical: 16, borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)',
  },
  channelIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 10,
  },
  channelLabel: { fontSize: 13, fontWeight: '700', marginBottom: 3 },
  channelSub: { fontSize: 10, color: '#9CA3AF', textAlign: 'center' },

  // ── GENERIC CARD ──
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.055,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTitleRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, marginBottom: 16, flexWrap: 'wrap',
  },
  cardTitleIcon: {
    width: 30, height: 30, borderRadius: 9,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center', alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15, fontWeight: '700', color: '#111827', flex: 1,
  },

  // ── BUSINESS CONTACT ──
  hoursTag: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, borderColor: '#BBF7D0',
  },
  hoursTagText: { fontSize: 10, color: '#166534', fontWeight: '600' },
  contactRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F9FAFB', borderRadius: 14,
    padding: 14, gap: 12,
  },
  contactInfoBlock: { flex: 1 },
  contactType: { fontSize: 12, color: '#6B7280', marginBottom: 6 },
  contactPhoneRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  contactPhone: { fontSize: 15, fontWeight: '700', color: '#1B5E20' },
  callChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#2E7D32',
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 22, gap: 6,
  },
  callChipText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  // ── FAQ ──
  faqHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  seeAll: { fontSize: 13, color: '#2E7D32', fontWeight: '600' },
  topicsScroll: { paddingBottom: 16, gap: 8 },
  topicChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 13, paddingVertical: 7,
    borderRadius: 20,
  },
  topicChipActive: { backgroundColor: '#2E7D32' },
  topicChipText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  topicChipTextActive: { color: '#fff' },
  faqList: {},
  faqItem: {
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  faqRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16, gap: 12,
  },
  faqNumBadge: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center', alignItems: 'center',
  },
  faqNum: { fontSize: 10, fontWeight: '800', color: '#166534' },
  faqQ: {
    flex: 1, fontSize: 14, fontWeight: '600',
    color: '#111827', lineHeight: 20,
  },
  faqAnswer: {
    paddingLeft: 40, paddingBottom: 16, paddingRight: 4,
  },
  faqAnswerText: {
    fontSize: 13, color: '#6B7280', lineHeight: 21,
  },
  emptyFAQ: { alignItems: 'center', paddingVertical: 32 },
  emptyFAQText: { fontSize: 14, color: '#9CA3AF', marginTop: 10, marginBottom: 8 },
  emptyFAQLink: { fontSize: 13, color: '#2E7D32', fontWeight: '600' },

  // ── HOURS ──
  hoursTable: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14, overflow: 'hidden',
    marginBottom: 14,
  },
  hoursRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
  },
  hoursRowBorder: {
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  hoursDayRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hoursDot: {
    width: 7, height: 7, borderRadius: 4, backgroundColor: '#4ADE80',
  },
  hoursDotOff: { backgroundColor: '#D1D5DB' },
  hoursDay: { fontSize: 14, fontWeight: '500', color: '#374151' },
  hoursTime: { fontSize: 14, fontWeight: '700', color: '#1B5E20' },
  hoursTimeOff: { color: '#9CA3AF' },
  holidayBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFBEB',
    padding: 12, borderRadius: 12, gap: 8,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  holidayBannerText: { fontSize: 12, color: '#92400E', fontWeight: '500', flex: 1 },

  // ── LOCATION ──
  locationBlock: {
    flexDirection: 'row', gap: 14,
    backgroundColor: '#F9FAFB', borderRadius: 14,
    padding: 16, marginBottom: 14, alignItems: 'flex-start',
  },
  locationMapPin: {
    width: 50, height: 50, borderRadius: 14,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center', alignItems: 'center',
  },
  locationDetails: { flex: 1 },
  locationName: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 6 },
  locationAddr: { fontSize: 13, color: '#6B7280', lineHeight: 20 },
  directionsBtn: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#BBF7D0',
    paddingHorizontal: 18, paddingVertical: 11,
    borderRadius: 12, alignSelf: 'flex-start', gap: 8,
    backgroundColor: '#F0FDF4',
  },
  directionsBtnText: { fontSize: 13, fontWeight: '700', color: '#2E7D32' },

  // ── CTA FOOTER ──
  ctaFooter: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#1B5E20',
    padding: 28,
    alignItems: 'center',
    position: 'relative',
  },
  ctaIconRow: { marginBottom: 14 },
  ctaIcon: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
  },
  ctaTitle: {
    fontSize: 20, fontWeight: '800', color: '#fff',
    letterSpacing: -0.3, marginBottom: 8,
  },
  ctaSub: {
    fontSize: 13, color: 'rgba(255,255,255,0.68)',
    textAlign: 'center', lineHeight: 20,
    marginBottom: 24,
  },
  ctaButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  ctaPrimary: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 14, borderRadius: 14, gap: 8,
  },
  ctaPrimaryText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  ctaSecondary: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingVertical: 14, borderRadius: 14, gap: 8,
  },
  ctaSecondaryText: { fontSize: 14, fontWeight: '700', color: '#2E7D32' },
});

export default SupportScreen;