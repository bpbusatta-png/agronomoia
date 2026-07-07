import { act, renderHook, waitFor } from '@testing-library/react'
import axios from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider, useAuth } from './AuthContext'

// axios.create() roda no import de lib/api.ts (mesmo so precisando de API_URL
// aqui) -- o mock precisa devolver uma instancia com interceptors utilizaveis
// para o modulo nao quebrar ao carregar.
vi.mock('axios', () => {
  const instance = {
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  }
  return { default: { create: vi.fn(() => instance), post: vi.fn(), get: vi.fn() } }
})
const mockedAxios = vi.mocked(axios)

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('starts unauthenticated when there is no stored token', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('starts authenticated when a token is already in localStorage', () => {
    localStorage.setItem('access_token', 'token-existente')
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('login stores tokens and flips isAuthenticated to true', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { access_token: 'abc123', refresh_token: 'refresh456' },
    })

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })

    await act(async () => {
      await result.current.login('admin@agronomo.ia', 'senha123')
    })

    expect(localStorage.getItem('access_token')).toBe('abc123')
    expect(localStorage.getItem('refresh_token')).toBe('refresh456')
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true))
  })

  it('login failure rejects and does not authenticate', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error('credenciais invalidas'))

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })

    await expect(
      act(async () => {
        await result.current.login('admin@agronomo.ia', 'senha-errada')
      }),
    ).rejects.toThrow()

    expect(result.current.isAuthenticated).toBe(false)
    expect(localStorage.getItem('access_token')).toBeNull()
  })

  it('logout clears tokens and flips isAuthenticated to false', () => {
    localStorage.setItem('access_token', 'abc123')
    localStorage.setItem('refresh_token', 'refresh456')

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    expect(result.current.isAuthenticated).toBe(true)

    act(() => {
      result.current.logout()
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(localStorage.getItem('access_token')).toBeNull()
    expect(localStorage.getItem('refresh_token')).toBeNull()
  })
})
