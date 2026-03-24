import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  Dimensions,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const FullScreenLoader = ({
  visible = false,
  loadingText = 'Loading...',
  subText = 'Please wait...',
  loadingType = 'default',
  categoryName = '',
  searchQuery = '',
  loadedCount = 0,
  totalCount = 0,
  icon = 'leaf',
  iconColor = '#4CAF50',
  backgroundColor = 'rgba(255, 255, 255, 0.98)',
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 7,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.timing(spinAnim, {
            toValue: 1,
            duration: 1400,
            useNativeDriver: true,
            easing: Easing.linear,
          })
        ),
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.08,
              duration: 800,
              useNativeDriver: true,
              easing: Easing.inOut(Easing.ease),
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
              easing: Easing.inOut(Easing.ease),
            }),
          ])
        ),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.92,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const getLoadingTitle = () => {
    switch (loadingType) {
      case 'category':
        return categoryName || 'Loading Category';
      case 'search':
        return searchQuery ? `"${searchQuery}"` : 'Searching';
      default:
        return loadingText;
    }
  };

  const getLoadingSubtitle = () => {
    switch (loadingType) {
      case 'category':
        return categoryName ? `${categoryName} products` : 'Getting items...';
      case 'search':
        return searchQuery ? `Finding matches for "${searchQuery}"` : 'Searching products...';
      default:
        return subText;
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          backgroundColor,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Curvy Background Shape */}
        <View style={styles.curvyShape}>
          <View style={styles.curvyTop} />
          <View style={styles.curvyMiddle} />
          <View style={styles.curvyBottom} />
        </View>

        {/* Animated Icon with Pulse Effect */}
        <Animated.View 
          style={[
            styles.iconContainer,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Ionicons name={icon} size={34} color={iconColor} />
          </Animated.View>
          <View style={[styles.iconGlow, { backgroundColor: `${iconColor}15` }]} />
        </Animated.View>

        {/* Loading Text */}
        <Text style={styles.title} numberOfLines={1}>
          {getLoadingTitle()}
        </Text>

        {/* Subtle Subtitle */}
        <Text style={styles.subtitle} numberOfLines={1}>
          {getLoadingSubtitle()}
        </Text>

        {/* Minimal Dots Animation */}
        <View style={styles.dotsContainer}>
          {[0, 1, 2].map((dot) => (
            <Animated.View
              key={dot}
              style={[
                styles.dot,
                {
                  backgroundColor: iconColor,
                  opacity: spinAnim.interpolate({
                    inputRange: [0, 0.33, 0.66, 1],
                    outputRange: [0.3, 0.8, 0.3, 0.8],
                    extrapolate: 'clamp',
                  }),
                  transform: [
                    {
                      translateY: spinAnim.interpolate({
                        inputRange: [0, 0.33, 0.66, 1],
                        outputRange: [0, -3, 0, -3],
                        extrapolate: 'clamp',
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 24,
    borderRadius: 48,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
    minWidth: 220,
    maxWidth: width * 0.75,
    position: 'relative',
    overflow: 'hidden',
  },
  curvyShape: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 78,
    overflow: 'hidden',
  },
  curvyTop: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F8F9FA',
  },
  curvyMiddle: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F5F7F5',
  },
  curvyBottom: {
    position: 'absolute',
    top: '30%',
    left: -50,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FAFBF8',
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
  },
  iconGlow: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    opacity: 0.5,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.1,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
});

export default FullScreenLoader;