import { create } from 'zustand'
import type { NormalizedRow } from '../types'

export type DataState = {
  fileName: string | null
  sheetNames: string[]
  activeSheet: string | null
  rows: NormalizedRow[]
  columns: string[]
  loadedAt: Date | null
  setData: (data: {
    fileName: string
    sheetNames: string[]
    activeSheet: string
    rows: NormalizedRow[]
    columns: string[]
  }) => void
  clear: () => void
}

export const useDataStore = create<DataState>((set) => ({
  fileName: null,
  sheetNames: [],
  activeSheet: null,
  rows: [],
  columns: [],
  loadedAt: null,
  setData: (data) =>
    set({
      fileName: data.fileName,
      sheetNames: data.sheetNames,
      activeSheet: data.activeSheet,
      rows: data.rows,
      columns: data.columns,
      loadedAt: new Date(),
    }),
  clear: () =>
    set({
      fileName: null,
      sheetNames: [],
      activeSheet: null,
      rows: [],
      columns: [],
      loadedAt: null,
    }),
}))
