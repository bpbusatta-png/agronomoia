import { renderHook, waitFor, act } from '@testing-library/react-native'
import axios from 'axios'
import { AuthProvider, useAuth } from './AuthContext'
import { setTokens } from '../lib/api'

describe('AuthContext (mobile)', () => {
  let axiosPostSpy: jest.SpyInstance

  beforeEach(() => {
    localStorage.clear()
    axiosPostSpy = jest.spyOn(axios, 'post')
  })

  afterEach(() => {
    axiosPostSpy.mockRestore()
  })

  it('assenta em loading=false, isAuthenticated=false quando nao ha token salvo', async () => {
    const { result } = await renderHook(() => useAuth(), { wrapper: AuthProvider })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('comeca autenticado quando ja existe um access_token salvo', async () => {
    await setTokens('token-existente', 'refresh-existente')
    const { result } = await renderHook(() => useAuth(), { wrapper: AuthProvider })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('login salva os tokens e autentica', async () => {
    axiosPostSpy.mockResolvedValue({ data: { access_token: 'abc123', refresh_token: 'refresh456' } })
    const { result } = await renderHook(() => useAuth(), { wrapper: AuthProvider })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.login('admin@agronomo.ia', 'senha123')
    })

    expect(result.current.isAuthenticated).toBe(true)
  })

  it('login salva o email e expoe em userEmail', async () => {
    axiosPostSpy.mockResolvedValue({ data: { access_token: 'abc123', refresh_token: 'refresh456' } })
    const { result } = await renderHook(() => useAuth(), { wrapper: AuthProvider })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.login('admin@agronomo.ia', 'senha123')
    })

    expect(result.current.userEmail).toBe('admin@agronomo.ia')
  })

  it('restaura o userEmail salvo ao montar', async () => {
    await setTokens('token-existente', 'refresh-existente')
    localStorage.setItem('user_email', 'campo@agronomo.ia')
    const { result } = await renderHook(() => useAuth(), { wrapper: AuthProvider })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.userEmail).toBe('campo@agronomo.ia')
  })

  it('login com credenciais invalidas rejeita e nao autentica', async () => {
    axiosPostSpy.mockRejectedValue(new Error('401'))
    const { result } = await renderHook(() => useAuth(), { wrapper: AuthProvider })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await expect(
      act(async () => {
        await result.current.login('admin@agronomo.ia', 'senha-errada')
      }),
    ).rejects.toThrow()

    expect(result.current.isAuthenticated).toBe(false)
  })

  it('logout limpa os tokens e desautentica', async () => {
    await setTokens('token-existente', 'refresh-existente')
    const { result } = await renderHook(() => useAuth(), { wrapper: AuthProvider })
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true))

    await act(async () => {
      await result.current.logout()
    })

    expect(result.current.isAuthenticated).toBe(false)
  })

  it('logout tambem limpa o email salvo', async () => {
    axiosPostSpy.mockResolvedValue({ data: { access_token: 'abc123', refresh_token: 'refresh456' } })
    const { result } = await renderHook(() => useAuth(), { wrapper: AuthProvider })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.login('admin@agronomo.ia', 'senha123')
    })
    expect(result.current.userEmail).toBe('admin@agronomo.ia')

    await act(async () => {
      await result.current.logout()
    })

    expect(result.current.userEmail).toBeNull()
  })
})
