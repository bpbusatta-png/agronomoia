import {
  addFotografiaLocal,
  addInspecaoLocal,
  addToQueue,
  listInspecoesLocais,
  updateInspecaoLocalStatus,
  updateQueueStatus,
} from './db'

jest.mock('./api', () => ({ api: { post: jest.fn() } }))
import { api } from './api'
import {
  syncPendingColheita,
  syncPendingFotografias,
  syncPendingInspecoes,
  syncPendingOcorrenciasPragas,
} from './sync'

const mockedPost = api.post as jest.Mock

describe('sync.ts', () => {
  beforeEach(() => {
    localStorage.clear()
    mockedPost.mockReset()
  })

  describe('syncPendingInspecoes (fila dedicada, nao generica)', () => {
    it('reenvia itens com status erro, nao so pendente (bug real corrigido nesta sessao)', async () => {
      const item = await addInspecaoLocal({
        talhao_id: 't1',
        talhao_codigo: 'T-01',
        data: '2026-01-01',
        estadio_fenologico: null,
        observacoes: null,
      })
      await updateInspecaoLocalStatus(item.id, 'erro', undefined, 'falha anterior')

      mockedPost.mockImplementation((url: string) => {
        if (url === '/inspecoes') return Promise.resolve({ data: { id: 'remote-1' } })
        return Promise.resolve({ data: {} })
      })

      const result = await syncPendingInspecoes()

      expect(result).toEqual({ synced: 1, failed: 0 })
      expect(mockedPost).toHaveBeenCalledWith('/inspecoes', expect.objectContaining({ talhao_id: 't1' }))
      expect(mockedPost).toHaveBeenCalledWith('/sincronizacao-log', expect.objectContaining({ entidade_id: 'remote-1' }))
    })

    it('nao reenvia itens ja sincronizados', async () => {
      const item = await addInspecaoLocal({
        talhao_id: 't1',
        talhao_codigo: 'T-01',
        data: '2026-01-01',
        estadio_fenologico: null,
        observacoes: null,
      })
      await updateInspecaoLocalStatus(item.id, 'sincronizado', 'remote-1')

      const result = await syncPendingInspecoes()

      expect(result).toEqual({ synced: 0, failed: 0 })
      expect(mockedPost).not.toHaveBeenCalled()
    })

    it('marca como erro (sem lancar excecao) quando a sincronizacao falha', async () => {
      await addInspecaoLocal({ talhao_id: 't1', talhao_codigo: 'T-01', data: '2026-01-01', estadio_fenologico: null, observacoes: null })
      mockedPost.mockRejectedValue(new Error('rede fora do ar'))

      const result = await syncPendingInspecoes()

      expect(result).toEqual({ synced: 0, failed: 1 })
      const [item] = await listInspecoesLocais()
      expect(item.status).toBe('erro')
    })
  })

  describe('syncQueue generico (via syncPendingColheita e syncPendingOcorrenciasPragas)', () => {
    it('reenvia itens pendente e erro, ignora sincronizado', async () => {
      const pendente = await addToQueue('colheita', {
        talhao_id: 't1',
        talhao_codigo: 'T-01',
        safra_id: null,
        safra_nome: null,
        quantidade_kg: '100',
        umidade_colheita: null,
        qualidade_semente: null,
        data: '2026-01-01',
      })
      const comErro = await addToQueue('colheita', {
        talhao_id: 't2',
        talhao_codigo: 'T-02',
        safra_id: null,
        safra_nome: null,
        quantidade_kg: '200',
        umidade_colheita: null,
        qualidade_semente: null,
        data: '2026-01-01',
      })
      const jaSincronizado = await addToQueue('colheita', {
        talhao_id: 't3',
        talhao_codigo: 'T-03',
        safra_id: null,
        safra_nome: null,
        quantidade_kg: '300',
        umidade_colheita: null,
        qualidade_semente: null,
        data: '2026-01-01',
      })
      await updateQueueStatus('colheita', comErro.id, 'erro', undefined, 'falha anterior')
      await updateQueueStatus('colheita', jaSincronizado.id, 'sincronizado', 'remote-ja')

      mockedPost.mockImplementation((url: string) => {
        if (url === '/colheita') return Promise.resolve({ data: { id: `remote-${Math.random()}` } })
        return Promise.resolve({ data: {} })
      })

      const result = await syncPendingColheita()

      expect(result).toEqual({ synced: 2, failed: 0 })
      const colheitaCalls = mockedPost.mock.calls.filter(([url]) => url === '/colheita')
      expect(colheitaCalls).toHaveLength(2)
      expect(pendente.id).not.toBe(jaSincronizado.id) // sanity: itens distintos
    })

    it('converte campos numericos em texto para numero no payload', async () => {
      await addToQueue('colheita', {
        talhao_id: 't1',
        talhao_codigo: 'T-01',
        safra_id: null,
        safra_nome: null,
        quantidade_kg: '4200',
        umidade_colheita: '13.5',
        qualidade_semente: 'Boa',
        data: '2026-01-01',
      })
      mockedPost.mockResolvedValue({ data: { id: 'remote-1' } })

      await syncPendingColheita()

      expect(mockedPost).toHaveBeenCalledWith(
        '/colheita',
        expect.objectContaining({ quantidade_kg: 4200, umidade_colheita: 13.5, qualidade_semente: 'Boa' }),
      )
    })

    it('registra sincronizacao-log com a entidade_referenciada correta por endpoint', async () => {
      await addToQueue('ocorrencias_pragas', {
        talhao_id: 't1',
        talhao_codigo: 'T-01',
        praga_id: 'p1',
        praga_nome: 'Lagarta',
        estadio: null,
        populacao_estimada: null,
        nivel_dano: null,
        nivel_controle: null,
        data: '2026-01-01',
      })
      mockedPost.mockResolvedValue({ data: { id: 'remote-praga-1' } })

      await syncPendingOcorrenciasPragas()

      expect(mockedPost).toHaveBeenCalledWith(
        '/sincronizacao-log',
        expect.objectContaining({ entidade_referenciada: 'ocorrencias_pragas', entidade_id: 'remote-praga-1' }),
      )
    })
  })

  describe('syncPendingFotografias (upload + criacao em dois passos)', () => {
    const originalFetch = globalThis.fetch

    beforeEach(() => {
      globalThis.fetch = jest.fn().mockResolvedValue({ blob: async () => new Blob(['fake']) }) as unknown as typeof fetch
    })

    afterEach(() => {
      globalThis.fetch = originalFetch
    })

    it('sobe o arquivo antes de criar o registro de fotografia', async () => {
      await addFotografiaLocal({ talhao_id: 't1', talhao_codigo: 'T-01', inspecao_id: null, tipo: 'praga', local_uri: 'blob:fake-uri' })

      mockedPost.mockImplementation((url: string) => {
        if (url === '/uploads') return Promise.resolve({ data: { url: 'http://storage/foto.jpg' } })
        if (url === '/fotografias') return Promise.resolve({ data: { id: 'remote-foto-1' } })
        return Promise.resolve({ data: {} })
      })

      const result = await syncPendingFotografias()

      expect(result).toEqual({ synced: 1, failed: 0 })
      expect(mockedPost).toHaveBeenNthCalledWith(1, '/uploads', expect.any(FormData), expect.any(Object))
      expect(mockedPost).toHaveBeenNthCalledWith(
        2,
        '/fotografias',
        expect.objectContaining({ talhao_id: 't1', url_arquivo: 'http://storage/foto.jpg' }),
      )
    })
  })
})
