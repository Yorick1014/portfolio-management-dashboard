import axios from 'axios'

export function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<{ detail?: string }>(error)) {
    return error.response?.data?.detail ?? fallback
  }

  if (hasResponseDetail(error)) {
    return error.response.data.detail
  }

  if (error instanceof Error) {
    return error.message
  }

  return fallback
}

function hasResponseDetail(
  error: unknown,
): error is { response: { data: { detail: string } } } {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return false
  }

  const response = error.response
  if (typeof response !== 'object' || response === null || !('data' in response)) {
    return false
  }

  const data = response.data
  return (
    typeof data === 'object' &&
    data !== null &&
    'detail' in data &&
    typeof data.detail === 'string'
  )
}
