import axios from 'axios'

export function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<{ detail?: string }>(error)) {
    return error.response?.data?.detail ?? fallback
  }

  if (error instanceof Error) {
    return error.message
  }

  return fallback
}
