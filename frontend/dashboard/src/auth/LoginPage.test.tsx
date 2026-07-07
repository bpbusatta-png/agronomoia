import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axios from 'axios'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from './AuthContext'
import { LoginPage } from './LoginPage'

// axios.create() roda no import de lib/api.ts -- o mock precisa devolver uma
// instancia com interceptors utilizaveis para o modulo nao quebrar ao carregar.
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

function renderLoginPage() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<div>Home autenticada</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('submits credentials and navigates to / on success', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { access_token: 'abc123', refresh_token: 'refresh456' },
    })
    const user = userEvent.setup()
    renderLoginPage()

    await user.type(document.querySelector('input[type="email"]')!, 'admin@agronomo.ia')
    await user.type(document.querySelector('input[type="password"]')!, 'senha123')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    await waitFor(() => expect(screen.getByText('Home autenticada')).toBeInTheDocument())
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('/auth/login'),
      expect.any(URLSearchParams),
      expect.objectContaining({ headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }),
    )
  })

  it('shows an error message and stays on the page when login fails', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error('401'))
    const user = userEvent.setup()
    renderLoginPage()

    await user.type(document.querySelector('input[type="email"]')!, 'admin@agronomo.ia')
    await user.type(document.querySelector('input[type="password"]')!, 'senha-errada')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('E-mail ou senha inválidos')).toBeInTheDocument()
    expect(screen.queryByText('Home autenticada')).not.toBeInTheDocument()
  })
})
