import { useState, type FormEvent } from 'react'
import { EntityCrudPage } from '../components/EntityCrudPage'
import { allConfigs, plantasAtipicasConfig } from '../entities/configs'
import { api } from '../lib/api'

export function PlantasAtipicasPage() {
  const [validatingId, setValidatingId] = useState<string | null>(null)
  const [decisao, setDecisao] = useState('manter')
  const [justificativa, setJustificativa] = useState('')
  const [saving, setSaving] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  async function handleValidar(e: FormEvent) {
    e.preventDefault()
    if (!validatingId) return
    setSaving(true)
    try {
      await api.post(`/plantas-atipicas/${validatingId}/validar`, {
        decisao,
        justificativa: justificativa || null,
      })
      setValidatingId(null)
      setJustificativa('')
      setDecisao('manter')
      setReloadKey((k) => k + 1)
    } catch {
      alert('Erro ao validar. Confirme que seu usuário tem papel Administrador ou Agronomo_RT.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <EntityCrudPage
        key={reloadKey}
        config={plantasAtipicasConfig}
        refConfigs={allConfigs}
        renderExtraAction={(item) => (
          <button onClick={() => setValidatingId(item.id)} className="text-amber-700 hover:underline">
            Validar
          </button>
        )}
      />

      {validatingId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-20">
          <form onSubmit={handleValidar} className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md space-y-3">
            <h2 className="text-lg font-semibold text-gray-800">Validar ocorrência</h2>
            <p className="text-sm text-gray-500">
              Restrito a Administrador ou Agronomo_RT — registra a decisão em validacoes_humanas.
            </p>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Decisão</label>
              <select
                value={decisao}
                onChange={(e) => setDecisao(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="manter">Manter</option>
                <option value="eliminar">Eliminar</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Justificativa</label>
              <textarea
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setValidatingId(null)}
                className="px-3 py-2 text-sm rounded border border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-3 py-2 text-sm rounded bg-amber-700 text-white hover:bg-amber-800 disabled:opacity-50"
              >
                {saving ? 'Validando...' : 'Confirmar validação'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
