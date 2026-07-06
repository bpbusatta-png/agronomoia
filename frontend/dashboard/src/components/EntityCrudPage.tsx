import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api } from '../lib/api'
import type { EntityConfig, SelectOption } from '../entities/types'

interface Props {
  config: EntityConfig
  refConfigs: Record<string, EntityConfig>
}

type Row = Record<string, unknown> & { id: string }

export function EntityCrudPage({ config, refConfigs }: Props) {
  const [items, setItems] = useState<Row[]>([])
  const [refOptions, setRefOptions] = useState<Record<string, SelectOption[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Row | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get<Row[]>(config.endpoint)
      setItems(data)
    } catch {
      setError('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [config.endpoint])

  const loadRefs = useCallback(async () => {
    if (!config.refs) return
    const entries = await Promise.all(
      config.refs.map(async (refKey) => {
        const refConfig = refConfigs[refKey]
        if (!refConfig) return [refKey, []] as const
        const { data } = await api.get<Row[]>(refConfig.endpoint)
        const labelField = refConfig.columns[0]?.name ?? 'id'
        const options: SelectOption[] = data.map((item) => ({
          value: item.id,
          label: String(item[labelField] ?? item.id),
        }))
        return [refKey, options] as const
      }),
    )
    setRefOptions(Object.fromEntries(entries))
  }, [config.refs, refConfigs])

  useEffect(() => {
    load()
    loadRefs()
  }, [load, loadRefs])

  function openCreate() {
    setEditing(null)
    setFormValues({})
    setShowForm(true)
  }

  function openEdit(item: Row) {
    setEditing(item)
    const values: Record<string, string> = {}
    config.fields.forEach((f) => {
      const value = item[f.name]
      if (value === null || value === undefined) {
        values[f.name] = ''
      } else if (f.type === 'json') {
        values[f.name] = JSON.stringify(value)
      } else {
        values[f.name] = String(value)
      }
    })
    setFormValues(values)
    setShowForm(true)
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este registro?')) return
    try {
      await api.delete(`${config.endpoint}/${id}`)
      load()
    } catch {
      alert('Erro ao excluir')
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    for (const f of config.fields) {
      if (f.type === 'json' && formValues[f.name]) {
        try {
          JSON.parse(formValues[f.name])
        } catch {
          alert(`Campo "${f.label}" precisa ser um JSON válido, ex: {"P": 12.4, "K": 0.3}`)
          return
        }
      }
    }

    setSaving(true)
    try {
      const payload: Record<string, unknown> = {}
      config.fields.forEach((f) => {
        const raw = formValues[f.name]
        if (raw === undefined || raw === '') {
          payload[f.name] = null
          return
        }
        if (f.type === 'number') {
          payload[f.name] = Number(raw)
        } else if (f.type === 'json') {
          payload[f.name] = JSON.parse(raw)
        } else {
          payload[f.name] = raw
        }
      })
      if (editing) {
        await api.put(`${config.endpoint}/${editing.id}`, payload)
      } else {
        await api.post(config.endpoint, payload)
      }
      setShowForm(false)
      load()
    } catch (err) {
      const detail =
        (axiosErrorDetail(err) as string | undefined) ?? 'Erro ao salvar. Verifique os campos e tente novamente.'
      alert(detail)
    } finally {
      setSaving(false)
    }
  }

  function displayValue(item: Row, columnName: string) {
    const value = item[columnName]
    if (value === null || value === undefined || value === '') return '—'
    const field = config.fields.find((f) => f.name === columnName)
    if (field?.optionsFrom || field?.staticOptions) {
      const options = field.staticOptions ?? refOptions[field.optionsFrom ?? ''] ?? []
      const match = options.find((o) => o.value === value)
      if (match) return match.label
    }
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-gray-800">{config.title}</h1>
        <button onClick={openCreate} className="bg-green-700 text-white text-sm px-3 py-2 rounded hover:bg-green-800">
          + Novo
        </button>
      </div>

      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

      {loading ? (
        <p className="text-sm text-gray-500">Carregando...</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                {config.columns.map((c) => (
                  <th key={c.name} className="px-4 py-2 font-medium">
                    {c.label}
                  </th>
                ))}
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={config.columns.length + 1} className="px-4 py-6 text-center text-gray-400">
                    Nenhum registro ainda
                  </td>
                </tr>
              )}
              {items.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 last:border-0">
                  {config.columns.map((c) => (
                    <td key={c.name} className="px-4 py-2 text-gray-700">
                      {displayValue(item, c.name)}
                    </td>
                  ))}
                  <td className="px-4 py-2 text-right space-x-3 whitespace-nowrap">
                    <button onClick={() => openEdit(item)} className="text-blue-600 hover:underline">
                      Editar
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:underline">
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-10">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md space-y-3">
            <h2 className="text-lg font-semibold text-gray-800">
              {editing ? `Editar ${config.title}` : `Novo(a) ${config.title}`}
            </h2>
            {config.fields.map((f) => (
              <div key={f.name}>
                <label className="block text-sm text-gray-600 mb-1">{f.label}</label>
                {f.type === 'select' ? (
                  <select
                    value={formValues[f.name] ?? ''}
                    required={f.required}
                    onChange={(e) => setFormValues((v) => ({ ...v, [f.name]: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  >
                    <option value="">Selecione...</option>
                    {(f.staticOptions ?? refOptions[f.optionsFrom ?? ''] ?? []).map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : f.type === 'json' ? (
                  <textarea
                    value={formValues[f.name] ?? ''}
                    required={f.required}
                    rows={3}
                    onChange={(e) => setFormValues((v) => ({ ...v, [f.name]: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono"
                  />
                ) : (
                  <input
                    type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                    value={formValues[f.name] ?? ''}
                    required={f.required}
                    step={f.type === 'number' ? 'any' : undefined}
                    onChange={(e) => setFormValues((v) => ({ ...v, [f.name]: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  />
                )}
              </div>
            ))}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-3 py-2 text-sm rounded border border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-3 py-2 text-sm rounded bg-green-700 text-white hover:bg-green-800 disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

function axiosErrorDetail(err: unknown): unknown {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const response = (err as { response?: { data?: { detail?: unknown } } }).response
    return response?.data?.detail
  }
  return undefined
}
