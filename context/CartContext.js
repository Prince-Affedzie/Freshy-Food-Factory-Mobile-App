import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  addToCart as addToCartApi,
  removeFromCart as removeFromCartApi,
  updateCartQuantity as updateCartQuantityApi,
  getMyCart,
  emptyCart,
  getMyFavorites,
} from '../apis/userActionsApi';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [favoriteItems, setFavoriteItems] = useState([]);
  const [error, setError] = useState(null);

  /* =======================
     LOAD CART FROM BACKEND
  ======================= */
  const fetchCart = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getMyCart();
      
      // Validate the response structure
      if (res.data && Array.isArray(res.data.cartItems)) {
        setCartItems(res.data.cartItems || []);
        setFavoriteItems(res.data.favorites || []);
      } else {
        console.warn('Unexpected cart response structure:', res.data);
        setCartItems([]);
        setFavoriteItems([]);
      }
    } catch (error) {
      console.error('Failed to fetch cart', error);
      setError(error.message || 'Failed to load cart');
      // Keep existing cart items to prevent blank screen
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  /* =======================
     ADD TO CART
  ======================= */
  const addToCart = async (productId, quantity = 1) => {
    try {
      setLoading(true);
      setError(null);
      const res = await addToCartApi({ productId, quantity });
      
      if (res.data && Array.isArray(res.data.cartItems)) {
        setCartItems(res.data.cartItems);
      } else {
        console.warn('Unexpected response from addToCart:', res.data);
        // Refresh cart to ensure consistency
        await fetchCart();
      }
    } catch (error) {
      console.error('Add to cart failed', error);
      setError(error.message || 'Failed to add to cart');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /* =======================
     REMOVE FROM CART
  ======================= */
  const removeFromCart = async (productId) => {
    try {
      setLoading(true);
      setError(null);
      const res = await removeFromCartApi(productId);
      
      if (res.data && Array.isArray(res.data.cartItems)) {
        setCartItems(res.data.cartItems);
      } else {
        console.warn('Unexpected response from removeFromCart:', res.data);
        await fetchCart();
      }
    } catch (error) {
      console.error('Remove from cart failed', error);
      setError(error.message || 'Failed to remove item');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /* =======================
     FIXED UPDATE QUANTITY
  ======================= */
  const updateQuantity = async (productId, quantity) => {
    if (quantity < 1) {
      return removeFromCart(productId);
    }

    try {
      setLoading(true);
      setError(null);
      
      // OPTIMISTIC UPDATE: Show immediate UI feedback
      setCartItems(prevItems => {
        return prevItems.map(item => {
          // Check multiple possible ID fields
          const itemProductId = item.product?._id || item.productId || item.id;
          if (itemProductId === productId) {
            return {
              ...item,
              quantity: quantity,
              product: item.product ? { ...item.product } : null
            };
          }
          return item;
        });
      });

      // Make API call
      const res = await updateCartQuantityApi({ productId, quantity });
      
      // Validate response
      if (res.data && Array.isArray(res.data.cartItems)) {
        // Only update if the response has valid data
        setCartItems(res.data.cartItems);
      } else {
        console.warn('Unexpected response from updateQuantity:', res.data);
        // If response is invalid, refresh cart to get correct state
        await fetchCart();
      }
      
    } catch (error) {
      console.error('Update quantity failed', error);
      setError(error.message || 'Failed to update quantity');
      
      // On error, revert optimistic update and refresh from server
      await fetchCart();
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /* =======================
     SAFE UPDATE QUANTITY (Alternative)
     This version is more robust and prevents common issues
  ======================= */
  const updateQuantitySafe = async (productId, quantity) => {
    if (quantity < 1) {
      return removeFromCart(productId);
    }

    try {
      setLoading(true);
      setError(null);
      
      // Save current cart state for rollback
      const previousCartItems = [...cartItems];
      
      // 1. Optimistically update local state
      setCartItems(prevItems => {
        const updatedItems = prevItems.map(item => {
          // Try all possible ID locations
          const possibleIds = [
            item.product?._id,
            item.productId,
            item.id,
            item.product?.id,
            item.product?._id?.toString(),
            item.productId?.toString(),
            item.id?.toString(),
            item.product?.id?.toString()
          ];
          
          if (possibleIds.some(id => id?.toString() === productId?.toString())) {
            return {
              ...item,
              quantity: quantity,
              // Preserve product object structure
              product: item.product ? { ...item.product } : item.product
            };
          }
          return item;
        });
        
        return updatedItems;
      });

      // 2. Make API call
      const res = await updateCartQuantityApi({ productId, quantity });
      
      // 3. Validate API response
      if (!res.data || !Array.isArray(res.data.cartItems)) {
        throw new Error('Invalid response from server');
      }
      
      // 4. Validate cart items structure
      const isValidCartItems = res.data.cartItems.every(item => 
        item && 
        (item.product || item.productId) && 
        typeof item.quantity === 'number'
      );
      
      if (!isValidCartItems) {
        console.error('Invalid cart items structure:', res.data.cartItems);
        throw new Error('Invalid cart data received');
      }
      
      // 5. Update with validated data
      setCartItems(res.data.cartItems);
      
    } catch (error) {
      console.error('Update quantity failed:', error);
      setError(error.message || 'Failed to update quantity');
      
      // Rollback to previous state
      setCartItems(previousCartItems);
      
      // Refresh from server to ensure consistency
      setTimeout(() => {
        fetchCart();
      }, 100);
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /* =======================
     DEBUG FUNCTION: Log cart structure
  ======================= */
  const debugCart = () => {
    console.log('=== CART DEBUG INFO ===');
    console.log('Cart Items Count:', cartItems.length);
    console.log('Cart Items Structure:', cartItems.map((item, index) => ({
      index,
      itemKeys: Object.keys(item),
      productKeys: item.product ? Object.keys(item.product) : 'No product',
      productId: item.product?._id || item.productId || item.id,
      quantity: item.quantity,
      hasProduct: !!item.product
    })));
  };

  /* =======================
     CLEAR CART
  ======================= */
  const clearCart = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await emptyCart()
      if(res.status ===200){
      setCartItems([]);
      }
      
    } catch (error) {
      console.error('Clear cart failed', error);
      setError(error.message || 'Failed to clear cart');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /* =======================
     DERIVED VALUES (with safety checks)
  ======================= */
  const cartTotal = cartItems.reduce(
    (total, item) => {
      const price = item.product?.price || item.price || 0;
      const quantity = item.quantity || 1;
      return total + (price * quantity);
    },
    0
  );

  const cartCount = cartItems.reduce(
    (count, item) => count + (item.quantity || 1),
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        favoriteItems,
        loading,
        error,
        addToCart,
        removeFromCart,
        updateQuantity: updateQuantitySafe, // Use the safer version
        clearCart,
        cartTotal,
        cartCount,
        refreshCart: fetchCart,
        debugCart // For debugging only
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};