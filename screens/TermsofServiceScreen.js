// src/screens/TermsOfServiceScreen.js
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Animated,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const LAST_UPDATED = 'June 1, 2026';
const EFFECTIVE_DATE = 'June 15, 2026';
const CONTACT_EMAIL = 'legal@cedimart.com';
const CONTACT_PHONE = '+233 505 671 577';

const SECTIONS = [
  {
    id: 'acceptance',
    icon: 'checkmark-circle-outline',
    iconColor: '#2E7D32',
    iconBg: '#E8F5E9',
    title: 'Acceptance of Terms',
    tag: 'IMPORTANT',
    tagColor: '#2E7D32',
    tagBg: '#E8F5E9',
    content: `By downloading, installing, or using the CediMart mobile application ("App"), you confirm that you have read, understood, and agree to be bound by these Terms of Service ("Terms").

If you do not agree to these Terms, please do not use our App or services. These Terms apply to all users — buyers, sellers (vendors), and visitors.

You must be at least 18 years old, or have the consent of a parent or guardian, to use our services. By creating a vendor account, you confirm you are a registered student or authorized campus community member.`,
  },
  {
    id: 'services',
    icon: 'school-outline',
    iconColor: '#1565C0',
    iconBg: '#E3F2FD',
    title: 'Our Services',
    content: `CediMart is a campus marketplace that connects student buyers and sellers across Ghanaian universities. Through our App, you can:`,
    bullets: [
      { heading: 'Browse & Buy', text: 'Discover items listed by verified students on your campus — from electronics and textbooks to hostel essentials and fashion.' },
      { heading: 'Sell Your Items', text: 'List your products for free, set your own prices, and reach thousands of students across multiple campuses.' },
      { heading: 'Secure Escrow Payments', text: 'All payments are held securely by CediMart until the buyer confirms receipt and satisfaction with the item.' },
      { heading: 'Campus Delivery', text: 'We handle pickup from sellers and delivery to buyers within and across campuses.' },
      { heading: 'In-App Communication', text: 'Message buyers and sellers safely within the app — no need to share personal contact details.' },
    ],
    note: 'Our services are currently available at University of Ghana, KNUST, UCC, UEW, UPSA, Ashesi, GIMPA, and ATU. More campuses coming soon.',
  },
  {
    id: 'account',
    icon: 'person-outline',
    iconColor: '#6A1B9A',
    iconBg: '#F3E5F5',
    title: 'Your Account',
    bullets: [
      { heading: 'Registration', text: 'You must provide accurate, current, and complete information when creating your account. For vendors, this includes your real name, campus, and phone number.' },
      { heading: 'Account Security', text: 'You are responsible for maintaining the confidentiality of your login credentials. Any activity under your account is your responsibility.' },
      { heading: 'One Account Per Person', text: 'You may create only one personal account and one vendor account. Creating multiple accounts to manipulate ratings or prices is prohibited.' },
      { heading: 'Verification', text: 'Vendor accounts undergo a verification process. We may require proof of student status or campus affiliation.' },
      { heading: 'Account Suspension', text: 'We reserve the right to suspend or terminate accounts that violate these Terms, engage in fraudulent activity, or receive consistent negative feedback.' },
    ],
  },
  {
    id: 'buying',
    icon: 'cart-outline',
    iconColor: '#F57F17',
    iconBg: '#FFF8E1',
    title: 'Buying on CediMart',
    bullets: [
      { heading: 'Order Placement', text: 'When you place an order, the payment is immediately processed but held in escrow. The seller is notified to prepare the item for pickup.' },
      { heading: 'Escrow Protection', text: 'Your payment is NOT released to the seller until you confirm that you have received the item and it matches the description. This protects you from fraud.' },
      { heading: 'Inspection Period', text: 'You have 24 hours from delivery to inspect the item and report any issues. If no report is made within 24 hours, the transaction is considered complete.' },
      { heading: 'Dispute Resolution', text: 'If an item is significantly different from its description, damaged, or not delivered, you can file a dispute. Our support team will investigate and facilitate a resolution.' },
      { heading: 'Meeting Safety', text: 'For in-person exchanges, always meet in public campus areas. Use our in-app messaging for all communication.' },
    ],
  },
  {
    id: 'selling',
    icon: 'storefront-outline',
    iconColor: '#2E7D32',
    iconBg: '#E8F5E9',
    title: 'Selling on CediMart',
    tag: 'VENDORS',
    tagColor: '#2E7D32',
    tagBg: '#E8F5E9',
    bullets: [
      { heading: 'Listing Requirements', text: 'All listings must include accurate descriptions, clear photos, correct condition, and fair pricing. Misleading listings will be removed.' },
      { heading: 'Prohibited Items', text: 'Counterfeit goods, stolen items, weapons, alcohol, drugs, and items violating university policies or Ghanaian law are strictly prohibited.' },
      { heading: 'Commission Fees', text: 'CediMart charges a commission on each successful sale. The current rate is displayed before you publish each listing. Commission is deducted from the sale amount before payout.' },
      { heading: 'Payouts', text: 'Your earnings are released to your registered mobile money or bank account within 24-48 hours after the buyer confirms delivery.' },
      { heading: 'Delivery Cooperation', text: 'You agree to make items available for pickup by our delivery team within 24 hours of order confirmation. Delays may affect your seller rating.' },
      { heading: 'Seller Ratings', text: 'Buyers can rate their experience. Maintain high standards to build trust and increase sales.' },
    ],
  },
  {
    id: 'delivery',
    icon: 'bicycle-outline',
    iconColor: '#6A1B9A',
    iconBg: '#F3E5F5',
    title: 'Delivery & Logistics',
    bullets: [
      { heading: 'CediMart Delivery', text: 'We provide pickup and delivery services for items purchased through the platform. Our delivery team operates on all partner campuses.' },
      { heading: 'Delivery Timeframes', text: 'Standard delivery is within 24-48 hours of order confirmation. Same-day delivery may be available on certain campuses.' },
      { heading: 'Seller Drop-off', text: 'Sellers may also drop off items at designated CediMart collection points on their campus for faster processing.' },
      { heading: 'Delivery Issues', text: 'If an item is damaged during delivery, CediMart takes responsibility. Report any delivery issues immediately upon receipt.' },
      { heading: 'In-Person Exchange', text: 'Buyers and sellers may arrange in-person exchanges through the app. We recommend meeting in public campus areas during daylight hours.' },
    ],
  },
  {
    id: 'payments',
    icon: 'card-outline',
    iconColor: '#1565C0',
    iconBg: '#E3F2FD',
    title: 'Payments & Escrow',
    content: `CediMart uses a secure escrow system to protect both buyers and sellers:`,
    bullets: [
      { heading: 'How Escrow Works', text: 'Buyer pays → Funds held by CediMart → Seller provides item → Item delivered → Buyer confirms → Funds released to seller.' },
      { heading: 'Payment Methods', text: 'We accept mobile money (MTN, Vodafone, AirtelTigo), bank transfers, and card payments through our secure payment partner.' },
      { heading: 'Refund Eligibility', text: 'Refunds are issued when: items are not delivered, items are significantly different from description, items arrive damaged, or the seller cancels the order.' },
      { heading: 'Refund Process', text: 'Approved refunds are processed within 3-5 business days back to the original payment method.' },
      { heading: 'Dispute Timeframe', text: 'Disputes must be raised within 24 hours of delivery confirmation. After 24 hours, the transaction is considered final.' },
    ],
  },
  {
    id: 'conduct',
    icon: 'shield-outline',
    iconColor: '#C62828',
    iconBg: '#FFEBEE',
    title: 'User Conduct',
    content: `You agree not to use the App in any way that:`,
    bullets: [
      { heading: 'Violates Laws', text: 'Is unlawful, fraudulent, or violates any applicable Ghanaian laws or university regulations.' },
      { heading: 'Harms Others', text: 'Harasses, abuses, threatens, or intimidates other users, delivery personnel, or CediMart staff.' },
      { heading: 'Manipulates the Platform', text: 'Creates fake accounts, posts fake listings, manipulates ratings, or engages in any deceptive practice.' },
      { heading: 'Circumvents CediMart', text: 'Uses the platform to find buyers/sellers and then completes transactions outside the app to avoid commissions.' },
      { heading: 'Misrepresents Items', text: 'Posts misleading photos, inaccurate descriptions, or misrepresents the condition of items.' },
    ],
  },
  {
    id: 'intellectual',
    icon: 'ribbon-outline',
    iconColor: '#F57F17',
    iconBg: '#FFF8E1',
    title: 'Intellectual Property',
    content: `All content in the App — including logos, design, code, and the CediMart brand — is owned by or licensed to CediMart and is protected by applicable intellectual property laws.

You may not reproduce, distribute, modify, or commercially exploit any content from the App without our prior written permission.

You retain ownership of content you submit (such as product photos and descriptions), but grant CediMart a non-exclusive licence to display such content in connection with our services.`,
  },
  {
    id: 'liability',
    icon: 'alert-circle-outline',
    iconColor: '#C62828',
    iconBg: '#FFEBEE',
    title: 'Limitation of Liability',
    content: `To the maximum extent permitted by Ghanaian law, CediMart shall not be liable for:`,
    bullets: [
      { heading: 'Indirect Damages', text: 'Any indirect, incidental, or consequential damages arising from your use of the App or services.' },
      { heading: 'User Disputes', text: 'Disputes between buyers and sellers. We provide a dispute resolution mechanism but are not party to transactions.' },
      { heading: 'Service Interruptions', text: 'Loss caused by temporary unavailability of the App due to maintenance or technical issues.' },
      { heading: 'Third-Party Actions', text: 'Actions of delivery personnel or payment processors beyond our reasonable control.' },
    ],
    note: 'Our total liability for any claim shall not exceed the commission earned by CediMart on the transaction giving rise to the claim.',
  },
  {
    id: 'governing',
    icon: 'globe-outline',
    iconColor: '#6A1B9A',
    iconBg: '#F3E5F5',
    title: 'Governing Law & Disputes',
    content: `These Terms are governed by and construed in accordance with the laws of the Republic of Ghana.

Any dispute arising from these Terms or your use of the App shall first be addressed through good-faith negotiation. If unresolved within 30 days, disputes shall be submitted to the competent courts of Ghana.

If any provision of these Terms is found to be unenforceable, the remaining provisions shall continue in full force and effect.`,
  },
  {
    id: 'changes',
    icon: 'refresh-outline',
    iconColor: '#2E7D32',
    iconBg: '#E8F5E9',
    title: 'Changes to These Terms',
    content: `We reserve the right to modify these Terms at any time. When we make material changes, we will notify you via in-app notification or email at least 7 days before the changes take effect.

Your continued use of the App after the effective date constitutes your acceptance of the revised Terms. If you do not agree, you may close your account before the effective date.

The "Last Updated" date at the top of this screen reflects the most recent revision.`,
  },
  {
    id: 'contact',
    icon: 'mail-outline',
    iconColor: '#1565C0',
    iconBg: '#E3F2FD',
    title: 'Contact & Support',
    content: `If you have questions about these Terms, need support, or wish to report a violation, please reach out:`,
    isContact: true,
  },
];

const TermsSection = ({ section, index }) => {
  const [open, setOpen] = useState(index === 0);
  const rotateAnim = useRef(new Animated.Value(index === 0 ? 1 : 0)).current;

  const toggle = () => {
    Animated.timing(rotateAnim, { toValue: open ? 0 : 1, duration: 200, useNativeDriver: true }).start();
    setOpen(o => !o);
  };

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return (
    <View style={[styles.section, open && styles.sectionOpen]}>
      <TouchableOpacity style={styles.sectionHeader} onPress={toggle} activeOpacity={0.75}>
        <View style={styles.sectionLeft}>
          <View style={styles.sectionNum}>
            <Text style={styles.sectionNumText}>{String(index + 1).padStart(2, '0')}</Text>
          </View>
          <View style={[styles.sectionIconWrap, { backgroundColor: section.iconBg }]}>
            <Ionicons name={section.icon} size={17} color={section.iconColor} />
          </View>
          <View style={styles.sectionTitleWrap}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.tag && (
              <View style={[styles.sectionTag, { backgroundColor: section.tagBg }]}>
                <Text style={[styles.sectionTagText, { color: section.tagColor }]}>{section.tag}</Text>
              </View>
            )}
          </View>
        </View>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name="chevron-down" size={17} color="#BDBDBD" />
        </Animated.View>
      </TouchableOpacity>

      {open && (
        <View style={styles.sectionBody}>
          {section.content && <Text style={styles.bodyText}>{section.content}</Text>}

          {section.bullets?.map((b, i) => (
            <View key={i} style={styles.bulletRow}>
              <View style={[styles.bulletMarker, { backgroundColor: section.iconColor }]}>
                <Text style={styles.bulletMarkerNum}>{i + 1}</Text>
              </View>
              <View style={styles.bulletBody}>
                <Text style={styles.bulletHeading}>{b.heading}</Text>
                <Text style={styles.bulletText}>{b.text}</Text>
              </View>
            </View>
          ))}

          {section.note && (
            <View style={[styles.noteBox, { borderLeftColor: section.iconColor }]}>
              <Ionicons name="information-circle-outline" size={15} color={section.iconColor} />
              <Text style={[styles.noteText, { color: section.iconColor }]}>{section.note}</Text>
            </View>
          )}

          {section.isContact && (
            <View style={styles.contactBlock}>
              <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`)} activeOpacity={0.8}>
                <View style={[styles.contactIconWrap, { backgroundColor: '#E3F2FD' }]}>
                  <Ionicons name="mail-outline" size={16} color="#1565C0" />
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactLabel}>Legal & Terms</Text>
                  <Text style={styles.contactValue}>{CONTACT_EMAIL}</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color="#BDBDBD" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL(`tel:${CONTACT_PHONE.replace(/\s/g, '')}`)} activeOpacity={0.8}>
                <View style={[styles.contactIconWrap, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="call-outline" size={16} color="#2E7D32" />
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactLabel}>Customer Support</Text>
                  <Text style={styles.contactValue}>{CONTACT_PHONE}</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color="#BDBDBD" />
              </TouchableOpacity>
              <View style={[styles.contactRow, { borderBottomWidth: 0 }]}>
                <View style={[styles.contactIconWrap, { backgroundColor: '#FFF8E1' }]}>
                  <Ionicons name="location-outline" size={16} color="#F57F17" />
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactLabel}>Office</Text>
                  <Text style={styles.contactValue}>Accra, Ghana</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const TableOfContents = ({ onSelect }) => (
  <View style={styles.tocCard}>
    <View style={styles.tocHead}>
      <Ionicons name="list-outline" size={15} color="#1565C0" />
      <Text style={styles.tocHeadText}>Table of Contents</Text>
    </View>
    {SECTIONS.map((s, i) => (
      <TouchableOpacity key={s.id} style={styles.tocRow} onPress={() => onSelect(i)} activeOpacity={0.7}>
        <View style={[styles.tocNumBadge, { backgroundColor: s.iconBg }]}>
          <Text style={[styles.tocNum, { color: s.iconColor }]}>{String(i + 1).padStart(2, '0')}</Text>
        </View>
        <Text style={styles.tocLabel} numberOfLines={1}>{s.title}</Text>
        <Ionicons name="arrow-forward-outline" size={13} color="#D0D0D0" />
      </TouchableOpacity>
    ))}
  </View>
);

const TermsOfServiceScreen = () => {
  const navigation = useNavigation();
  const scrollRef = useRef(null);
  const sectionRefs = useRef([]);
  const [showToc, setShowToc] = useState(false);

  const scrollToSection = (index) => {
    setShowToc(false);
    setTimeout(() => {
      sectionRefs.current[index]?.measure((x, y, w, h, px, py) => {
        scrollRef.current?.scrollTo({ y: py - 80, animated: true });
      });
    }, 120);
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F8F7" />

      <SafeAreaView edges={['top']} style={{ zIndex: 10 }}>
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.navBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Terms of Service</Text>
          <TouchableOpacity style={[styles.navBtn, showToc && styles.navBtnOn]} onPress={() => setShowToc(t => !t)}>
            <Ionicons name={showToc ? 'close' : 'list-outline'} size={20} color={showToc ? '#1565C0' : '#1A1A1A'} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {showToc && (
        <View style={styles.tocOverlay} pointerEvents="box-none">
          <TouchableOpacity style={styles.tocBackdrop} activeOpacity={1} onPress={() => setShowToc(false)} />
          <View style={styles.tocPanel}>
            <TableOfContents onSelect={scrollToSection} />
          </View>
        </View>
      )}

      <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroAccentCircle} />
          <View style={styles.heroAccentCircle2} />
          <View style={styles.heroInner}>
            <View style={styles.heroIconRing}>
              <View style={styles.heroIconInner}>
                <Ionicons name="document-text" size={30} color="#fff" />
              </View>
            </View>
            <Text style={styles.heroTitle}>Terms of Service</Text>
            <Text style={styles.heroSubtitle}>CediMart — Ghana's Campus Marketplace</Text>
            <Text style={styles.heroDesc}>
              Please read these terms carefully. By using CediMart, you agree to all terms below. These terms apply to both buyers and vendors.
            </Text>
            <View style={styles.heroDates}>
              <View style={styles.datePill}>
                <Ionicons name="create-outline" size={12} color="#9E9E9E" />
                <Text style={styles.datePillText}>Updated {LAST_UPDATED}</Text>
              </View>
              <View style={styles.datePillGreen}>
                <Ionicons name="flash" size={12} color="#2E7D32" />
                <Text style={styles.datePillGreenText}>Effective {EFFECTIVE_DATE}</Text>
              </View>
            </View>
            <View style={styles.summaryRow}>
              {[
                { icon: 'school-outline', label: '8 Campuses' },
                { icon: 'shield-checkmark-outline', label: 'Escrow Protected' },
                { icon: 'bicycle-outline', label: 'Free Delivery' },
                { icon: 'card-outline', label: 'Secure Payments' },
              ].map((chip, i) => (
                <View key={i} style={styles.summaryChip}>
                  <Ionicons name={chip.icon} size={13} color="#1565C0" />
                  <Text style={styles.summaryChipText}>{chip.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Quick Summary */}
        <View style={styles.tldrBanner}>
          <View style={styles.tldrLeft}>
            <Text style={styles.tldrTitle}>Quick Summary</Text>
            <Text style={styles.tldrSub}>Key points for buyers & sellers</Text>
          </View>
          <View style={styles.tldrIcon}>
            <Ionicons name="bulb-outline" size={20} color="#F57F17" />
          </View>
        </View>
        <View style={styles.tldrItems}>
          {[
            { icon: 'cart-outline', color: '#2E7D32', text: 'Buy & sell with verified students on your campus' },
            { icon: 'shield-checkmark', color: '#1565C0', text: 'Payments held in escrow until you confirm delivery' },
            { icon: 'bicycle', color: '#6A1B9A', text: 'We handle pickup and delivery across all campuses' },
            { icon: 'wallet-outline', color: '#2E7D32', text: 'Vendors: commission deducted from sale, payout within 48h' },
            { icon: 'close-circle', color: '#C62828', text: 'Report issues within 24h of delivery for refund eligibility' },
          ].map((item, i) => (
            <View key={i} style={styles.tldrItem}>
              <Ionicons name={item.icon} size={16} color={item.color} />
              <Text style={styles.tldrItemText}>{item.text}</Text>
            </View>
          ))}
        </View>

        {/* Sections */}
        <View style={styles.sectionsWrap}>
          {SECTIONS.map((section, index) => (
            <View key={section.id} ref={el => { sectionRefs.current[index] = el; }}>
              <TermsSection section={section} index={index} />
            </View>
          ))}
        </View>

        {/* Agreement Footer */}
        <View style={styles.agreementCard}>
          <View style={styles.agreementIconWrap}>
            <Ionicons name="checkmark-done-circle" size={28} color="#2E7D32" />
          </View>
          <Text style={styles.agreementTitle}>You've Agreed to These Terms</Text>
          <Text style={styles.agreementText}>
            By using CediMart, you acknowledge that you have read and understood these Terms of Service and agree to be bound by them as a buyer, seller, or visitor.
          </Text>
          <View style={styles.agreementMeta}>
            <Text style={styles.agreementMetaText}>Effective: {EFFECTIVE_DATE}</Text>
            <View style={styles.agreementMetaDot} />
            <Text style={styles.agreementMetaText}>v3.0</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerBrandRow}>
            <Ionicons name="school" size={14} color="#A5D6A7" />
            <Text style={styles.footerBrand}>CediMart</Text>
          </View>
          <Text style={styles.footerSub}>Accra, Ghana · © {new Date().getFullYear()}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')} style={styles.footerLink}>
            <Text style={styles.footerLinkText}>View Privacy Policy →</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F8F7' },
  scrollContent: { paddingBottom: 20 },

  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  navBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3 },
  navBtnOn: { backgroundColor: '#E3F2FD', shadowColor: '#1565C0', shadowOpacity: 0.14 },
  navTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A1A', letterSpacing: 0.1 },

  tocOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 },
  tocBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  tocPanel: { position: 'absolute', top: Platform.OS === 'ios' ? 100 : 70, right: 16, width: width * 0.8, maxWidth: 320, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14, shadowRadius: 20, elevation: 16 },
  tocCard: { backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden' },
  tocHead: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 13, backgroundColor: '#EBF3FF', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#DDEEFF' },
  tocHeadText: { fontSize: 12, fontWeight: '800', color: '#1565C0', textTransform: 'uppercase', letterSpacing: 1.2 },
  tocRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F5F5F5', gap: 10 },
  tocNumBadge: { width: 28, height: 20, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  tocNum: { fontSize: 10, fontWeight: '800' },
  tocLabel: { flex: 1, fontSize: 13, color: '#424242', fontWeight: '500' },

  hero: { backgroundColor: '#1B5E20', marginHorizontal: 16, marginTop: 8, marginBottom: 12, borderRadius: 22, overflow: 'hidden', shadowColor: '#1B5E20', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8, position: 'relative' },
  heroAccentCircle: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.05)' },
  heroAccentCircle2: { position: 'absolute', bottom: -30, left: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.04)' },
  heroInner: { padding: 24, alignItems: 'center' },
  heroIconRing: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)' },
  heroIconInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#1565C0', justifyContent: 'center', alignItems: 'center' },
  heroTitle: { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: -0.4, textAlign: 'center', marginBottom: 2 },
  heroSubtitle: { fontSize: 13, color: '#A5D6A7', fontWeight: '600', letterSpacing: 0.3, marginBottom: 14 },
  heroDesc: { fontSize: 13, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 20, marginBottom: 18, paddingHorizontal: 8 },
  heroDates: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap', justifyContent: 'center' },
  datePill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  datePillText: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },
  datePillGreen: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#E8F5E9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  datePillGreenText: { fontSize: 12, color: '#2E7D32', fontWeight: '700' },
  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  summaryChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  summaryChipText: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },

  tldrBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 0, borderRadius: 14, padding: 16, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  tldrLeft: { flex: 1 },
  tldrTitle: { fontSize: 15, fontWeight: '800', color: '#1A1A1A' },
  tldrSub: { fontSize: 12, color: '#9E9E9E', marginTop: 1 },
  tldrIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF8E1', justifyContent: 'center', alignItems: 'center' },
  tldrItems: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12, borderRadius: 14, borderTopLeftRadius: 0, borderTopRightRadius: 0, paddingHorizontal: 16, paddingBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  tldrItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F5F5F5' },
  tldrItemText: { flex: 1, fontSize: 13, color: '#424242', fontWeight: '500', lineHeight: 18 },

  sectionsWrap: { paddingHorizontal: 16, gap: 8 },
  section: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  sectionOpen: { shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 15 },
  sectionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  sectionNum: { width: 22 },
  sectionNumText: { fontSize: 11, fontWeight: '800', color: '#D0D0D0' },
  sectionIconWrap: { width: 34, height: 34, borderRadius: 9, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  sectionTitleWrap: { flex: 1, gap: 3 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', lineHeight: 19 },
  sectionTag: { alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  sectionTagText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.6 },
  sectionBody: { paddingHorizontal: 16, paddingBottom: 18, paddingTop: 6, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#F0F0F0' },
  bodyText: { fontSize: 13, color: '#555', lineHeight: 21, marginTop: 10, marginBottom: 8 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 10, gap: 12 },
  bulletMarker: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', flexShrink: 0, marginTop: 1 },
  bulletMarkerNum: { fontSize: 10, fontWeight: '900', color: '#fff' },
  bulletBody: { flex: 1 },
  bulletHeading: { fontSize: 13, fontWeight: '700', color: '#1A1A1A', marginBottom: 3 },
  bulletText: { fontSize: 13, color: '#757575', lineHeight: 19 },
  noteBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderLeftWidth: 3, backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: 6, padding: 10, marginTop: 14 },
  noteText: { flex: 1, fontSize: 12, lineHeight: 17, fontWeight: '600' },
  contactBlock: { backgroundColor: '#F8FAFF', borderRadius: 12, marginTop: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E3F2FD' },
  contactRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#EEF4FF', gap: 12 },
  contactIconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  contactInfo: { flex: 1 },
  contactLabel: { fontSize: 10, color: '#9E9E9E', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  contactValue: { fontSize: 14, color: '#1A1A1A', fontWeight: '600' },

  agreementCard: { backgroundColor: '#1B5E20', marginHorizontal: 16, marginTop: 12, marginBottom: 8, borderRadius: 20, padding: 24, alignItems: 'center', shadowColor: '#1B5E20', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6 },
  agreementIconWrap: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  agreementTitle: { fontSize: 18, fontWeight: '900', color: '#fff', marginBottom: 8, textAlign: 'center' },
  agreementText: { fontSize: 13, color: 'rgba(255,255,255,0.65)', textAlign: 'center', lineHeight: 19, marginBottom: 14 },
  agreementMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  agreementMetaText: { fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: '600' },
  agreementMetaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.25)' },

  footer: { alignItems: 'center', paddingVertical: 28, gap: 6 },
  footerBrandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  footerBrand: { fontSize: 14, fontWeight: '800', color: '#9E9E9E' },
  footerSub: { fontSize: 12, color: '#BDBDBD' },
  footerLink: { marginTop: 4 },
  footerLinkText: { fontSize: 13, color: '#1565C0', fontWeight: '700' },
});

export default TermsOfServiceScreen;