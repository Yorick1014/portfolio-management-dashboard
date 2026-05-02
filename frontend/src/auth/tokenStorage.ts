export const authTokenStorageKey = 'portfolio_token'

export function getStoredAuthToken() {
  return localStorage.getItem(authTokenStorageKey)
}

export function storeAuthToken(token: string) {
  localStorage.setItem(authTokenStorageKey, token)
}

export function clearStoredAuthToken() {
  localStorage.removeItem(authTokenStorageKey)
}
