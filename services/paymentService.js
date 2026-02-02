import axios from "axios";
import { usePaystack } from "react-native-paystack-webview";
import { Alert } from "react-native";
import { initializePayment } from "../apis/paymentApi";
import { verifyPayment } from "../apis/paymentApi";


export const triggerPayment = async ({
  popup,
  email,
  phone,
  amount,
}) => {
  try {
    const initRes = await initializePayment();
    const { reference } = initRes.data;
    console.log(email)
    return new Promise((resolve) => {
      popup.newTransaction({
        email,
        phone,
        amount,
        reference,

        onSuccess: async () => {
          try {
            const verifyRes = await verifyPayment(reference, {
              amount,
            });

            if (verifyRes.status === 200) {
              const payment = verifyRes.data.payment;

              if (!payment?._id) {
                Alert.alert("Error", "Payment recorded but ID missing.");
                return resolve({ success: false });
              }

              Alert.alert("Payment Successful", "Funds secured.");

              resolve({
                success: true,
                paymentId: payment._id,
              });
            } else {
              Alert.alert("Verification Failed");
              resolve({ success: false });
            }
          } catch (err) {
            console.error("Verification Error:", err);
            Alert.alert("Error", "Payment verification failed.");
            resolve({ success: false });
          }
        },

        onCancel: () => {
          Alert.alert("Payment Cancelled");
          resolve({ success: false });
        },

        onError: (err) => {
          console.error("Paystack Error:", err);
          Alert.alert("Payment Error");
          resolve({ success: false });
        },
      });
    });
  } catch (err) {
    console.error("Error starting payment:", err);
    Alert.alert("Error", "Could not start payment.");
    return { success: false };
  }
};
