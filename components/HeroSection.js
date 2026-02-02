// src/components/HeroSection.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
  Animated,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const SLIDE_HEIGHT = width * 0.6; // 60% of screen width
const SLIDE_INTERVAL = 5000; // 5 seconds auto slide

const HeroSection = ({ navigation }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);
  const timerRef = useRef(null);

  const slides = [
    {
      id: '1',
      title: 'Farm Fresh Vegetables',
      description: 'Direct from local farms to your kitchen',
      image: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1769990959/farmer_qzqsir.jpg',
      backgroundColor: '#4CAF50',
      cta: 'Shop Vegetables',
      navigateTo: 'Products',
      params: { category: 'vegetables' }
    },
    {
      id: '2',
      title: 'Farm Fresh Fruits',
      description: 'Ripe, sweet, and packed with nutrition',
      image: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1769990080/vegetables_cpp5n5.jpg',
      backgroundColor: '#FF9800',
      cta: 'Shop Fruits',
      navigateTo: 'Products',
      params: { category: 'fruits' }
    },
    {
      id: '3',
      title: 'Organic Staples',
      description: 'Premium quality grains and essentials',
      image: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1769989358/plastic-bag-with-vegetables_lwxl8o.jpg',
      backgroundColor: '#795548',
      cta: 'Shop Staples',
      navigateTo: 'Products',
      params: { category: 'staples' }
    },
    {
      id: '4',
      title: 'Free Delivery',
      description: 'On orders over GH₵ 200',
      image: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1769989775/free_delivery_tsytih.jpg',
      backgroundColor: '#2196F3',
      cta: 'Shop Now',
      navigateTo: 'Products',
      params: {}
    },
    {
      id: '5',
      title: 'Fresh Herbs & Tubers',
      description: 'Locally sourced with authentic taste',
      image: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1769990079/tubers_lya09t.jpg',
      backgroundColor: '#9C27B0',
      cta: 'Explore More',
      navigateTo: 'Products',
      params: {}
    },
  ];

  // Auto slide functionality
  useEffect(() => {
    startAutoSlide();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startAutoSlide = () => {
    timerRef.current = setInterval(() => {
      const nextIndex = (activeIndex + 1) % slides.length;
      setActiveIndex(nextIndex);
      
      if (flatListRef.current) {
        flatListRef.current.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
      }
    }, SLIDE_INTERVAL);
  };

  const handleSlidePress = (slide) => {
    navigation.navigate(slide.navigateTo, slide.params);
  };

  const handleScroll = (event) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.floor(contentOffset / slideSize);
    
    if (activeIndex !== index) {
      setActiveIndex(index);
      // Reset timer on manual scroll
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      startAutoSlide();
    }
  };

  const renderSlide = ({ item }) => (
    <TouchableOpacity
      style={[styles.slide, { backgroundColor: item.backgroundColor }]}
      onPress={() => handleSlidePress(item)}
      activeOpacity={0.9}
    >
      <Image
        source={{ uri: item.image }}
        style={styles.slideImage}
        resizeMode="cover"
      />
      <View style={styles.slideOverlay}>
        <View style={styles.slideContent}>
          <Text style={styles.slideTitle}>{item.title}</Text>
          <Text style={styles.slideDescription}>{item.description}</Text>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => handleSlidePress(item)}
          >
            <Text style={styles.ctaText}>{item.cta}</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderPagination = () => {
    return (
      <View style={styles.paginationContainer}>
        <View style={styles.paginationDots}>
          {slides.map((_, index) => {
            const inputRange = [
              (index - 1) * width,
              index * width,
              (index + 1) * width,
            ];

            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 16, 8],
              extrapolate: 'clamp',
            });

            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });

            return (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  {
                    width: dotWidth,
                    opacity,
                    backgroundColor: activeIndex === index ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)',
                  },
                ]}
              />
            );
          })}
        </View>
        
        {/* Slide counter */}
        <View style={styles.slideCounter}>
          <Text style={styles.slideCounterText}>
            {activeIndex + 1} / {slides.length}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false, listener: handleScroll }
        )}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={width}
        snapToAlignment="start"
      />
      
      {renderPagination()}
      
      {/* Previous/Next buttons */}
      <View style={styles.navButtons}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => {
            const prevIndex = activeIndex === 0 ? slides.length - 1 : activeIndex - 1;
            setActiveIndex(prevIndex);
            flatListRef.current?.scrollToIndex({
              index: prevIndex,
              animated: true,
            });
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            startAutoSlide();
          }}
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => {
            const nextIndex = (activeIndex + 1) % slides.length;
            setActiveIndex(nextIndex);
            flatListRef.current?.scrollToIndex({
              index: nextIndex,
              animated: true,
            });
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            startAutoSlide();
          }}
        >
          <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  slide: {
    width: width,
    height: SLIDE_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
  },
  slideImage: {
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  slideOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
    padding: 20,
  },
  slideContent: {
    maxWidth: '80%',
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  slideDescription: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 20,
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  paginationDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  slideCounter: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  slideCounterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  navButtons: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    pointerEvents: 'box-none',
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HeroSection;