// src/services/basketService.js
import { mockBaskets, mockAddons } from '../apis/mockData';
import {fetchBaskets,getBasketById} from '../apis/basketApi'

class BasketService {
  // Simulate API call
  async getBaskets() {
    const response = await fetchBaskets()
    return response;
  }

  async getBasketById(id) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const basket = mockBaskets.find(b => b.id === id);
        resolve({
          success: !!basket,
          data: basket,
        });
      }, 300);
    });
  }

  async getAddons() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: mockAddons,
        });
      }, 500);
    });
  }

  async customizeBasket(basketId, customizations) {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Customizing basket:', { basketId, customizations });
        resolve({
          success: true,
          data: {
            id: 'custom_' + Date.now(),
            basketId,
            customizations,
            subtotal: 149.99,
            discount: 15.00,
            total: 134.99,
            deliveryFee: 5.00,
            grandTotal: 139.99,
          },
        });
      }, 800);
    });
  }

  async subscribeToBasket(basketId, subscriptionType) {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Subscribing to basket:', { basketId, subscriptionType });
        resolve({
          success: true,
          data: {
            subscriptionId: 'sub_' + Date.now(),
            nextDelivery: '2024-01-22',
            status: 'active',
          },
        });
      }, 1000);
    });
  }
}

export default new BasketService();