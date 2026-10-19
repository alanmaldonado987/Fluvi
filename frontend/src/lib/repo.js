import { clave } from './calc'
import { resultado, supabase } from './supabase'

const columnas = { padreId: 'padre_id', categoriaId: 'categoria_id', recurrenteId: 'recurrente_id', billeteraId: 'billetera_id', destinoId: 'billetera_destino_id', deudaId: 'deuda_id', billetePagoId: 'billetera_pago_id', fechaPago: 'fecha_pago', fechaInicio: 'fecha_inicio', fechaLimite: 'fecha_limite' }

const aFila = (obj) =>
  Object.fromEntries(
    Object.entries(obj)
      .filter(([campo, valor]) => campo === 'padreId' || valor !== undefined)
      .map(([campo, valor]) => [columnas[campo] ?? campo, valor ?? null]),
  )

const aCategoria = (r) => ({ id: r.id, nombre: r.nombre, tipo: r.tipo, orden: r.orden ?? 0, ...(r.padre_id ? { padreId: r.padre_id } : {}) })
const aBilletera = (r) => ({ id: r.id, nombre: r.nombre })
const aMovimiento = (r) => ({
  id: r.id,
  consecutivo: r.consecutivo,
  fecha: r.fecha,
  tipo: r.tipo,
  categoriaId: r.categoria_id,
  concepto: r.concepto,
  valor: Number(r.valor),
  observacion: r.observacion,
  ...(r.recurrente_id ? { recurrenteId: r.recurrente_id } : {}),
  ...(r.billetera_id ? { billeteraId: r.billetera_id } : {}),
  ...(r.billetera_destino_id ? { destinoId: r.billetera_destino_id } : {}),
  ...(r.deuda_id ? { deudaId: r.deuda_id } : {}),
})
const aRecurrente = (r) => ({ id: r.id, tipo: r.tipo, categoriaId: r.categoria_id, concepto: r.concepto, valor: Number(r.valor), dia: r.dia, activo: r.activo })
const aMeta = (r) => ({ id: r.id, nombre: r.nombre, objetivo: Number(r.objetivo), categoriaId: r.categoria_id, fechaInicio: r.fecha_inicio, fechaLimite: r.fecha_limite })
const aDeuda = (r) => ({
  id: r.id,
  persona: r.persona,
  valor: Number(r.valor),
  billeteraId: r.billetera_id,
  concepto: r.concepto,
  fecha: r.fecha,
  pagada: r.pagada,
  ...(r.billetera_pago_id ? { billetePagoId: r.billetera_pago_id } : {}),
  ...(r.fecha_pago ? { fechaPago: r.fecha_pago } : {}),
})

// Supabase devuelve como máximo 1000 filas por consulta sin avisar: se pide por tandas hasta completar el total.
// Cada consulta se ordena también por una columna única para que ninguna fila se repita ni se salte entre tandas.
const TANDA = 1000

const consultar = async (tabla, ordenes) => {
  const filas = []
  for (;;) {
    let q = supabase.from(tabla).select('*', { count: 'exact' })
    for (const columna of ordenes) q = q.order(columna)
    const { data, error, count } = await q.range(filas.length, filas.length + TANDA - 1)
    if (error) throw error
    filas.push(...data)
    if (!data.length || filas.length >= count) return filas
  }
}

export async function cargarTodo() {
  const [categorias, billeteras, movimientos, presupuestos, saldos, recurrentes, omitidos, metas, notas, deudas] = await Promise.all([
    consultar('categorias', ['orden', 'id']),
    consultar('billeteras', ['creado_en', 'id']),
    consultar('movimientos', ['fecha', 'id']),
    consultar('presupuestos', ['anio', 'mes', 'categoria_id']),
    consultar('saldos_billetera', ['anio', 'mes', 'billetera_id']),
    consultar('recurrentes', ['creado_en', 'id']),
    consultar('recurrentes_omitidos', ['anio', 'mes', 'recurrente_id']),
    consultar('metas', ['creado_en', 'id']),
    consultar('notas_mes', ['anio', 'mes']),
    consultar('deudas', ['creado_en', 'id']),
  ])
  return {
    categorias: categorias.map(aCategoria),
    billeteras: billeteras.map(aBilletera),
    movimientos: movimientos.map(aMovimiento),
    presupuestos: Object.fromEntries(presupuestos.map((p) => [clave(p.anio, p.mes - 1, p.categoria_id), Number(p.valor)])),
    saldos: Object.fromEntries(saldos.map((s) => [clave(s.anio, s.mes - 1, s.billetera_id), Number(s.saldo)])),
    recurrentes: recurrentes.map(aRecurrente),
    omitidos: Object.fromEntries(omitidos.map((o) => [clave(o.anio, o.mes - 1, o.recurrente_id), true])),
    metas: metas.map(aMeta),
    notas: Object.fromEntries(notas.map((n) => [`${n.anio}-${n.mes - 1}`, n.texto])),
    deudas: deudas.map(aDeuda),
  }
}

export const insertar = (lista, item) => supabase.from(lista).insert(Array.isArray(item) ? item.map(aFila) : aFila(item)).then(resultado)
export const actualizar = (lista, id, datos) => supabase.from(lista).update(aFila(datos)).eq('id', id).then(resultado)
export const eliminar = (lista, id) => supabase.from(lista).delete().eq('id', id).then(resultado)

export const guardarPresupuestos = (anio, meses, categoriaId, valor) =>
  supabase
    .from('presupuestos')
    .upsert(meses.map((mes) => ({ anio, mes: mes + 1, categoria_id: categoriaId, valor })))
    .then(resultado)

export const guardarSaldo = (anio, mes, billeteraId, saldo) => supabase.from('saldos_billetera').upsert({ anio, mes: mes + 1, billetera_id: billeteraId, saldo }).then(resultado)

export const guardarNota = (anio, mes, texto) => supabase.from('notas_mes').upsert({ anio, mes: mes + 1, texto, actualizado_en: new Date().toISOString() }).then(resultado)

export const historialDe = (movimientoId) => supabase.from('movimientos_historial').select('*').eq('movimiento_id', movimientoId).order('creado_en').then(resultado)

export const omitir = (anio, mes, recurrenteId) => supabase.from('recurrentes_omitidos').insert({ anio, mes: mes + 1, recurrente_id: recurrenteId }).then(resultado)

export const reordenarCategorias = (items) => Promise.all(items.map(({ id, orden }) => supabase.from('categorias').update({ orden }).eq('id', id).then(resultado)))

export const borrarTodo = () => supabase.rpc('borrar_mis_datos').then(resultado)

export const importarAnio = (anio, datos) => supabase.rpc('importar_anio', { p_anio: anio, p_datos: datos }).then(resultado)
