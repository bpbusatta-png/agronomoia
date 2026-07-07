import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}))
jest.mock('../lib/api', () => ({ api: { post: jest.fn() } }))

import * as ImagePicker from 'expo-image-picker'
import { api } from '../lib/api'
import { ReconhecimentoScreen } from './ReconhecimentoScreen'

const mockedPost = api.post as jest.Mock
const mockedRequestCamera = ImagePicker.requestCameraPermissionsAsync as jest.Mock
const mockedLaunchCamera = ImagePicker.launchCameraAsync as jest.Mock

async function tirarFotoFalsa() {
  mockedRequestCamera.mockResolvedValue({ granted: true })
  mockedLaunchCamera.mockResolvedValue({ canceled: false, assets: [{ uri: 'blob:foto-fake' }] })
  await fireEvent.press(screen.getByTestId('reco-tirar-foto-button'))
  await screen.findByTestId('reco-foto-preview')
}

describe('ReconhecimentoScreen', () => {
  const originalFetch = globalThis.fetch
  const onIrParaTab = jest.fn()

  beforeEach(() => {
    mockedPost.mockReset()
    onIrParaTab.mockReset()
    globalThis.fetch = jest.fn().mockResolvedValue({ blob: async () => new Blob(['fake']) }) as unknown as typeof fetch
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('mantem Classificar desabilitado ate uma foto ser escolhida', async () => {
    await render(<ReconhecimentoScreen onIrParaTab={onIrParaTab} />)
    const botao = screen.getByTestId('reco-classificar-button')
    await fireEvent.press(botao)
    expect(mockedPost).not.toHaveBeenCalled()
  })

  it('nega permissao de camera e mostra erro', async () => {
    mockedRequestCamera.mockResolvedValue({ granted: false })
    await render(<ReconhecimentoScreen onIrParaTab={onIrParaTab} />)

    await fireEvent.press(screen.getByTestId('reco-tirar-foto-button'))

    expect(await screen.findByText('Permissão de câmera negada')).toBeTruthy()
  })

  it('classifica a foto e mostra a sugestao com atalho para a aba correta', async () => {
    mockedPost.mockResolvedValue({
      data: {
        tipo_identificado: 'praga',
        nome_sugerido: 'Lagarta-da-soja',
        confianca: 0.87,
        observacoes: 'Lesao foliar compativel com desfolha.',
        modelo_versao_id: 'modelo-1',
      },
    })
    await render(<ReconhecimentoScreen onIrParaTab={onIrParaTab} />)

    await tirarFotoFalsa()
    await fireEvent.press(screen.getByTestId('reco-classificar-button'))

    expect(await screen.findByText('Sugestão da IA')).toBeTruthy()
    expect(screen.getByText('Nome sugerido: Lagarta-da-soja')).toBeTruthy()
    expect(screen.getByText('Confiança: 87%')).toBeTruthy()

    await fireEvent.press(screen.getByTestId('reco-ir-para-ocorrencia-button'))
    expect(onIrParaTab).toHaveBeenCalledWith('pragas')
  })

  it('nao mostra atalho quando o tipo identificado e indeterminado', async () => {
    mockedPost.mockResolvedValue({
      data: {
        tipo_identificado: 'indeterminado',
        nome_sugerido: null,
        confianca: 0.1,
        observacoes: 'Foto sem foco no problema.',
        modelo_versao_id: 'modelo-1',
      },
    })
    await render(<ReconhecimentoScreen onIrParaTab={onIrParaTab} />)

    await tirarFotoFalsa()
    await fireEvent.press(screen.getByTestId('reco-classificar-button'))

    await screen.findByText('Sugestão da IA')
    expect(screen.queryByTestId('reco-ir-para-ocorrencia-button')).toBeNull()
  })

  it('mostra mensagem especifica quando a IA nao esta configurada (503)', async () => {
    mockedPost.mockRejectedValue({ response: { status: 503 } })
    await render(<ReconhecimentoScreen onIrParaTab={onIrParaTab} />)

    await tirarFotoFalsa()
    await fireEvent.press(screen.getByTestId('reco-classificar-button'))

    expect(await screen.findByText('Reconhecimento por IA não configurado neste ambiente.')).toBeTruthy()
  })

  it('mostra o detalhe de erro do backend quando disponivel', async () => {
    mockedPost.mockRejectedValue({ response: { status: 415, data: { detail: 'Tipo de arquivo não suportado' } } })
    await render(<ReconhecimentoScreen onIrParaTab={onIrParaTab} />)

    await waitFor(() => expect(screen.getByTestId('reco-tirar-foto-button')).toBeTruthy())
    await tirarFotoFalsa()
    await fireEvent.press(screen.getByTestId('reco-classificar-button'))

    expect(await screen.findByText('Tipo de arquivo não suportado')).toBeTruthy()
  })
})
