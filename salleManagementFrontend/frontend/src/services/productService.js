import api from "./api";

// ✅ GET all products
export const getProducts = () => api.get("/products");

// ✅ GET one product
export const getProduct = (id) => api.get(`/products/${id}`);

// ✅ CREATE
export const createProduct = (data) => api.post("/products", data);

// ✅ UPDATE
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);

// ✅ DELETE
export const deleteProduct = (id) => api.delete(`/products/${id}`);
