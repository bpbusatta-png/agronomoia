import axios, { type InternalAxiosRequestConfig } from 'axios'
import { deleteItem, getItem, setItem } from './tokenStorage'

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000/api'

export const api = axios.create({ baseURL: API_URL })

export async function getAccessToken() {
  return getItem('access_token')
}

export async function setTokens(accessToken: string, refreshToken: string) {
  await setItem('access_token', accessToken)
  await setItem('refresh_token', refreshToken)
}

export async function clearTokens() {
  await deleteItem('access_token')
  await deleteItem('refresh_token')
}

api.interceptors.request.use(async (config) => {
  const token = await getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getItem('refresh_token')
  if (!refreshToken) return null
  try {
    const { data } = await axios.post(`${API_URL}/auth/refresh`, { refresh_token: refreshToken })
    await setTokens(data.access_token, data.refresh_token)
    return data.access_token as string
  } catch {
    return null
  }
}

let refreshing: Promise<string | null> | null = null

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true
      refreshing = refreshing ?? refreshAccessToken()
      const newToken = await refreshing
      refreshing = null
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      }
      await clearTokens()
    }
    return Promise.reject(error)
  },
)
