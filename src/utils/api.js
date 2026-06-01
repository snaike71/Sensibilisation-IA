// Base URL du backend.
// En local (Docker) : vide → les appels sont relatifs, proxiés par nginx.
// Sur Vercel : VITE_API_BASE = URL ngrok, ex. https://xyz.ngrok-free.app
export const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/$/, '') || ''

export function apiUrl(path) {
  return `${API_BASE}${path}`
}
