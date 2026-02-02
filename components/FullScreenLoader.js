import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const FullScreenLoader = ({
  visible = false,
  loadingText = 'Loading...',
  subText = 'Please wait while we fetch your data',
  loadingType = 'default', // 'default', 'category', 'search'
  categoryName = '',
  searchQuery = '',
  loadedCount = 0,
  totalCount = 0,
  icon = 'leaf',
  iconColor = '#4CAF50',
  backgroundColor = 'rgba(255, 255, 255, 0.95)',
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  useEffect(() => {
    if (visible) {
      // Fade in animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.timing(spinAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          })
        ),
      ]).start();
    } else {
      // Fade out animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  // Determine text based on loading type
  const getLoadingTitle = () => {
    switch (loadingType) {
      case 'category':
        return categoryName ? `Loading ${categoryName}...` : 'Switching Category...';
      case 'search':
        return searchQuery ? `Searching for "${searchQuery}"...` : 'Searching...';
      default:
        return loadingText;
    }
  };

  const getLoadingSubtitle = () => {
    switch (loadingType) {
      case 'category':
        return categoryName ? `Fetching ${categoryName} products...` : 'Getting category items...';
      case 'search':
        return searchQuery ? `Finding matches for "${searchQuery}"...` : 'Searching through products...';
      default:
        return subText;
    }
  };

  return (
    <Animated.View
      style={[
        styles.fullScreenLoader,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          backgroundColor,
        },
      ]}
    >
      <View style={styles.loaderContent}>
        {/* Animated Logo/Icon */}
        <View style={styles.loaderIconContainer}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Ionicons name={icon} size={60} color={iconColor} />
          </Animated.View>
          <View style={[styles.innerIcon, { backgroundColor: iconColor }]}>
            <Ionicons name="basket" size={30} color="#FFFFFF" />
          </View>
        </View>

        {/* Loading Text */}
        <Text style={styles.loaderTitle}>
          {getLoadingTitle()}
        </Text>

        <Text style={styles.loaderSubtitle}>
          {getLoadingSubtitle()}
        </Text>

        {/* Progress Dots Animation */}
        <View style={styles.progressDots}>
          {[0, 1, 2].map((dot) => (
            <Animated.View
              key={dot}
              style={[
                styles.progressDot,
                {
                  opacity: spinAnim.interpolate({
                    inputRange: [0, 0.25, 0.5, 0.75, 1],
                    outputRange: [0.3, 0.6, 0.9, 0.6, 0.3],
                    extrapolate: 'clamp',
                  }),
                  transform: [
                    {
                      translateY: spinAnim.interpolate({
                        inputRange: [0, 0.25, 0.5, 0.75, 1],
                        outputRange: [0, -8, 0, -8, 0],
                        extrapolate: 'clamp',
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}
        </View>

        {/* Optional: Loading percentage or progress bar */}
        {totalCount > 0 && (
          <View style={styles.loaderStats}>
            <Text style={styles.loaderStatsText}>
              {`${loadedCount} of ${totalCount} items loaded`}
            </Text>
          </View>
        )}
      </View>

      {/* Background Pattern */}
      <View style={styles.loaderPattern}>
        {[...Array(6)].map((_, i) => (
          <View key={i} style={styles.patternItem}>
            <Ionicons name={`${icon}-outline`} size={24} color={`${iconColor}20`} />
          </View>
        ))}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  fullScreenLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  loaderContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    borderRadius: 20,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    maxWidth: width * 0.85,
  },
  loaderIconContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  innerIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -15 }, { translateY: -15 }],
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  loaderSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    marginHorizontal: 6,
  },
  loaderStats: {
    marginTop: 10,
  },
  loaderStatsText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  loaderPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  patternItem: {
    margin: 20,
    opacity: 0.5,
  },
});

export default FullScreenLoader;