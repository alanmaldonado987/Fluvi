const reg = (window.__registroFinanzas ||= [])
const anotar = (fn) => (...args) => { reg.push({ fn, args }); return Promise.resolve() }
export const consultar = async () => []
export async function cargarTodo() {
  reg.push({ fn: 'cargarTodo', lectura: true })
  return { categorias: [{ id: 'c1', nombre: 'Comida', tipo: 'Egreso', orden: 0 }], billeteras: [{ id: 'b1', nombre: 'Efectivo' }], movimientos: [], presupuestos: {}, saldos: {}, recurrentes: [], omitidos: {}, metas: [], notas: {}, deudas: [] }
}
export const insertar = anotar('insertar')
export const actualizar = anotar('actualizar')
export const eliminar = anotar('eliminar')
export const guardarPresupuestos = anotar('guardarPresupuestos')
export const guardarSaldo = anotar('guardarSaldo')
export const guardarNota = anotar('guardarNota')
export const historialDe = async () => []
export const omitir = anotar('omitir')
export const reordenarCategorias = anotar('reordenarCategorias')
export const borrarTodo = anotar('borrarTodo')
export const importarAnio = anotar('importarAnio')
export const TABLAS_COPIA = []
export const exportarCopia = async () => ({})
export const subirFilas = anotar('subirFilas')
