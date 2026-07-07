import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HomePage } from './HomePage'

vi.mock('../lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))
import { api } from '../lib/api'
const mockedGet = vi.mocked(api.get)

const talhao = { id: 't1', codigo: 'T-01' }

function mockEndpoint(overrides: Record<string, unknown[]> = {}) {
  const data: Record<string, unknown[]> = {
    '/cooperados': [{ id: 'c1' }],
    '/talhoes': [talhao],
    '/ocorrencias-pragas': [],
    '/ocorrencias-doencas': [],
    '/ocorrencias-plantas-daninhas': [],
    '/plantas-atipicas': [],
    ...overrides,
  }
  mockedGet.mockImplementation((url: string) => Promise.resolve({ data: data[url] ?? [] }))
}

function renderHomePage() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  )
}

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('mostra as contagens agregadas nos cards de estatistica', async () => {
    mockEndpoint({
      '/ocorrencias-pragas': [{ id: 'p1', talhao_id: 't1', data: '2026-07-01' }],
      '/plantas-atipicas': [{ id: 'a1', talhao_id: 't1', data: '2026-07-02', status: 'pendente_validacao' }],
    })
    renderHomePage()

    expect(await screen.findByText('4 registros no total')).toBeInTheDocument()
    expect(screen.getAllByText('Cooperados')[0].previousSibling).toHaveTextContent('1')
    expect(screen.getAllByText('Talhões')[0].previousSibling).toHaveTextContent('1')
    expect(screen.getAllByText('Ocorrências')[0].previousSibling).toHaveTextContent('2')
    expect(screen.getAllByText('Validações pendentes')[0].previousSibling).toHaveTextContent('1')
  })

  it('resolve o codigo do talhao e mostra o status nos ultimos registros', async () => {
    mockEndpoint({
      '/ocorrencias-pragas': [{ id: 'p1', talhao_id: 't1', data: '2026-07-01' }],
      '/plantas-atipicas': [{ id: 'a1', talhao_id: 't1', data: '2026-07-05', status: 'pendente_validacao' }],
    })
    renderHomePage()

    expect(await screen.findByText('Planta atípica')).toBeInTheDocument()
    expect(screen.getByText('Pendente')).toBeInTheDocument()
    expect(screen.getAllByText('T-01')).toHaveLength(2)
    expect(screen.getByText('Praga')).toBeInTheDocument()
    expect(screen.getByText('Registrado')).toBeInTheDocument()
  })

  it('mostra mensagem vazia quando nao ha ocorrencias', async () => {
    mockEndpoint()
    renderHomePage()

    expect(await screen.findByText('Nenhum registro ainda')).toBeInTheDocument()
  })

  it('mostra mensagem de erro quando o carregamento falha', async () => {
    mockedGet.mockRejectedValue(new Error('falha de rede'))
    renderHomePage()

    expect(await screen.findByText('Erro ao carregar o dashboard')).toBeInTheDocument()
  })

  it('inclui o atalho de Reconhecimento IA como acao rapida', async () => {
    mockEndpoint()
    renderHomePage()

    const link = await screen.findByRole('link', { name: /reconhecimento ia/i })
    expect(link).toHaveAttribute('href', '/reconhecimento')
  })
})
