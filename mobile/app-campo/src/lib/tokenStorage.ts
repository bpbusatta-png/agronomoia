import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

// expo-secure-store usa keychain/keystore nativo em iOS/Android. A build web
// deste pacote (SDK 57) nao implementa getValueWithKeyAsync corretamente
// neste ambiente -- usada aqui apenas para testar em navegador (sem
// emulador disponivel), entao cai para localStorage sem criptografia.
// Em dispositivo real, o SecureStore nativo e usado normalmente.

export async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return typeof window === 'undefined' ? null : window.localStorage.getItem(key)
  }
  return SecureStore.getItemAsync(key)
}

export async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.localStorage.setItem(key, value)
    return
  }
  await SecureStore.setItemAsync(key, value)
}

export async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.localStorage.removeItem(key)
    return
  }
  await SecureStore.deleteItemAsync(key)
}
