// src/services/paymentService.js
import { Alert } from 'react-native';
import { initializePayment } from '../apis/paymentApi';
import { setPaymentCallbacks, clearPaymentCallbacks } from './paymentCallbacks';

export const triggerPayment = async ({ navigation, email, phone, amount }) => {
  return new Promise(async (resolve) => {
    try {
      const initRes = await initializePayment({ email, phone, amount });
      const { authorization_url, reference } = initRes.data; 

      const callbackId = reference; // unique per transaction

      // Store callbacks by reference — survives navigation
      setPaymentCallbacks(callbackId, {
        onSuccess: (result) => {
          clearPaymentCallbacks(callbackId);
          resolve({ success: true, reference, ...result });
        },
        onCancel: () => {
          clearPaymentCallbacks(callbackId);
          resolve({ success: false, cancelled: true });
        },
        onError: () => {
          clearPaymentCallbacks(callbackId);
          resolve({ success: false });
        },
      });

      navigation.navigate('Payment', {
        authorization_url,
        reference,
        callbackId,
        callback_url: 'https://freshy-food-frontend.vercel.app/order-success',
        cancel_url:   'https://freshy-food-frontend.vercel.app/',
      });

    } catch (err) {
      console.error('Payment init error:', err);
      Alert.alert('Error', 'Could not start payment.');
      resolve({ success: false });
    }
  });
};