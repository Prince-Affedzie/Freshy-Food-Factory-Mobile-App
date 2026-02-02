// src/screens/main/AboutScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Dimensions,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';

const { width } = Dimensions.get('window');

const AboutScreen = ({ navigation }) => {
  const [expandedSection, setExpandedSection] = useState(null);

  const appStats = [
    { value: '5000+', label: 'Happy Customers', icon: 'people-outline' },
    { value: '100+', label: 'Local Farms', icon: 'leaf-outline' },
    { value: '50+', label: 'Fresh Products', icon: 'basket-outline' },
    { value: '24h', label: 'Delivery Time', icon: 'time-outline' },
  ];

  const features = [
    {
      id: 1,
      title: 'Farm Fresh Produce',
      description: 'Direct from local farms within 24 hours of harvest',
      icon: 'leaf',
      color: '#4CAF50',
    },
    {
      id: 2,
      title: 'Flexible Delivery',
      description: 'Choose your preferred delivery time and location',
      icon: 'bicycle',
      color: '#2196F3',
    },
    {
      id: 3,
      title: 'Secure Payments',
      description: 'Multiple safe payment options including mobile money',
      icon: 'shield-checkmark',
      color: '#FF9800',
    },
    {
      id: 4,
      title: 'Quality Guarantee',
      description: 'Freshness and quality guaranteed on every order',
      icon: 'star',
      color: '#9C27B0',
    },
    {
      id: 5,
      title: 'Easy Returns',
      description: '24-hour return policy for any quality issues',
      icon: 'refresh',
      color: '#F44336',
    },
    {
      id: 6,
      title: 'Personalized Service',
      description: 'Custom recommendations based on your preferences',
      icon: 'heart',
      color: '#E91E63',
    },
  ];


  const faqSections = [
    {
      id: 'mission',
      title: 'Our Mission',
      content: 'To bridge the gap between local farmers and urban consumers by providing fresh, high-quality produce directly from farm to table. We aim to support local agriculture while ensuring our customers get the freshest products at fair prices.',
    },
    {
      id: 'story',
      title: 'Our Story',
      content: 'FreshyFood Factory was founded in 2023 by Kwame Asare, an agricultural economist who noticed the challenges both farmers and consumers faced in the fresh produce supply chain. Farmers struggled to get fair prices while consumers paid premium prices for produce that had lost freshness through multiple middlemen. We built a direct connection to solve both problems.',
    },
    {
      id: 'impact',
      title: 'Our Impact',
      content: '• Supporting 100+ local farming families\n• Reducing food waste by 40% through efficient logistics\n• Creating 50+ direct employment opportunities\n• Providing fresh produce to 5000+ households\n• Reducing carbon footprint by eliminating multiple transportation layers',
    },
    {
      id: 'technology',
      title: 'Our Technology',
      content: 'We use cutting-edge technology to ensure freshness:\n• Real-time inventory tracking\n• Smart routing for efficient delivery\n• Temperature-controlled logistics\n• Mobile payment integration\n• Quality monitoring systems',
    },
  ];

  const appInfo = {
    version: '1.5.2',
    build: '2024.12.1',
    releaseDate: 'December 2024',
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: 'FreshyFood Factory',
        message: 'Check out FreshyFood Factory - Fresh produce delivered to your doorstep! Download now: https://freshyfood.com/download',
        url: 'https://freshyfood.com',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share app');
    }
  };

  const handleRateApp = () => {
    Alert.alert(
      'Rate Our App',
      'Would you like to rate FreshyFood Factory on the app store?',
      [
        { text: 'Not Now', style: 'cancel' },
        { 
          text: 'Rate Now', 
          onPress: () => Linking.openURL('https://apps.apple.com/app/idYOUR_APP_ID')
        }
      ]
    );
  };

  const handleSectionToggle = (sectionId) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="About"
        showBack
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity 
            style={styles.shareButton}
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={22} color="#2E7D32" />
          </TouchableOpacity>
        }
      />

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Ionicons name="leaf" size={48} color="#FFFFFF" />
            </View>
            <Text style={styles.appName}>FreshyFood Factory</Text>
            <Text style={styles.appTagline}>
              Fresh from farm to your table
            </Text>
          </View>
          
          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>Version {appInfo.version}</Text>
            <Text style={styles.buildText}>Build {appInfo.build}</Text>
            <Text style={styles.releaseText}>Released {appInfo.releaseDate}</Text>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Making an Impact</Text>
          <View style={styles.statsGrid}>
            {appStats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name={stat.icon} size={24} color="#4CAF50" />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Mission & Story */}
        <View style={styles.storySection}>
          <Text style={styles.sectionTitle}>Our Journey</Text>
          
          {faqSections.map((section) => (
            <TouchableOpacity
              key={section.id}
              style={[
                styles.storyCard,
                expandedSection === section.id && styles.storyCardExpanded
              ]}
              onPress={() => handleSectionToggle(section.id)}
              activeOpacity={0.7}
            >
              <View style={styles.storyCardHeader}>
                <Text style={styles.storyCardTitle}>{section.title}</Text>
                <Ionicons 
                  name={expandedSection === section.id ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#666" 
                />
              </View>
              
              {expandedSection === section.id && (
                <Text style={styles.storyCardContent}>{section.content}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Features */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>What Makes Us Special</Text>
          <View style={styles.featuresGrid}>
            {features.map((feature) => (
              <View key={feature.id} style={styles.featureCard}>
                <View style={[styles.featureIcon, { backgroundColor: `${feature.color}20` }]}>
                  <Ionicons name={feature.icon} size={24} color={feature.color} />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Partners */}
        <View style={styles.partnersSection}>
          <Text style={styles.sectionTitle}>Our Trusted Partners</Text>
          <View style={styles.partnersGrid}>
            <View style={styles.partnerLogo}>
              <Ionicons name="business" size={32} color="#666" />
              <Text style={styles.partnerName}>Ministry of Food & Agriculture</Text>
            </View>
            <View style={styles.partnerLogo}>
              <Ionicons name="leaf" size={32} color="#666" />
              <Text style={styles.partnerName}>Ghana Farmers Association</Text>
            </View>
            <View style={styles.partnerLogo}>
              <Ionicons name="heart" size={32} color="#666" />
              <Text style={styles.partnerName}>Food Security Initiative</Text>
            </View>
          </View>
        </View>

        {/* App Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Help Us Improve</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={handleRateApp}
            >
              <Ionicons name="star-outline" size={28} color="#FF9800" />
              <Text style={styles.actionTitle}>Rate App</Text>
              <Text style={styles.actionDescription}>
                Share your experience
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('Support')}
            >
              <Ionicons name="chatbubble-outline" size={28} color="#4CAF50" />
              <Text style={styles.actionTitle}>Feedback</Text>
              <Text style={styles.actionDescription}>
                Suggest improvements
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => Linking.openURL('https://freshyfood.com/careers')}
            >
              <Ionicons name="briefcase-outline" size={28} color="#2196F3" />
              <Text style={styles.actionTitle}>Careers</Text>
              <Text style={styles.actionDescription}>
                Join our team
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Legal Links */}
        <View style={styles.legalSection}>
          <TouchableOpacity 
            style={styles.legalLink}
            onPress={() => navigation.navigate('PrivacyPolicy')}
          >
            <Text style={styles.legalLinkText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.legalLink}
            onPress={() => navigation.navigate('Terms')}
          >
            <Text style={styles.legalLinkText}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.legalLink}
            onPress={() => Linking.openURL('https://freshyfood.com/licenses')}
          >
            <Text style={styles.legalLinkText}>Licenses</Text>
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerTitle}>FreshyFood Factory</Text>
          <Text style={styles.footerTagline}>
            Connecting farms to families since 2023
          </Text>
          
          <View style={styles.socialLinks}>
            <TouchableOpacity 
              style={styles.socialLink}
              onPress={() => Linking.openURL('https://facebook.com/freshyfood')}
            >
              <Ionicons name="logo-facebook" size={20} color="#4267B2" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.socialLink}
              onPress={() => Linking.openURL('https://twitter.com/freshyfood')}
            >
              <Ionicons name="logo-twitter" size={20} color="#1DA1F2" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.socialLink}
              onPress={() => Linking.openURL('https://instagram.com/freshyfood')}
            >
              <Ionicons name="logo-instagram" size={20} color="#E1306C" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.socialLink}
              onPress={() => Linking.openURL('https://linkedin.com/company/freshyfood')}
            >
              <Ionicons name="logo-linkedin" size={20} color="#0077B5" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.copyright}>
            © 2023-2024 FreshyFood Factory. All rights reserved.
          </Text>
          
          <TouchableOpacity
            style={styles.websiteLink}
            onPress={() => Linking.openURL('https://freshyfood.com')}
          >
            <Text style={styles.websiteText}>www.freshyfood.com</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  shareButton: {
    padding: 8,
    marginRight: 8,
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
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  appTagline: {
    fontSize: 16,
    color: '#E8F5E8',
    textAlign: 'center',
  },
  versionContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 2,
  },
  buildText: {
    fontSize: 12,
    color: '#E8F5E8',
    marginBottom: 2,
  },
  releaseText: {
    fontSize: 12,
    color: '#E8F5E8',
    fontStyle: 'italic',
  },
  statsSection: {
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
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F8E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  storySection: {
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
  storyCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  storyCardExpanded: {
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  storyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storyCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  storyCardContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  featuresSection: {
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
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    textAlign: 'center',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  teamSection: {
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
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  teamScrollContent: {
    paddingRight: 20,
  },
  teamCard: {
    width: 180,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
  },
  teamImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#F5F5F5',
  },
  teamInfo: {
    padding: 12,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 2,
  },
  teamRole: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
    marginBottom: 8,
  },
  teamBio: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  awardsSection: {
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
  awardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  awardCard: {
    width: '48%',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  awardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  awardIssuer: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  partnersSection: {
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
  partnersGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  partnerLogo: {
    alignItems: 'center',
  },
  partnerName: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    width: 100,
  },
  actionsSection: {
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
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionCard: {
    alignItems: 'center',
    width: '30%',
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    marginTop: 8,
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  legalSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    marginHorizontal: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  legalLink: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  legalLinkText: {
    fontSize: 16,
    color: '#212121',
  },
  footer: {
    alignItems: 'center',
    padding: 30,
    marginTop: 16,
  },
  footerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1B5E20',
    marginBottom: 8,
  },
  footerTagline: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  socialLinks: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  socialLink: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  copyright: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 12,
  },
  websiteLink: {
    paddingVertical: 8,
  },
  websiteText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
});

export default AboutScreen;