import API from "./apiClient";
export const initializePayment =()=>API.post('/api/initialize/payment')
export const verifyPayment =(data)=>API.post('/api/verify/payment',data)