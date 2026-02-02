// src/screens/main/SupportScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';

const SupportScreen = ({ navigation }) => {
  const [activeFAQ, setActiveFAQ] = useState(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState('general');

  const supportTopics = [
    { id: 'order', label: 'Order Issues', icon: 'cart-outline' },
    { id: 'delivery', label: 'Delivery', icon: 'bicycle-outline' },
    { id: 'account', label: 'Account', icon: 'person-outline' },
    { id: 'payment', label: 'Payment', icon: 'card-outline' },
    { id: 'product', label: 'Product Quality', icon: 'leaf-outline' },
    { id: 'general', label: 'General Inquiry', icon: 'help-circle-outline' },
  ];

  const faqs = [
    {
      id: 1,
      question: 'How do I place an order?',
      answer: '1. Browse products and add items to your cart\n2. Proceed to checkout\n3. Select delivery time and address\n4. Choose payment method\n5. Confirm your order',
      category: 'order',
    },
    {
      id: 2,
      question: 'What are your delivery hours?',
      answer: 'We deliver daily from 7:00 AM to 9:00 PM. You can schedule your delivery during checkout to pick a convenient time slot.',
      category: 'delivery',
    },
    {
      id: 3,
      question: 'How can I track my order?',
      answer: 'Go to "My Orders" in your account to view order status and track delivery in real-time. You will also receive SMS notifications.',
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
      answer: 'On the login screen, tap "Forgot Password". Enter your registered phone number or email to receive a reset link.',
      category: 'account',
    },
    {
      id: 6,
      question: 'What is your return policy?',
      answer: 'We accept returns within 24 hours for damaged or incorrect items. Contact support immediately with photos of the issue.',
      category: 'product',
    },
    {
      id: 7,
      question: 'Do you offer bulk discounts?',
      answer: 'Yes! Contact our business sales team at bulk@freshyfood.com for special pricing on large orders for offices, restaurants, or events.',
      category: 'general',
    },
    {
      id: 8,
      question: 'How fresh are your products?',
      answer: 'We source directly from local farms and deliver within 24 hours of harvest. All products are stored in temperature-controlled facilities.',
      category: 'product',
    },
  ];

  const emergencyContacts = [
    {
      id: 1,
      title: 'Urgent Delivery Issues',
      description: 'For immediate delivery problems',
      phone: '+233 50 123 4567',
      hours: '24/7',
      icon: 'time-outline',
    },
    {
      id: 2,
      title: 'Product Quality Concerns',
      description: 'Damaged or incorrect items',
      phone: '+233 50 987 6543',
      hours: '7AM - 9PM',
      icon: 'alert-circle-outline',
    },
    {
      id: 3,
      title: 'Business Inquiries',
      description: 'Bulk orders & partnerships',
      phone: '+233 30 456 7890',
      hours: '8AM - 5PM (Weekdays)',
      icon: 'business-outline',
    },
  ];

  const handleCall = (phoneNumber) => {
    Alert.alert(
      'Call Support',
      `Do you want to call ${phoneNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call', 
          onPress: () => Linking.openURL(`tel:${phoneNumber}`)
        }
      ]
    );
  };

  const handleEmail = () => {
    Linking.openURL('mailto:support@freshyfood.com?subject=FreshyFood Support Request');
  };

  const handleWhatsApp = () => {
    Linking.openURL('https://wa.me/233501234567?text=Hello%20FreshyFood%20Support');
  };

  const handleSubmitSupportRequest = () => {
    if (!message.trim()) {
      Alert.alert('Error', 'Please enter your message');
      return;
    }

    setSending(true);
    
    // Simulate API call
    setTimeout(() => {
      setSending(false);
      setMessage('');
      setSelectedTopic('general');
      
      Alert.alert(
        'Message Sent',
        'Thank you for contacting us. Our support team will respond within 24 hours.',
        [{ text: 'OK' }]
      );
    }, 1500);
  };

  const handleFAQToggle = (id) => {
    setActiveFAQ(activeFAQ === id ? null : id);
  };

  const filteredFAQs = selectedTopic === 'all' 
    ? faqs 
    : faqs.filter(faq => faq.category === selectedTopic);

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Help & Support"
        showBack
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroContent}>
            <Ionicons name="help-buoy" size={48} color="#4CAF50" />
            <Text style={styles.heroTitle}>How can we help you?</Text>
            <Text style={styles.heroSubtitle}>
              We're here to assist with any questions or issues
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Support</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={handleWhatsApp}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#25D366' }]}>
                <Ionicons name="logo-whatsapp" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.quickActionText}>WhatsApp</Text>
              <Text style={styles.quickActionSubtext}>Chat with us</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={handleEmail}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#EA4335' }]}>
                <Ionicons name="mail" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.quickActionText}>Email</Text>
              <Text style={styles.quickActionSubtext}>support@freshyfood.com</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => handleCall('+233501234567')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#4285F4' }]}>
                <Ionicons name="call" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.quickActionText}>Call</Text>
              <Text style={styles.quickActionSubtext}>+233 50 123 4567</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Emergency Contacts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Contacts</Text>
          <Text style={styles.sectionSubtitle}>
            For urgent issues requiring immediate assistance
          </Text>
          
          <View style={styles.emergencyCards}>
            {emergencyContacts.map((contact) => (
              <TouchableOpacity
                key={contact.id}
                style={styles.emergencyCard}
                onPress={() => handleCall(contact.phone)}
              >
                <View style={styles.emergencyCardHeader}>
                  <Ionicons name={contact.icon} size={20} color="#FF9800" />
                  <Text style={styles.emergencyTitle}>{contact.title}</Text>
                </View>
                
                <Text style={styles.emergencyDescription}>
                  {contact.description}
                </Text>
                
                <View style={styles.emergencyContactInfo}>
                  <Ionicons name="call-outline" size={16} color="#4CAF50" />
                  <Text style={styles.emergencyPhone}>{contact.phone}</Text>
                </View>
                
                <View style={styles.emergencyHours}>
                  <Ionicons name="time-outline" size={14} color="#666" />
                  <Text style={styles.emergencyHoursText}>{contact.hours}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
            <TouchableOpacity onPress={() => setSelectedTopic('all')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {/* FAQ Categories */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryContainer}
          >
            <TouchableOpacity
              style={[
                styles.categoryButton,
                selectedTopic === 'all' && styles.categoryButtonActive
              ]}
              onPress={() => setSelectedTopic('all')}
            >
              <Text style={[
                styles.categoryButtonText,
                selectedTopic === 'all' && styles.categoryButtonTextActive
              ]}>
                All
              </Text>
            </TouchableOpacity>
            
            {supportTopics.map(topic => (
              <TouchableOpacity
                key={topic.id}
                style={[
                  styles.categoryButton,
                  selectedTopic === topic.id && styles.categoryButtonActive
                ]}
                onPress={() => setSelectedTopic(topic.id)}
              >
                <Ionicons 
                  name={topic.icon} 
                  size={16} 
                  color={selectedTopic === topic.id ? '#4CAF50' : '#666'} 
                  style={styles.categoryIcon}
                />
                <Text style={[
                  styles.categoryButtonText,
                  selectedTopic === topic.id && styles.categoryButtonTextActive
                ]}>
                  {topic.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* FAQ List */}
          <View style={styles.faqList}>
            {filteredFAQs.map(faq => (
              <View key={faq.id} style={styles.faqItem}>
                <TouchableOpacity
                  style={styles.faqQuestion}
                  onPress={() => handleFAQToggle(faq.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.faqQuestionText}>{faq.question}</Text>
                  <Ionicons 
                    name={activeFAQ === faq.id ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#666" 
                  />
                </TouchableOpacity>
                
                {activeFAQ === faq.id && (
                  <View style={styles.faqAnswer}>
                    <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Contact Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Send us a Message</Text>
          <Text style={styles.sectionSubtitle}>
            Can't find what you're looking for? Send us a message and we'll get back to you.
          </Text>

          <View style={styles.contactForm}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Topic</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.topicScroll}
              >
                <View style={styles.topicButtons}>
                  {supportTopics.map(topic => (
                    <TouchableOpacity
                      key={topic.id}
                      style={[
                        styles.topicButton,
                        selectedTopic === topic.id && styles.topicButtonActive
                      ]}
                      onPress={() => setSelectedTopic(topic.id)}
                    >
                      <Text style={[
                        styles.topicButtonText,
                        selectedTopic === topic.id && styles.topicButtonTextActive
                      ]}>
                        {topic.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Your Message</Text>
              <TextInput
                style={styles.messageInput}
                value={message}
                onChangeText={setMessage}
                placeholder="Describe your issue or question..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor="#999"
              />
              <Text style={styles.charCount}>
                {message.length}/500 characters
              </Text>
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmitSupportRequest}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="send" size={18} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Send Message</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.responseTime}>
              Typical response time: Within 24 hours
            </Text>
          </View>
        </View>

        {/* Business Hours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Hours</Text>
          <View style={styles.hoursCard}>
            <View style={styles.hoursRow}>
              <Text style={styles.day}>Monday - Friday</Text>
              <Text style={styles.time}>7:00 AM - 9:00 PM</Text>
            </View>
            <View style={styles.hoursDivider} />
            <View style={styles.hoursRow}>
              <Text style={styles.day}>Saturday</Text>
              <Text style={styles.time}>8:00 AM - 8:00 PM</Text>
            </View>
            <View style={styles.hoursDivider} />
            <View style={styles.hoursRow}>
              <Text style={styles.day}>Sunday</Text>
              <Text style={styles.time}>9:00 AM - 6:00 PM</Text>
            </View>
            <View style={styles.holidayNotice}>
              <Ionicons name="information-circle" size={16} color="#FF9800" />
              <Text style={styles.holidayText}>
                Limited hours on public holidays
              </Text>
            </View>
          </View>
        </View>

        {/* Visit Us */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visit Our Office</Text>
          <View style={styles.locationCard}>
            <View style={styles.locationHeader}>
              <Ionicons name="location" size={24} color="#4CAF50" />
              <Text style={styles.locationTitle}>FreshyFood Headquarters</Text>
            </View>
            <Text style={styles.locationAddress}>
              123 Farm Fresh Avenue{'\n'}
              East Legon, Accra{'\n'}
              Ghana
            </Text>
            <TouchableOpacity
              style={styles.directionsButton}
              onPress={() => Linking.openURL('https://maps.google.com/?q=FreshyFood+Factory+Accra')}
            >
              <Ionicons name="navigate" size={16} color="#4CAF50" />
              <Text style={styles.directionsText}>Get Directions</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    backgroundColor: '#4CAF50',
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#E8F5E8',
    marginTop: 8,
    textAlign: 'center',
  },
  quickActionsSection: {
    backgroundColor: '#FFFFFF',
    marginTop: -10,
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1B5E20',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 2,
  },
  quickActionSubtext: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    color: '#4CAF50',
    fontWeight: '600',
    fontSize: 14,
  },
  emergencyCards: {
    marginTop: 8,
  },
  emergencyCard: {
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFECB3',
  },
  emergencyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginLeft: 8,
  },
  emergencyDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  emergencyContactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  emergencyPhone: {
    fontSize: 15,
    color: '#2E7D32',
    fontWeight: '600',
    marginLeft: 8,
  },
  emergencyHours: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emergencyHoursText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
  categoryScroll: {
    marginBottom: 16,
  },
  categoryContainer: {
    paddingRight: 20,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoryButtonActive: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  categoryIcon: {
    marginRight: 6,
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  faqList: {
    marginTop: 8,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#212121',
    marginRight: 12,
  },
  faqAnswer: {
    paddingBottom: 16,
    paddingLeft: 4,
  },
  faqAnswerText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  contactForm: {
    marginTop: 8,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
  },
  topicScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  topicButtons: {
    flexDirection: 'row',
  },
  topicButton: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  topicButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  topicButtonText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  topicButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  messageInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  responseTime: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  hoursCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  day: {
    fontSize: 15,
    color: '#212121',
    fontWeight: '500',
  },
  time: {
    fontSize: 15,
    color: '#2E7D32',
    fontWeight: '600',
  },
  hoursDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  holidayNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 10,
    borderRadius: 6,
    marginTop: 12,
  },
  holidayText: {
    fontSize: 13,
    color: '#E65100',
    marginLeft: 8,
  },
  locationCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginLeft: 8,
  },
  locationAddress: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    marginBottom: 16,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  directionsText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  bottomSpacer: {
    height: 20,
  },
});

export default SupportScreen;