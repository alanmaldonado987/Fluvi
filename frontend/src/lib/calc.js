import { anioDe, fechaIso, fechaLarga, hoy, mesDe } from './format'

export const clave = (anio, mes, id) => `${anio}-${mes}-${id}`
export const idDeClave = (k) => k.split('-').slice(2).join('-')

export const movimientosDe = (movimientos, anio, mes) =>
  movimientos.filter((m) => anioDe(m.fecha) === anio && mesDe(m.fecha) === mes)

export function totales(movs) {
  let ingresos = 0
  let egresos = 0
  for (const m of movs) {
    if (m.tipo === 'Ingreso') ingresos += m.valor
    else if (m.tipo === 'Egreso') egresos += m.valor
  }
  return { ingresos, egresos, neto: ingresos - egresos }
}

export const principales = (categorias) => categorias.filter((c) => !c.padreId)
export const indicePadres = (categorias) => new Map(categorias.map((c) => [c.id, c.padreId ?? c.id]))

export function describirCategoria(mapa, id) {
  const c = mapa.get(id)
  if (!c) return { etiqueta: 'Sin categoría', icono: '' }
  const padre = c.padreId ? mapa.get(c.padreId) : null
  return padre ? { etiqueta: `${padre.nombre} / ${c.nombre}`, icono: padre.nombre } : { etiqueta: c.nombre, icono: c.nombre }
}

export const nombreBilletera = (billeteras, id) => billeteras.find((b) => b.id === id)?.nombre ?? 'Sin billetera'

export function describirMovimiento(mapa, billeteras, m) {
  if (m.tipo !== 'Transferencia') return describirCategoria(mapa, m.categoriaId)
  return { etiqueta: `${nombreBilletera(billeteras, m.billeteraId)} → ${nombreBilletera(billeteras, m.destinoId)}`, icono: 'transferencia' }
}

export function actividadBilletera(movs, id) {
  let entradas = 0
  let salidas = 0
  for (const m of movs) {
    if (m.destinoId === id || (m.tipo === 'Ingreso' && m.billeteraId === id)) entradas += m.valor
    else if (m.billeteraId === id && m.tipo !== 'Ingreso') salidas += m.valor
  }
  return { entradas, salidas }
}

export function realPorCategoria(movs, categorias) {
  const padres = indicePadres(categorias)
  const real = new Map()
  for (const m of movs) {
    if (!m.categoriaId) continue
    const id = padres.get(m.categoriaId) ?? m.categoriaId
    real.set(id, (real.get(id) || 0) + m.valor)
  }
  return real
}

export function desglose(state, mes, padreId) {
  const porId = new Map()
  for (const m of movimientosDe(state.movimientos, state.anio, mes)) porId.set(m.categoriaId, (porId.get(m.categoriaId) || 0) + m.valor)
  const filas = state.categorias.filter((c) => c.padreId === padreId).map((c) => ({ ...c, valor: porId.get(c.id) || 0 }))
  const directo = porId.get(padreId) || 0
  return directo ? [...filas, { id: null, nombre: 'Sin subcategoría', valor: directo }] : filas
}

export const saldoBilleteras = ({ saldos, billeteras, anio }, mes) =>
  billeteras.reduce((t, b) => t + (saldos[clave(anio, mes, b.id)] || 0), 0)

export function saldoInicial(state, mes) {
  let saldo = saldoBilleteras(state, 0)
  for (let m = 0; m < mes; m++) saldo += totales(movimientosDe(state.movimientos, state.anio, m)).neto
  return saldo
}

export function flujoMes(state, mes) {
  const { categorias, presupuestos, anio } = state
  const real = realPorCategoria(movimientosDe(state.movimientos, anio, mes), categorias)
  const filas = principales(categorias).map((c) => {
    const proyectado = presupuestos[clave(anio, mes, c.id)] || 0
    const r = real.get(c.id) || 0
    return { ...c, proyectado, real: r, diferencia: proyectado - r }
  })
  return {
    ingresos: filas.filter((f) => f.tipo === 'Ingreso'),
    egresos: filas.filter((f) => f.tipo === 'Egreso'),
    saldoInicial: saldoInicial(state, mes),
  }
}

export const excedidas = (filas) => filas.filter((f) => f.real > f.proyectado)

export const avance = (proyectado, real) => (proyectado ? real / proyectado : real ? 1 : 0)

export const totalesFilas = (filas) =>
  filas.reduce(
    (t, f) => ({ proyectado: t.proyectado + f.proyectado, real: t.real + f.real, diferencia: t.diferencia + f.diferencia }),
    { proyectado: 0, real: 0, diferencia: 0 },
  )

const ultimoMesConDatos = (movimientos, anio) => movimientos.reduce((u, m) => (anioDe(m.fecha) === anio ? Math.max(u, mesDe(m.fecha)) : u), -1)

export function serieAnual(movimientos, anio) {
  const ultimo = ultimoMesConDatos(movimientos, anio)
  return Array.from({ length: 12 }, (_, mes) =>
    mes > ultimo ? { mes, ingresos: null, egresos: null } : { mes, ...totales(movimientosDe(movimientos, anio, mes)) },
  )
}

export function serieSaldos(state) {
  const ultimo = ultimoMesConDatos(state.movimientos, state.anio)
  return Array.from({ length: 12 }, (_, mes) => ({
    mes,
    valor: mes > ultimo ? null : saldoInicial(state, mes) + totales(movimientosDe(state.movimientos, state.anio, mes)).neto,
  }))
}

export const serieBilleteras = (state) =>
  Array.from({ length: 12 }, (_, mes) => ({
    mes,
    valor: state.billeteras.some((b) => state.saldos[clave(state.anio, mes, b.id)] != null) ? saldoBilleteras(state, mes) : null,
  }))

export const separarCategoria = (categorias, id) => {
  const c = categorias.find((x) => x.id === id)
  return c?.padreId ? { categoriaId: c.padreId, subcategoriaId: c.id } : { categoriaId: id ?? null, subcategoriaId: null }
}

export const diasEnMes = (anio, mes) => new Date(anio, mes + 1, 0).getDate()

export const movimientoDesdeRecurrente = (r, anio, mes) => ({
  fecha: fechaIso(anio, mes, Math.min(r.dia, diasEnMes(anio, mes))),
  tipo: r.tipo,
  categoriaId: r.categoriaId,
  concepto: r.concepto,
  valor: r.valor,
  observacion: '',
  recurrenteId: r.id,
})

export const pendientes = (state, mes) =>
  state.recurrentes.filter(
    (r) => r.activo && !state.omitidos[clave(state.anio, mes, r.id)] && !state.movimientos.some((m) => m.recurrenteId === r.id && anioDe(m.fecha) === state.anio && mesDe(m.fecha) === mes),
  )

const mesesHasta = (fecha) => {
  const hoy = new Date()
  return (anioDe(fecha) - hoy.getFullYear()) * 12 + (mesDe(fecha) - hoy.getMonth()) + 1
}

export function progresoMeta(state, meta) {
  const ids = new Set([meta.categoriaId, ...state.categorias.filter((c) => c.padreId === meta.categoriaId).map((c) => c.id)])
  const ahorrado = state.movimientos
    .filter((m) => ids.has(m.categoriaId) && m.fecha >= meta.fechaInicio && (!meta.fechaLimite || m.fecha <= meta.fechaLimite))
    .reduce((t, m) => t + m.valor, 0)
  const restante = Math.max(meta.objetivo - ahorrado, 0)
  const meses = meta.fechaLimite ? mesesHasta(meta.fechaLimite) : null
  return {
    ahorrado,
    restante,
    avance: Math.min(ahorrado / meta.objetivo, 1),
    meses,
    mensual: meses > 0 ? restante / meses : null,
    cumplida: restante === 0,
    vencida: meses != null && meses <= 0 && restante > 0,
  }
}

const diasEntre = (a, b) => Math.round((new Date(b.slice(0, 10)) - new Date(a.slice(0, 10))) / 86400000)

export function recordatorios(state, preferencias) {
  if (!preferencias.recordatorios) return []
  const lista = []
  const ahora = new Date()
  const ultima = state.movimientos.reduce((max, m) => (m.fecha > max ? m.fecha : max), '')
  const dias = ultima ? diasEntre(ultima, hoy()) : 0
  if (ultima && dias >= preferencias.diasSinRegistrar) {
    const texto = dias > 31 ? `No registras movimientos desde el ${fechaLarga(ultima).toLowerCase()} de ${ultima.slice(0, 4)}.` : `Llevas ${dias} ${dias === 1 ? 'día' : 'días'} sin registrar movimientos.`
    lista.push({ id: 'sin-registrar', texto, ruta: '/movimientos' })
  }
  if (state.anio !== ahora.getFullYear() || state.mes !== ahora.getMonth()) return lista
  const restantes = diasEnMes(state.anio, state.mes) - ahora.getDate()
  const plazo = restantes === 1 ? 'queda 1 día' : `quedan ${restantes} días`
  for (const f of flujoMes(state, state.mes).egresos) {
    const pct = f.proyectado ? Math.round((f.real / f.proyectado) * 100) : 0
    if (pct >= preferencias.umbralPresupuesto && f.real <= f.proyectado) {
      lista.push({ id: `categoria-${f.id}`, texto: `${f.nombre} va al ${pct}% del presupuesto y ${plazo} del mes.`, ruta: '/presupuesto' })
    }
  }
  if (restantes <= 5 && state.billeteras.length && !state.billeteras.some((b) => state.saldos[clave(state.anio, state.mes, b.id)] != null)) {
    lista.push({ id: 'billeteras', texto: 'El mes termina pronto y no has registrado los saldos de tus billeteras.', ruta: '/billeteras' })
  }
  return lista
}

export function distribucionEgresos(state, movs) {
  const real = realPorCategoria(movs.filter((m) => m.tipo === 'Egreso'), state.categorias)
  return principales(state.categorias)
    .filter((c) => real.has(c.id))
    .map((c) => ({ nombre: c.nombre, valor: real.get(c.id) }))
    .sort((a, b) => b.valor - a.valor)
}
