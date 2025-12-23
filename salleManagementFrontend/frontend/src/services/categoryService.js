import api from "./api";

export const getCategories = () => api.get("/categories");

export const getCategory = (id) => api.get(`/categories/${id}`);

export const createCategory = (data) => api.post("/categories", data);

export const updateCategory = (id, data) =>
  api.put(`/categories/${id}`, data);

export const deleteCategory = (id) => api.delete(`/categories/${id}`);

export const getCategoryProducts = (id) =>
  api.get(`/categories/${id}/products`);
