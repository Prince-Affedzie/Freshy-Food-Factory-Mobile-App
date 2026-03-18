import API from "./apiClient";
export const initializePayment =()=>API.post('/api/initialize/payment')
export const verifyPayment =(reference,data)=>API.post(`/api/verify/payment/${reference}`,data)