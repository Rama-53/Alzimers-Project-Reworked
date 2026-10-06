import axios from 'axios'

/** Axios instance with base URL pointing to FastAPI backend (proxied by Vite in dev). */
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

// Response interceptor for global error logging
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

export default api
