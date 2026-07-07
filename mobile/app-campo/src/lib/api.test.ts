import MockAdapter from 'axios-mock-adapter'
import axios from 'axios'
import { api, clearTokens, getAccessToken, setTokens } from './api'

describe('api.ts', () => {
  let mock: MockAdapter
  let axiosPostSpy: jest.SpyInstance

  beforeEach(async () => {
    localStorage.clear()
    mock = new MockAdapter(api)
    axiosPostSpy = jest.spyOn(axios, 'post')
  })

  afterEach(() => {
    mock.restore()
    axiosPostSpy.mockRestore()
  })

  it('injeta o access_token no header Authorization quando presente', async () => {
    await setTokens('token-valido', 'refresh-valido')
    mock.onGet('/talhoes').reply((config) => {
      expect(config.headers?.Authorization).toBe('Bearer token-valido')
      return [200, []]
    })

    const { status } = await api.get('/talhoes')
    expect(status).toBe(200)
  })

  it('nao adiciona Authorization quando nao ha token', async () => {
    mock.onGet('/talhoes').reply((config) => {
      expect(config.headers?.Authorization).toBeUndefined()
      return [200, []]
    })

    await api.get('/talhoes')
  })

  it('em um 401, tenta renovar via refresh_token e repete a requisicao original', async () => {
    await setTokens('token-expirado', 'refresh-valido')

    let tentativa = 0
    mock.onGet('/talhoes').reply(() => {
      tentativa += 1
      if (tentativa === 1) return [401]
      return [200, [{ id: 't1' }]]
    })
    axiosPostSpy.mockResolvedValue({ data: { access_token: 'token-novo', refresh_token: 'refresh-novo' } })

    const { status, data } = await api.get('/talhoes')

    expect(status).toBe(200)
    expect(data).toEqual([{ id: 't1' }])
    expect(await getAccessToken()).toBe('token-novo')
    expect(tentativa).toBe(2)
  })

  it('limpa os tokens quando o refresh tambem falha', async () => {
    await setTokens('token-expirado', 'refresh-invalido')
    mock.onGet('/talhoes').reply(401)
    axiosPostSpy.mockRejectedValue(new Error('refresh token invalido'))

    await expect(api.get('/talhoes')).rejects.toBeDefined()
    expect(await getAccessToken()).toBeNull()
  })

  it('clearTokens remove access_token e refresh_token', async () => {
    await setTokens('a', 'b')
    await clearTokens()
    expect(await getAccessToken()).toBeNull()
  })
})
