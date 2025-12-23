import api from "./api"; // axios instance

export function getSales() {
  return api.get("/sales");
}

export function getSale(id) {
  return api.get(`/sales/${id}`);
}

export function createSale(data) {
  return api.post("/sales", data);
}

export function deleteSale(id) {
  return api.delete(`/sales/${id}`);
}

export function cancelSale(id) {
  return api.post(`/sales/${id}/cancel`);
}
