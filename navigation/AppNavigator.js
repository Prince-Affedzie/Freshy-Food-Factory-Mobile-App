// src/navigation/AppNavigator.js
import React from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext'; // Import auth context
import { useCart } from '../context/CartContext';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import ProductsScreen from '../screens/ProductsScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import SignUpScreen from '../screens/SignUpScreen';
import LoginScreen from '../screens/LoginScreen';
import OrderScreen from '../screens/CheckOutScreen';
import CartScreen from '../screens/CartScreen';
import OrdersScreen from '../screens/OrdersScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen'
import CategoryScreen from '../screens/CategoryScreen';
import AccountScreen from '../screens/AccountScreen'
import FavoritesScreen from '../screens/FavoritesScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import SupportScreen from '../screens/SupportScreen';
import AboutScreen from '../screens/AboutScreen';
import NotificationScreen from '../screens/NotificationsScreen'
//import CartScreen from '../screens/CartScreen'; // You'll need to create this
//import ProfileScreen from '../screens/ProfileScreen'; // You'll need to create this
//import OrdersScreen from '../screens/OrdersScreen'; // You'll need to create this
//import OnboardingScreen from '../screens/OnboardingScreen'; // Optional onboarding

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const AuthStack = createStackNavigator();
export const navigationRef = createNavigationContainerRef();


// Auth Stack Navigator
function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#FFFFFF' },
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
    </AuthStack.Navigator>
  );
}

// Main Tab Navigator (Protected routes)
function MainTabNavigator() {
  const { bottom } = useSafeAreaInsets();
  const { cartCount } = useCart(); 
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Products':
              iconName = focused ? 'basket' : 'basket-outline';
              break;
            case 'Cart':
              iconName = focused ? 'cart' : 'cart-outline';
              break;
            case 'Orders':
              iconName = focused ? 'receipt' : 'receipt-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2E7D32',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          paddingBottom: 5 + bottom,
          paddingTop: 5,
          height: 60 + bottom,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginBottom: 2,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ 
          title: 'Home',
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen 
        name="Products" 
        component={ProductsScreen}
        options={{ 
          title: 'Products',
          tabBarLabel: 'Products',
        }}
      />
      <Tab.Screen 
        name="Cart" 
        component={CartScreen}
        options={{ 
          title: 'Cart',
          tabBarLabel: 'Cart',
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#FF3B30',
            fontSize: 12,
            minWidth: 20,
            height: 20,
          }
        }}
      />
     <Tab.Screen 
        name="Orders" 
        component={OrdersScreen}
        options={{ 
          title: 'Orders',
          tabBarLabel: 'Orders',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={AccountScreen}
        options={{ 
          title: 'Profile',
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}

// Main Stack Navigator (Includes both auth and main app)
function MainStackNavigator() {
  const { user, loading } = useAuth();

  // Show loading screen while checking auth status
  if (loading) {
    return null; // Or return a loading screen component
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        // Authenticated user flow
        <>
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />
          <Stack.Screen 
            name="ProductDetail" 
            component={ProductDetailScreen}
            options={{ 
              headerShown: false,
              title: 'Product Details',
              headerStyle: {
                backgroundColor: '#FFFFFF',
              },
              headerTintColor: '#2E7D32',
              headerTitleStyle: {
                fontWeight: '600',
              },
            }}
          />
          <Stack.Screen 
          name="Category" 
          component={CategoryScreen}
          options={{
          presentation: 'card',
          animation: 'slide_from_right',
          }}
        />
          <Stack.Screen 
           name="Cart" 
           component={CartScreen}
           options={{ headerShown: false }}
          />
          <Stack.Screen 
           name="Order" 
           component={OrderScreen}
           options={{ headerShown: false }}
          />
          <Stack.Screen 
           name="Favorites" 
           component={FavoritesScreen} 
          options={{ headerShown: false }}
           />

          <Stack.Screen 
           name="OrderDetail" 
           component={OrderDetailScreen}
           options={{ headerShown: false }}
          />
          <Stack.Screen 
           name="Notification" 
           component={NotificationScreen}
           options={{ headerShown: false }}
          />
          <Stack.Screen 
             name="PrivacyPolicy" 
              component={PrivacyPolicyScreen} 
               options={{ headerShown: false }}
          />
          <Stack.Screen 
           name="Support" 
           component={SupportScreen} 
           options={{ headerShown: false }}
           />
           <Stack.Screen 
           name="About" 
           component={AboutScreen} 
          options={{ headerShown: false }}
           />
          <Stack.Screen name="Auth" component={AuthNavigator} />
        </>
      ) : (
        // Non-authenticated user flow
        <>
          <Stack.Screen name="Auth" component={AuthNavigator} />
          <Stack.Screen 
            name="ProductDetail" 
            component={ProductDetailScreen}
            options={{ 
              headerShown: false,
              title: 'Product Details',
              headerStyle: {
                backgroundColor: '#FFFFFF',
              },
              headerTintColor: '#2E7D32',
              headerTitleStyle: {
                fontWeight: '600',
              },
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

// Main App Navigator
function AppNavigator() {
  return (
    <NavigationContainer ref={navigationRef}>
      <MainStackNavigator />
    </NavigationContainer>
  );
}

export default AppNavigator;