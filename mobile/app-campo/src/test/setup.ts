import { Platform } from 'react-native'

// Forca o mesmo caminho de codigo ja validado nesta sessao via Expo web
// (localStorage em vez de SecureStore/SQLite nativos) -- evita ter que mockar
// modulos nativos (expo-secure-store, expo-sqlite) so para rodar a suite.
Object.defineProperty(Platform, 'OS', { get: () => 'web', configurable: true })

// O ambiente de teste do jest-expo (react-native-env.js) nao inclui
// localStorage por padrao -- polyfill simples em memoria, suficiente para
// os testes (nao precisa persistir entre execucoes do processo).
class MemoryLocalStorage {
  private store = new Map<string, string>()
  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value)
  }
  removeItem(key: string): void {
    this.store.delete(key)
  }
  clear(): void {
    this.store.clear()
  }
}

if (typeof (globalThis as { localStorage?: unknown }).localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: new MemoryLocalStorage(),
    configurable: true,
  })
}
