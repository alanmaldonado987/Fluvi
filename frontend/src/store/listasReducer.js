export const estadoInicialListas = { cargado: false, listas: [], items: [], miembros: [] }

export function listasReducer(state, action) {
  switch (action.type) {
    case 'cargar':
      return { ...state, ...action.datos, cargado: true }
    case 'agregarLista':
      return { ...state, listas: [...state.listas, action.lista] }
    case 'editarLista':
      return { ...state, listas: state.listas.map((l) => (l.id === action.id ? { ...l, ...action.datos } : l)) }
    // Quitar una lista de la vista (la borró su dueño, o el usuario salió de ella) también quita sus ítems y miembros.
    case 'quitarLista':
      return {
        ...state,
        listas: state.listas.filter((l) => l.id !== action.id),
        items: state.items.filter((i) => i.listaId !== action.id),
        miembros: state.miembros.filter((m) => m.listaId !== action.id),
      }
    case 'agregarItem':
      return { ...state, items: [...state.items, action.item] }
    case 'editarItem':
      return { ...state, items: state.items.map((i) => (i.id === action.id ? { ...i, ...action.datos } : i)) }
    case 'quitarItem':
      return { ...state, items: state.items.filter((i) => i.id !== action.id) }
    case 'editarMiembro':
      return { ...state, miembros: state.miembros.map((m) => (m.listaId === action.listaId && m.usuarioId === action.usuarioId ? { ...m, ...action.datos } : m)) }
    case 'quitarMiembro':
      return { ...state, miembros: state.miembros.filter((m) => !(m.listaId === action.listaId && m.usuarioId === action.usuarioId)) }
    case 'quitarMiembros':
      return { ...state, miembros: state.miembros.filter((m) => m.listaId !== action.listaId) }
    default:
      return state
  }
}
