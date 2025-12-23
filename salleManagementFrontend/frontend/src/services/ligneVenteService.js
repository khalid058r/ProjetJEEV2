import api from "./api";

export function addLine(saleId, data) {
  return api.post(`/ligne-ventes/${saleId}`, data);
}

export function updateLine(lineId, data) {
  return api.put(`/ligne-ventes/${lineId}`, data);
}

export function deleteLine(lineId) {
  return api.delete(`/ligne-ventes/${lineId}`);
}
