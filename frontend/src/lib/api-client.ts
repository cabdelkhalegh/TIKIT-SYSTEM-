import axios from 'axios'

// Always use relative URL — API routes are co-located on Vercel
const API_BASE_URL = '/api/v1'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Read token from Zustand persisted state
    const authStorage = localStorage.getItem('tikit-auth-storage')
    if (authStorage) {
      try {
        const parsed = JSON.parse(authStorage)
        const token = parsed.state?.token
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
      } catch (error) {
        console.error('Failed to parse auth storage:', error)
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth and redirect to login
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
