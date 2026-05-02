import axios from 'axios'
import { getStoredAuthToken } from '../auth/tokenStorage'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api',
})

apiClient.interceptors.request.use((config) => {
  const token = getStoredAuthToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})
