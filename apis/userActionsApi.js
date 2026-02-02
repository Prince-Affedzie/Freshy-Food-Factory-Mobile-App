import API from "./apiClient";

/* =======================
   CART APIS
======================= */

// Add product to cart
export const addToCart = (data) =>
  API.post('/api/cart', data);
// data = { productId, quantity }

// Update cart quantity
export const updateCartQuantity = (data) =>
  API.put('/api/cart', data);
// data = { productId, quantity }

// Remove product from cart
export const removeFromCart = (productId) =>
  API.delete(`/api/cart/${productId}`);

// Get cart items
export const getMyCart = () =>
  API.get('/api/me/cart-favorites');


/* =======================
   FAVORITES APIS
======================= */

// Add product to favorites
export const addToFavorites = (productId) =>
  API.post(`/api/favorites/${productId}`);
// data = { productId }

// Remove product from favorites
export const removeFromFavorites = (productId) =>
  API.delete(`/api/favorites/${productId}`);

// Get favorites
export const getMyFavorites = () =>
  API.get('/api/me/cart-favorites');

export const emptyCart = ()=>
  API.put('/api/clear_cart')
