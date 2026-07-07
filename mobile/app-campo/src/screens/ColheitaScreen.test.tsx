import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import { upsertCache, upsertTalhoes } from '../lib/db'
import { ColheitaScreen } from './ColheitaScreen'

jest.mock('../lib/api', () => ({ api: { post: jest.fn() } }))
import { api } from '../lib/api'
const mockedPost = api.post as jest.Mock

describe('ColheitaScreen', () => {
  beforeEach(async () => {
    localStorage.clear()
    mockedPost.mockReset()
    await upsertTalhoes([{ id: 't1', codigo: 'T-01', fazenda_nome: 'Fazenda Teste', cultivar_nome: null, safra_nome: null, area_ha: null }])
    await upsertCache('safras', [{ id: 's1', nome: 'Safra 2025/2026' }])
  })

  it('mostra erro se tentar salvar sem selecionar talhao', async () => {
    await render(<ColheitaScreen />)
    await fireEvent.press(await screen.findByTestId('salvar-colheita-button'))

    expect(await screen.findByText('Selecione um talhão')).toBeTruthy()
    expect(mockedPost).not.toHaveBeenCalled()
  })

  it('cria e sincroniza um registro de colheita', async () => {
    mockedPost.mockResolvedValue({ data: { id: 'remote-1' } })
    await render(<ColheitaScreen />)

    await fireEvent.press(await screen.findByTestId('talhao-select-colheita'))
    await fireEvent.press(await screen.findByText('T-01 — Fazenda Teste'))

    await fireEvent.press(screen.getByTestId('safra-select-colheita'))
    await fireEvent.press(await screen.findByText('Safra 2025/2026'))

    await fireEvent.changeText(screen.getByTestId('quantidade-kg-input'), '4200')
    await fireEvent.press(screen.getByTestId('salvar-colheita-button'))

    await waitFor(() =>
      expect(mockedPost).toHaveBeenCalledWith(
        '/colheita',
        expect.objectContaining({ talhao_id: 't1', safra_id: 's1', quantidade_kg: 4200 }),
      ),
    )
    expect(await screen.findByText('1 sincronizada(s)')).toBeTruthy()
  })
})
