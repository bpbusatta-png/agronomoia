export type FieldType = 'text' | 'number' | 'date' | 'select'

export interface SelectOption {
  value: string
  label: string
}

export interface FieldConfig {
  name: string
  label: string
  type: FieldType
  required?: boolean
  optionsFrom?: string
}

export interface ColumnConfig {
  name: string
  label: string
}

export interface EntityConfig {
  key: string
  title: string
  endpoint: string
  fields: FieldConfig[]
  columns: ColumnConfig[]
  refs?: string[]
}
