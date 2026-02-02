// src/api/mockData.js
export const mockBaskets = [
  {
    id: '1',
    name: 'Starter Basket',
    description: 'Perfect for singles or couples',
    price: 89.99,
    originalPrice: 99.99,
    items: [
      { id: '1', name: 'Tomatoes', quantity: 6, unit: 'pieces', category: 'vegetables' },
      { id: '2', name: 'Onions', quantity: 4, unit: 'pieces', category: 'vegetables' },
      { id: '3', name: 'Carrots', quantity: 8, unit: 'pieces', category: 'vegetables' },
      { id: '4', name: 'Bell Peppers', quantity: 4, unit: 'pieces', category: 'vegetables' },
      { id: '5', name: 'Oranges', quantity: 6, unit: 'pieces', category: 'fruits' },
    ],
    deliveryDay: 'Monday',
    tag: 'Most Popular',
    maxCustomizations: 3,
  },
  {
    id: '2',
    name: 'Family Basket',
    description: 'Feeds 4-5 people for a week',
    price: 149.99,
    originalPrice: 169.99,
    items: [
      { id: '1', name: 'Tomatoes', quantity: 10, unit: 'pieces', category: 'vegetables' },
      { id: '2', name: 'Onions', quantity: 8, unit: 'pieces', category: 'vegetables' },
      { id: '3', name: 'Carrots', quantity: 12, unit: 'pieces', category: 'vegetables' },
      { id: '4', name: 'Bell Peppers', quantity: 6, unit: 'pieces', category: 'vegetables' },
      { id: '5', name: 'Oranges', quantity: 10, unit: 'pieces', category: 'fruits' },
      { id: '6', name: 'Apples', quantity: 8, unit: 'pieces', category: 'fruits' },
      { id: '7', name: 'Potatoes', quantity: 2, unit: 'kg', category: 'vegetables' },
    ],
    deliveryDay: 'Wednesday',
    tag: 'Best Value',
    maxCustomizations: 5,
  },
  {
    id: '3',
    name: 'Mega Basket',
    description: 'For large families or restaurants',
    price: 249.99,
    originalPrice: 279.99,
    items: [
      { id: '1', name: 'Tomatoes', quantity: 15, unit: 'pieces', category: 'vegetables' },
      { id: '2', name: 'Onions', quantity: 12, unit: 'pieces', category: 'vegetables' },
      { id: '3', name: 'Carrots', quantity: 16, unit: 'pieces', category: 'vegetables' },
      { id: '4', name: 'Bell Peppers', quantity: 10, unit: 'pieces', category: 'vegetables' },
      { id: '5', name: 'Oranges', quantity: 15, unit: 'pieces', category: 'fruits' },
      { id: '6', name: 'Apples', quantity: 12, unit: 'pieces', category: 'fruits' },
      { id: '7', name: 'Potatoes', quantity: 4, unit: 'kg', category: 'vegetables' },
      { id: '8', name: 'Cabbage', quantity: 2, unit: 'pieces', category: 'vegetables' },
      { id: '9', name: 'Eggs', quantity: 30, unit: 'pieces', category: 'protein' },
    ],
    deliveryDay: 'Friday',
    maxCustomizations: 8,
  },
];

export const mockAddons = [
  { id: 'a1', name: 'Fresh Eggs', price: 15.99, unit: 'dozen', category: 'protein' },
  { id: 'a2', name: 'Fresh Milk', price: 8.99, unit: 'liter', category: 'dairy' },
  { id: 'a3', name: 'Cooking Oil', price: 12.99, unit: 'liter', category: 'pantry' },
  { id: 'a4', name: 'Chicken Breast', price: 24.99, unit: 'kg', category: 'meat' },
  { id: 'a5', name: 'Rice', price: 18.99, unit: 'kg', category: 'grains' },
];

export const mockOrders = [
  {
    id: 'o1',
    basketName: 'Family Basket',
    date: '2024-01-15',
    amount: 149.99,
    status: 'delivered',
    items: 12,
    deliveryAddress: '123 Main St, Accra',
  },
  {
    id: 'o2',
    basketName: 'Starter Basket',
    date: '2024-01-08',
    amount: 89.99,
    status: 'delivered',
    items: 8,
    deliveryAddress: '123 Main St, Accra',
  },
];

export const productCategories = [
  { id: 'all', name: 'All Products', icon: '🛒' },
  { id: 'vegetable', name: 'Vegetables', icon: '🥦' },
  { id: 'fruit', name: 'Fruits', icon: '🍎' },
  { id: 'staple', name: 'Staples', icon: '🌾' },
  { id: 'tuber', name: 'Tubers', icon: '🥔' },
  { id: 'herb', name: 'Herbs', icon: '🌿' },
  { id: 'other', name: 'Others', icon: '📦' },
];