// App.js
import React, {useEffect,useContext} from 'react';
import { StatusBar } from 'expo-status-bar';
//import { SafeAreaView } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
//import { store } from './src/store/store';
import Constants from "expo-constants";

import AppNavigator from './navigation/AppNavigator';
import { SafeAreaProvider,SafeAreaView } from 'react-native-safe-area-context';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { PaystackProvider } from "react-native-paystack-webview";
import * as Updates from 'expo-updates';
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import usePushNotifications from './hooks/usePushNotification'
import { NotificationProvider } from './context/NotificationContext';
const PayStack_Public_Key = Constants.expoConfig.extra?.EXPO_PayStack_publicKey;


export default function App() {

   useEffect(()=>{
        GoogleSignin.configure({
         webClientId:'34872065423-88pioj4h26bguflctfpub95mt0830an6.apps.googleusercontent.com'
        })
    },[])

  function PushNotificationInitializer() {
    usePushNotifications();
    return null;
  }
  

  useEffect(() => {
      async function checkUpdates() {
        try {
          const update = await Updates.checkForUpdateAsync();
          if (update.isAvailable) {
            await Updates.fetchUpdateAsync();
            await Updates.reloadAsync();
          }
        } catch (e) {
          console.log("Update error:", e);
        }
      }
  
      checkUpdates();
    }, []);

  
    return (
    
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor="#2E7D32" translucent={true} />
        <AuthProvider>
          <NotificationProvider>
        <CartProvider>
       
        
        <PaystackProvider debug 
         publicKey={PayStack_Public_Key}
         currency="GHS"
         defaultChannels={['card','mobile_money','bank_transfer']}
         > 
         <PushNotificationInitializer/>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#2E7D32' }} edges={['top']}>
        <AppNavigator />
        </SafeAreaView>
        </PaystackProvider>
        </CartProvider>
        </NotificationProvider>
        </AuthProvider>
        
      </SafeAreaProvider>
    
  );
}