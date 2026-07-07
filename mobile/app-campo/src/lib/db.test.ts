import {
  addFotografiaLocal,
  addInspecaoLocal,
  addToQueue,
  getCache,
  getTalhoes,
  listFotografiasLocais,
  listInspecoesLocais,
  listQueue,
  updateFotografiaLocalStatus,
  updateInspecaoLocalStatus,
  updateQueueStatus,
  upsertCache,
  upsertTalhoes,
} from './db'

describe('db.ts (Platform.OS=web -> localStorage)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('talhoes cache (somente-leitura)', () => {
    it('starts empty', async () => {
      expect(await getTalhoes()).toEqual([])
    })

    it('upsert overwrites the whole cache', async () => {
      await upsertTalhoes([{ id: 't1', codigo: 'T-01', fazenda_nome: 'F1', cultivar_nome: null, safra_nome: null, area_ha: null }])
      expect(await getTalhoes()).toHaveLength(1)

      await upsertTalhoes([{ id: 't2', codigo: 'T-02', fazenda_nome: 'F2', cultivar_nome: null, safra_nome: null, area_ha: null }])
      const result = await getTalhoes()
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('t2')
    })
  })

  describe('inspecoes locais (fila especifica)', () => {
    it('adiciona e lista, mais recente primeiro', async () => {
      await addInspecaoLocal({ talhao_id: 't1', talhao_codigo: 'T-01', data: '2026-01-01', estadio_fenologico: null, observacoes: null })
      await addInspecaoLocal({ talhao_id: 't2', talhao_codigo: 'T-02', data: '2026-01-02', estadio_fenologico: null, observacoes: null })

      const items = await listInspecoesLocais()
      expect(items).toHaveLength(2)
      expect(items[0].talhao_codigo).toBe('T-02')
      expect(items.every((i) => i.status === 'pendente')).toBe(true)
    })

    it('atualiza o status apos sincronizar', async () => {
      const item = await addInspecaoLocal({ talhao_id: 't1', talhao_codigo: 'T-01', data: '2026-01-01', estadio_fenologico: null, observacoes: null })
      await updateInspecaoLocalStatus(item.id, 'sincronizado', 'remote-1')

      const [updated] = await listInspecoesLocais()
      expect(updated.status).toBe('sincronizado')
      expect(updated.remote_id).toBe('remote-1')
    })

    it('registra erro com mensagem', async () => {
      const item = await addInspecaoLocal({ talhao_id: 't1', talhao_codigo: 'T-01', data: '2026-01-01', estadio_fenologico: null, observacoes: null })
      await updateInspecaoLocalStatus(item.id, 'erro', undefined, 'falha de rede')

      const [updated] = await listInspecoesLocais()
      expect(updated.status).toBe('erro')
      expect(updated.erro_mensagem).toBe('falha de rede')
    })
  })

  describe('fotografias locais (fila especifica)', () => {
    it('adiciona e lista', async () => {
      await addFotografiaLocal({ talhao_id: 't1', talhao_codigo: 'T-01', inspecao_id: null, tipo: 'praga', local_uri: 'file://foto.jpg' })
      const items = await listFotografiasLocais()
      expect(items).toHaveLength(1)
      expect(items[0].local_uri).toBe('file://foto.jpg')
      expect(items[0].status).toBe('pendente')
    })

    it('atualiza o status', async () => {
      const item = await addFotografiaLocal({ talhao_id: 't1', talhao_codigo: 'T-01', inspecao_id: null, tipo: null, local_uri: 'file://foto.jpg' })
      await updateFotografiaLocalStatus(item.id, 'sincronizado', 'remote-9')
      const [updated] = await listFotografiasLocais()
      expect(updated.status).toBe('sincronizado')
      expect(updated.remote_id).toBe('remote-9')
    })
  })

  describe('reference_cache generico (upsertCache/getCache)', () => {
    it('isola por cache_key', async () => {
      await upsertCache('pragas_catalogo', [{ id: 'p1', nome_comum: 'Lagarta' }])
      await upsertCache('doencas_catalogo', [{ id: 'd1', nome: 'Ferrugem' }])

      expect(await getCache('pragas_catalogo')).toEqual([{ id: 'p1', nome_comum: 'Lagarta' }])
      expect(await getCache('doencas_catalogo')).toEqual([{ id: 'd1', nome: 'Ferrugem' }])
    })

    it('retorna vazio para uma chave nunca usada', async () => {
      expect(await getCache('nunca_usada')).toEqual([])
    })

    it('upsert substitui o conteudo anterior da mesma chave', async () => {
      await upsertCache('pragas_catalogo', [{ id: 'p1', nome_comum: 'Lagarta' }])
      await upsertCache('pragas_catalogo', [{ id: 'p2', nome_comum: 'Percevejo' }])
      expect(await getCache('pragas_catalogo')).toEqual([{ id: 'p2', nome_comum: 'Percevejo' }])
    })
  })

  describe('local_queue generico (addToQueue/listQueue/updateQueueStatus)', () => {
    it('isola por queue_key', async () => {
      await addToQueue('aplicacoes', { produto: 'X' })
      await addToQueue('colheita', { quantidade_kg: 100 })

      const aplicacoes = await listQueue('aplicacoes')
      const colheita = await listQueue('colheita')
      expect(aplicacoes).toHaveLength(1)
      expect(colheita).toHaveLength(1)
      expect(aplicacoes[0].payload).toEqual({ produto: 'X' })
    })

    it('nasce com status pendente e sem remote_id', async () => {
      const item = await addToQueue('colheita', { quantidade_kg: 100 })
      expect(item.status).toBe('pendente')
      expect(item.remote_id).toBeNull()
    })

    it('lista mais recente primeiro', async () => {
      await addToQueue('colheita', { quantidade_kg: 1 })
      await addToQueue('colheita', { quantidade_kg: 2 })
      const items = await listQueue<{ quantidade_kg: number }>('colheita')
      expect(items[0].payload.quantidade_kg).toBe(2)
    })

    it('atualiza status para sincronizado com remote_id', async () => {
      const item = await addToQueue('colheita', { quantidade_kg: 100 })
      await updateQueueStatus('colheita', item.id, 'sincronizado', 'remote-42')

      const [updated] = await listQueue('colheita')
      expect(updated.status).toBe('sincronizado')
      expect(updated.remote_id).toBe('remote-42')
    })

    it('atualiza status para erro com mensagem, preservando o payload', async () => {
      const item = await addToQueue('colheita', { quantidade_kg: 100 })
      await updateQueueStatus('colheita', item.id, 'erro', undefined, 'falha de rede')

      const [updated] = await listQueue<{ quantidade_kg: number }>('colheita')
      expect(updated.status).toBe('erro')
      expect(updated.erro_mensagem).toBe('falha de rede')
      expect(updated.payload).toEqual({ quantidade_kg: 100 })
    })
  })
})
