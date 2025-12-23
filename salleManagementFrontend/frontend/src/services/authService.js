import axios from "axios";
// src/services/authService.js

const API_URL = "http://localhost:8080/api/auth";


export async function login(email, password) {
  try {
    const res = await axios.post("http://localhost:8080/api/auth/login", {
      email,
      password,
    });
    return res.data;
  } catch (err) {
    console.error("LOGIN ERROR:", err.response?.data);
    throw err.response?.data || "Login failed";
  }
}

export async function registerUser(data) {
  const res = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Register failed");
  }

  return await res.json();
}

