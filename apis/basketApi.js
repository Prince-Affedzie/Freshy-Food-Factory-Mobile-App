import API from "./apiClient";

export const fetchBaskets = ()=>API.get('/api/packages')
export const getBasketById =(id)=>API.get(`/api/package/${id}`)