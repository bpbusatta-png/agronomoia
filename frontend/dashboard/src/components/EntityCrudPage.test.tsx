import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { EntityConfig } from '../entities/types'
import { EntityCrudPage } from './EntityCrudPage'

vi.mock('../lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))
import { api } from '../lib/api'
const mockedApi = vi.mocked(api, true)

// Os <label> deste componente nao tem htmlFor/id ligando ao input -- acha o
// controle (input/select/textarea) irmao do label pelo texto, em vez de
// getByLabelText (que exigiria essa associacao). Escopado ao <form> porque o
// nome de um campo pode coincidir com o de uma coluna da tabela por tras dele.
function getFieldControl(labelText: string): HTMLElement {
  const form = document.querySelector('form') as HTMLElement
  const label = within(form).getByText(labelText)
  const wrapper = label.parentElement as HTMLElement
  const control = wrapper.querySelector('input, select, textarea')
  if (!control) throw new Error(`campo nao encontrado para label "${labelText}"`)
  return control as HTMLElement
}

const categoriasConfig: EntityConfig = {
  key: 'categorias',
  title: 'Categorias',
  endpoint: '/categorias',
  columns: [{ name: 'nome', label: 'Nome' }],
  fields: [{ name: 'nome', label: 'Nome', type: 'text', required: true }],
}

const itensConfig: EntityConfig = {
  key: 'itens',
  title: 'Itens',
  endpoint: '/itens',
  columns: [
    { name: 'nome', label: 'Nome' },
    { name: 'categoria_id', label: 'Categoria' },
    { name: 'ativo', label: 'Ativo' },
  ],
  fields: [
    { name: 'nome', label: 'Nome', type: 'text', required: true },
    { name: 'categoria_id', label: 'Categoria', type: 'select', optionsFrom: 'categorias' },
    { name: 'ativo', label: 'Ativo', type: 'boolean' },
    { name: 'metadados', label: 'Metadados', type: 'json' },
  ],
  refs: ['categorias'],
}

const refConfigs = { categorias: categoriasConfig }

const itensFixture = [
  { id: 'item-1', nome: 'Item Um', categoria_id: 'cat-1', ativo: true, metadados: null },
  { id: 'item-2', nome: 'Item Dois', categoria_id: null, ativo: false, metadados: null },
]

const categoriasFixture = [{ id: 'cat-1', nome: 'Categoria A' }]

function mockDefaultGets() {
  mockedApi.get.mockImplementation((url: string) => {
    if (url === '/itens') return Promise.resolve({ data: itensFixture })
    if (url === '/categorias') return Promise.resolve({ data: categoriasFixture })
    return Promise.resolve({ data: [] })
  })
}

describe('EntityCrudPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lista os itens carregados, resolvendo o select a partir do ref', async () => {
    mockDefaultGets()
    render(<EntityCrudPage config={itensConfig} refConfigs={refConfigs} />)

    expect(await screen.findByText('Item Um')).toBeInTheDocument()
    expect(screen.getByText('Item Dois')).toBeInTheDocument()
    // categoria_id nulo -> exibe travessao
    const row2 = screen.getByText('Item Dois').closest('tr') as HTMLElement
    expect(within(row2).getByText('—')).toBeInTheDocument()
  })

  it('mostra mensagem de vazio quando nao ha registros', async () => {
    mockedApi.get.mockResolvedValue({ data: [] })
    render(<EntityCrudPage config={itensConfig} refConfigs={refConfigs} />)

    expect(await screen.findByText('Nenhum registro ainda')).toBeInTheDocument()
  })

  it('mostra mensagem de erro quando o carregamento falha', async () => {
    // so a lista principal falha -- loadRefs() nao tem try/catch, entao deixar
    // '/categorias' resolver normalmente evita uma rejeicao nao tratada aqui.
    mockedApi.get.mockImplementation((url: string) => {
      if (url === '/itens') return Promise.reject(new Error('falha de rede'))
      return Promise.resolve({ data: [] })
    })
    render(<EntityCrudPage config={itensConfig} refConfigs={refConfigs} />)

    expect(await screen.findByText('Erro ao carregar dados')).toBeInTheDocument()
  })

  it('cria um novo registro com os valores do formulario', async () => {
    mockDefaultGets()
    mockedApi.post.mockResolvedValue({ data: { id: 'item-3' } })
    const user = userEvent.setup()
    render(<EntityCrudPage config={itensConfig} refConfigs={refConfigs} />)
    await screen.findByText('Item Um')

    await user.click(screen.getByRole('button', { name: '+ Novo' }))
    await user.type(getFieldControl('Nome'), 'Item Novo')
    await user.selectOptions(getFieldControl('Categoria'), 'cat-1')
    await user.click(getFieldControl('Ativo'))
    await user.type(getFieldControl('Metadados'), '{{"cor": "verde"}')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() =>
      expect(mockedApi.post).toHaveBeenCalledWith('/itens', {
        nome: 'Item Novo',
        categoria_id: 'cat-1',
        ativo: true,
        metadados: { cor: 'verde' },
      }),
    )
    // fecha o formulario e recarrega a lista
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Salvar' })).not.toBeInTheDocument())
    expect(mockedApi.get).toHaveBeenCalledWith('/itens')
  })

  it('bloqueia o envio e avisa quando o JSON e invalido', async () => {
    mockDefaultGets()
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    const user = userEvent.setup()
    render(<EntityCrudPage config={itensConfig} refConfigs={refConfigs} />)
    await screen.findByText('Item Um')

    await user.click(screen.getByRole('button', { name: '+ Novo' }))
    await user.type(getFieldControl('Nome'), 'Item Invalido')
    await user.type(getFieldControl('Metadados'), '{{nao-e-json valido')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Metadados'))
    expect(mockedApi.post).not.toHaveBeenCalled()
  })

  it('abre o formulario de edicao pre-preenchido e envia PUT', async () => {
    mockDefaultGets()
    mockedApi.put.mockResolvedValue({ data: {} })
    const user = userEvent.setup()
    render(<EntityCrudPage config={itensConfig} refConfigs={refConfigs} />)
    await screen.findByText('Item Um')

    const row1 = screen.getByText('Item Um').closest('tr') as HTMLElement
    await user.click(within(row1).getByRole('button', { name: 'Editar' }))

    expect((getFieldControl('Nome') as HTMLInputElement).value).toBe('Item Um')
    expect((getFieldControl('Categoria') as HTMLSelectElement).value).toBe('cat-1')

    await user.clear(getFieldControl('Nome'))
    await user.type(getFieldControl('Nome'), 'Item Um Editado')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() =>
      expect(mockedApi.put).toHaveBeenCalledWith(
        '/itens/item-1',
        expect.objectContaining({ nome: 'Item Um Editado', categoria_id: 'cat-1' }),
      ),
    )
  })

  it('exclui um registro apos confirmacao e recarrega a lista', async () => {
    mockDefaultGets()
    mockedApi.delete.mockResolvedValue({ data: {} })
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()
    render(<EntityCrudPage config={itensConfig} refConfigs={refConfigs} />)
    await screen.findByText('Item Um')

    const row1 = screen.getByText('Item Um').closest('tr') as HTMLElement
    await user.click(within(row1).getByRole('button', { name: 'Excluir' }))

    await waitFor(() => expect(mockedApi.delete).toHaveBeenCalledWith('/itens/item-1'))
  })

  it('nao exclui quando o usuario cancela a confirmacao', async () => {
    mockDefaultGets()
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const user = userEvent.setup()
    render(<EntityCrudPage config={itensConfig} refConfigs={refConfigs} />)
    await screen.findByText('Item Um')

    const row1 = screen.getByText('Item Um').closest('tr') as HTMLElement
    await user.click(within(row1).getByRole('button', { name: 'Excluir' }))

    expect(mockedApi.delete).not.toHaveBeenCalled()
  })

  it('mostra o detalhe de erro retornado pelo backend ao salvar', async () => {
    mockDefaultGets()
    mockedApi.post.mockRejectedValue({ response: { data: { detail: 'campo obrigatorio ausente' } } })
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    const user = userEvent.setup()
    render(<EntityCrudPage config={itensConfig} refConfigs={refConfigs} />)
    await screen.findByText('Item Um')

    await user.click(screen.getByRole('button', { name: '+ Novo' }))
    await user.type(getFieldControl('Nome'), 'Item X')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith('campo obrigatorio ausente'))
  })

  it('renderiza a acao extra por linha (renderExtraAction)', async () => {
    mockDefaultGets()
    render(
      <EntityCrudPage
        config={itensConfig}
        refConfigs={refConfigs}
        renderExtraAction={(item) => <button>Acao para {item.nome as string}</button>}
      />,
    )

    expect(await screen.findByText('Acao para Item Um')).toBeInTheDocument()
    expect(screen.getByText('Acao para Item Dois')).toBeInTheDocument()
  })

  it('exige um arquivo antes de criar quando o campo file e obrigatorio', async () => {
    const fotoConfig: EntityConfig = {
      key: 'fotos',
      title: 'Fotos',
      endpoint: '/fotos',
      columns: [{ name: 'arquivo', label: 'Arquivo' }],
      fields: [{ name: 'arquivo', label: 'Arquivo', type: 'file', required: true }],
    }
    mockedApi.get.mockResolvedValue({ data: [] })
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    const user = userEvent.setup()
    render(<EntityCrudPage config={fotoConfig} refConfigs={{}} />)
    await screen.findByText('Nenhum registro ainda')

    await user.click(screen.getByRole('button', { name: '+ Novo' }))
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Arquivo'))
    expect(mockedApi.post).not.toHaveBeenCalled()
  })

  it('sobe o arquivo antes de criar o registro quando um arquivo e escolhido', async () => {
    const fotoConfig: EntityConfig = {
      key: 'fotos',
      title: 'Fotos',
      endpoint: '/fotos',
      columns: [{ name: 'arquivo', label: 'Arquivo' }],
      fields: [{ name: 'arquivo', label: 'Arquivo', type: 'file', required: true }],
    }
    mockedApi.get.mockResolvedValue({ data: [] })
    mockedApi.post.mockImplementation((url: string) => {
      if (url === '/uploads') return Promise.resolve({ data: { url: 'http://storage/foto.png' } })
      return Promise.resolve({ data: { id: 'foto-1' } })
    })
    const user = userEvent.setup()
    render(<EntityCrudPage config={fotoConfig} refConfigs={{}} />)
    await screen.findByText('Nenhum registro ainda')

    await user.click(screen.getByRole('button', { name: '+ Novo' }))
    const file = new File(['conteudo'], 'foto.png', { type: 'image/png' })
    const fileInput = getFieldControl('Arquivo') as HTMLInputElement
    await user.upload(fileInput, file)
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() =>
      expect(mockedApi.post).toHaveBeenNthCalledWith(1, '/uploads', expect.any(FormData), expect.any(Object)),
    )
    expect(mockedApi.post).toHaveBeenNthCalledWith(2, '/fotos', { arquivo: 'http://storage/foto.png' })
  })
})
