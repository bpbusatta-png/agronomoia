import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PlantasAtipicasPage } from './PlantasAtipicasPage'

vi.mock('../lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))
import { api } from '../lib/api'
const mockedApi = vi.mocked(api, true)

const ocorrenciaFixture = [
  {
    id: 'oco-1',
    talhao_id: 'talhao-1',
    caracteristica_avaliada: 'cor_flor',
    status: 'pendente_validacao',
    recomendacao: null,
  },
]

function mockDefaultGets() {
  mockedApi.get.mockImplementation((url: string) => {
    if (url === '/plantas-atipicas') return Promise.resolve({ data: ocorrenciaFixture })
    return Promise.resolve({ data: [] })
  })
}

describe('PlantasAtipicasPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('mostra o botao Validar por ocorrencia listada', async () => {
    mockDefaultGets()
    render(<PlantasAtipicasPage />)

    expect(await screen.findByText('Cor da flor')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Validar' })).toBeInTheDocument()
  })

  it('valida uma ocorrencia com decisao e justificativa e recarrega a lista', async () => {
    mockDefaultGets()
    mockedApi.post.mockResolvedValue({ data: {} })
    const user = userEvent.setup()
    render(<PlantasAtipicasPage />)
    await screen.findByText('Cor da flor')

    await user.click(screen.getByRole('button', { name: 'Validar' }))

    const dialogTitle = await screen.findByText('Validar ocorrência')
    const modal = dialogTitle.closest('form') as HTMLElement

    await user.selectOptions(within(modal).getByRole('combobox'), 'eliminar')
    await user.type(within(modal).getByRole('textbox'), 'Fora do padrão da cultivar')
    await user.click(within(modal).getByRole('button', { name: 'Confirmar validação' }))

    await waitFor(() =>
      expect(mockedApi.post).toHaveBeenCalledWith('/plantas-atipicas/oco-1/validar', {
        decisao: 'eliminar',
        justificativa: 'Fora do padrão da cultivar',
      }),
    )
    await waitFor(() => expect(screen.queryByText('Validar ocorrência')).not.toBeInTheDocument())
    // reloadKey mudou -> EntityCrudPage remonta e busca a lista de novo
    await waitFor(() => expect(mockedApi.get).toHaveBeenCalledWith('/plantas-atipicas'))
  })

  it('fecha o modal sem chamar a API quando o usuario cancela', async () => {
    mockDefaultGets()
    const user = userEvent.setup()
    render(<PlantasAtipicasPage />)
    await screen.findByText('Cor da flor')

    await user.click(screen.getByRole('button', { name: 'Validar' }))
    await screen.findByText('Validar ocorrência')

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByText('Validar ocorrência')).not.toBeInTheDocument()
    expect(mockedApi.post).not.toHaveBeenCalled()
  })

  it('mostra um alerta quando a validacao falha (ex: papel sem permissao)', async () => {
    mockDefaultGets()
    mockedApi.post.mockRejectedValue(new Error('403'))
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    const user = userEvent.setup()
    render(<PlantasAtipicasPage />)
    await screen.findByText('Cor da flor')

    await user.click(screen.getByRole('button', { name: 'Validar' }))
    await screen.findByText('Validar ocorrência')
    await user.click(screen.getByRole('button', { name: 'Confirmar validação' }))

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        'Erro ao validar. Confirme que seu usuário tem papel Administrador ou Agronomo_RT.',
      ),
    )
    // modal continua aberto para o usuario tentar de novo / cancelar
    expect(screen.getByText('Validar ocorrência')).toBeInTheDocument()
  })
})
