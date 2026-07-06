import { getItem, setItem } from './tokenStorage'

const DEVICE_ID_KEY = 'dispositivo_id'

export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await getItem(DEVICE_ID_KEY)
  if (existing) return existing
  const id = `mobile-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  await setItem(DEVICE_ID_KEY, id)
  return id
}
