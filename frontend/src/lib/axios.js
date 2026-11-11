import axios from "axios";

// Satu sumber kebenaran untuk backend URL.
// VITE_API_URL      → full URL termasuk /api  (contoh: http://127.0.0.1:8000/api)
// VITE_BACKEND_URL  → root URL tanpa /api     (contoh: http://127.0.0.1:8000)
// Jika hanya VITE_BACKEND_URL yang diset, /api di-append otomatis.
const backendUrl = import.meta.env.VITE_BACKEND_URL ?? "http://127.0.0.1:8000";

export const apiBaseUrl = import.meta.env.VITE_API_URL ?? `${backendUrl}/api`;
export const backendBaseUrl = backendUrl;

// ──────────────────────────────────────────────────────────────────────────────
// CATATAN ARSITEKTUR AUTH:
//
// Token autentikasi disimpan di HttpOnly cookie yang di-set oleh backend Laravel.
// Cookie HttpOnly TIDAK DAPAT dibaca oleh JavaScript (document.cookie) —
// ini adalah fitur keamanan browser yang melindungi dari serangan XSS.
//
// Flow autentikasi:
//   1. Backend set cookie `auth_token` (httpOnly: true) saat login berhasil.
//   2. Browser otomatis menyertakan cookie ini di SETIAP request karena
//      `withCredentials: true` di bawah.
//   3. Middleware `InjectTokenFromCookie` di Laravel membaca cookie tersebut
//      (sisi server) dan memasukkannya ke header Authorization.
//   4. Sanctum memvalidasi token dari header Authorization.
//
// JANGAN pernah mencoba membaca `auth_token` via document.cookie di frontend —
// hasilnya akan selalu undefined karena HttpOnly cookie tidak terekspos ke JS.
// ──────────────────────────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    Accept: "application/json",
  },
  // withCredentials: true memastikan browser menyertakan cookie (termasuk
  // HttpOnly cookie auth_token) di setiap cross-origin request ke backend.
  withCredentials: true,
});

// Response interceptor — handle 401 global
// PENTING: /auth/me DIKECUALIKAN karena endpoint itu memang bisa return 401
// untuk user yang belum login di halaman publik. AuthContext sudah handle sendiri.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || "";
    const isAuthMe = requestUrl.includes("/auth/me");

    if (error.response?.status === 401 && !isAuthMe) {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default api;
