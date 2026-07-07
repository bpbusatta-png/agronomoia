import { deleteItem, getItem, setItem } from './tokenStorage'

describe('tokenStorage (Platform.OS=web -> localStorage)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns null for a key that was never set', async () => {
    expect(await getItem('access_token')).toBeNull()
  })

  it('stores and retrieves a value', async () => {
    await setItem('access_token', 'abc123')
    expect(await getItem('access_token')).toBe('abc123')
  })

  it('deletes a value', async () => {
    await setItem('access_token', 'abc123')
    await deleteItem('access_token')
    expect(await getItem('access_token')).toBeNull()
  })

  it('keeps keys independent', async () => {
    await setItem('access_token', 'abc123')
    await setItem('refresh_token', 'xyz789')
    expect(await getItem('access_token')).toBe('abc123')
    expect(await getItem('refresh_token')).toBe('xyz789')
  })
})
