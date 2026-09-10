import { clave, idDeClave } from '@/lib/calc'

const ahora = new Date()

export const estadoVacio = {
  cargado: false,
  anio: ahora.getFullYear(),
  mes: ahora.getMonth(),
  categorias: [],
  billeteras: [],
  movimientos: [],
  presupuestos: {},
  saldos: {},
  recurrentes: [],
  omitidos: {},
  metas: [],
  notas: {},
}

const sinIds = (mapa, ids) => Object.fromEntries(Object.entries(mapa).filter(([k]) => !ids.has(idDeClave(k))))

export function reducer(state, action) {
  switch (action.type) {
    case 'cargar':
      return { ...state, ...action.datos, cargado: true }
    case 'periodo':
      return { ...state, ...action.periodo }
    case 'agregar':
      return { ...state, [action.lista]: [...state[action.lista], action.datos] }
    case 'editar':
      return { ...state, [action.lista]: state[action.lista].map((x) => (x.id === action.id ? { ...x, ...action.datos } : x)) }
    case 'eliminar': {
      const hijas = action.lista === 'categorias' ? state.categorias.filter((c) => c.padreId === action.id).map((c) => c.id) : []
      const ids = new Set([action.id, ...hijas])
      return {
        ...state,
        [action.lista]: state[action.lista].filter((x) => !ids.has(x.id)),
        presupuestos: sinIds(state.presupuestos, ids),
        saldos: sinIds(state.saldos, ids),
      }
    }
    case 'presupuesto': {
      const presupuestos = { ...state.presupuestos }
      for (const mes of action.meses) presupuestos[clave(state.anio, mes, action.id)] = action.valor
      return { ...state, presupuestos }
    }
    case 'omitir':
      return { ...state, omitidos: { ...state.omitidos, [clave(state.anio, action.mes, action.id)]: true } }
    case 'nota':
      return { ...state, notas: { ...state.notas, [`${state.anio}-${action.mes}`]: action.texto } }
    case 'saldo':
      return { ...state, saldos: { ...state.saldos, [clave(state.anio, action.mes, action.id)]: action.valor } }
    case 'reordenar': {
      const map = new Map(action.actualizaciones.map((u) => [u.id, u.orden]))
      return { ...state, categorias: state.categorias.map((c) => (map.has(c.id) ? { ...c, orden: map.get(c.id) } : c)).sort((a, b) => a.orden - b.orden) }
    }
    default:
      return state
  }
}
