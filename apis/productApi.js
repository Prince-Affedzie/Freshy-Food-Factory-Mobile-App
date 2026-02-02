import API from "./apiClient";
export const getAllProducts = ()=>API.get('/api/products')
export const getProductById =(id)=>API.get(`/api/product/${id}`)
export const getProductsByCategory =(category)=>API.get(`/api/products/category/${category}`)
export const searchProducts =(query)=>API.get(`/api/products/search/${query}`)