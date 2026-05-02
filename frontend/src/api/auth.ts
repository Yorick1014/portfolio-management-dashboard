import { apiClient } from './client'

export type User = {
  id: string
  username: string
}

export type AuthCredentials = {
  username: string
  password: string
}

type TokenResponse = {
  access_token: string
  token_type: string
}

export async function loginUser(credentials: AuthCredentials) {
  const response = await apiClient.post<TokenResponse>('/auth/login', credentials)
  return response.data
}

export async function registerUser(credentials: AuthCredentials) {
  const response = await apiClient.post<User>('/auth/register', credentials)
  return response.data
}

export async function getCurrentUser() {
  const response = await apiClient.get<User>('/me')
  return response.data
}
