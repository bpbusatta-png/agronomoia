import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ReconhecimentoPage } from './ReconhecimentoPage'

vi.mock('../lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))
import { api } from '../lib/api'
const mockedApi = vi.mocked(api, true)

function renderPage() {
  return render(
    <MemoryRouter>
      <ReconhecimentoPage />
    </MemoryRouter>,
  )
}

function selectFakeFile() {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement
  const file = new File(['dados-fake'], 'praga.jpg', { type: 'image/jpeg' })
  return { input, file }
}

describe('ReconhecimentoPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('mantem o botao desabilitado ate uma foto ser escolhida', () => {
    renderPage()
    expect(screen.getByRole('button', { name: 'Classificar' })).toBeDisabled()
  })

  it('classifica a foto e mostra a sugestao com atalho para criar a ocorrencia', async () => {
    mockedApi.post.mockResolvedValue({
      data: {
        tipo_identificado: 'praga',
        nome_sugerido: 'Lagarta-da-soja',
        confianca: 0.87,
        observacoes: 'Lesao foliar compativel com desfolha.',
        modelo_versao_id: 'modelo-1',
      },
    })
    const user = userEvent.setup()
    renderPage()

    const { input, file } = selectFakeFile()
    await user.upload(input, file)
    await user.click(screen.getByRole('button', { name: 'Classificar' }))

    const heading = await screen.findByText('Sugestão da IA')
    const painel = heading.closest('div') as HTMLElement

    expect(painel.textContent).toContain('Tipo: Praga')
    expect(painel.textContent).toContain('Nome sugerido: Lagarta-da-soja')
    expect(painel.textContent).toContain('Confiança: 87%')

    const link = screen.getByRole('link', { name: /criar ocorrência de praga/i })
    expect(link).toHaveAttribute('href', '/ocorrencias-pragas')

    expect(mockedApi.post).toHaveBeenCalledWith('/reconhecimento/classificar', expect.any(FormData), {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  })

  it('mostra mensagem especifica quando a IA nao esta configurada (503)', async () => {
    mockedApi.post.mockRejectedValue({ response: { status: 503 } })
    const user = userEvent.setup()
    renderPage()

    const { input, file } = selectFakeFile()
    await user.upload(input, file)
    await user.click(screen.getByRole('button', { name: 'Classificar' }))

    expect(
      await screen.findByText('Reconhecimento por IA não configurado neste ambiente (falta ANTHROPIC_API_KEY no backend).'),
    ).toBeInTheDocument()
  })

  it('mostra o detalhe de erro do backend quando disponivel', async () => {
    mockedApi.post.mockRejectedValue({ response: { status: 415, data: { detail: 'Tipo de arquivo não suportado' } } })
    const user = userEvent.setup()
    renderPage()

    const { input, file } = selectFakeFile()
    await user.upload(input, file)
    await user.click(screen.getByRole('button', { name: 'Classificar' }))

    expect(await screen.findByText('Tipo de arquivo não suportado')).toBeInTheDocument()
  })

  it('nao mostra atalho de criacao quando o tipo identificado e indeterminado', async () => {
    mockedApi.post.mockResolvedValue({
      data: {
        tipo_identificado: 'indeterminado',
        nome_sugerido: null,
        confianca: 0.1,
        observacoes: 'Foto sem foco no problema.',
        modelo_versao_id: 'modelo-1',
      },
    })
    const user = userEvent.setup()
    renderPage()

    const { input, file } = selectFakeFile()
    await user.upload(input, file)
    await user.click(screen.getByRole('button', { name: 'Classificar' }))

    await screen.findByText('Sugestão da IA')
    expect(screen.queryByRole('link', { name: /criar ocorrência/i })).not.toBeInTheDocument()
  })
})
