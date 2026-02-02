import API from "./apiClient";

export const order = (data)=>API.post('/api/order',data)
export const getOrderById =(id) =>API.get(`/api/order/${id}`)
export const getMyOrder = ()=>API.get('/api/myorders')