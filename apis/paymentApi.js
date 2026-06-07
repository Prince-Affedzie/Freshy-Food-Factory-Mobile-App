import API from "./apiClient";
export const initializePayment =(data)=>API.post('/api/initialize/payment',data)
export const verifyPayment =(reference)=>API.post(`/api/verify/payment/${reference}`)
