import api from "./api";

export const getUsers = () => api.get("/users");

export const getUsersPage = (page = 0, size = 10, sortBy = "username") =>
  api.get(`/users/page?page=${page}&size=${size}&sortBy=${sortBy}`);

export const getUser = (id) => api.get(`/users/${id}`);

export const createUser = (data) => api.post("/users", data);

export const updateUser = (id, data) => api.put(`/users/${id}`, data);

export const deleteUser = (id) => api.delete(`/users/${id}`);

export const activateUser = (id) => api.patch(`/users/${id}/activate`);

export const deactivateUser = (id) => api.patch(`/users/${id}/deactivate`);
