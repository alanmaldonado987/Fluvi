import { anioDe, fechaIso, fechaLarga, formatCOP, MESES, MESES_CORTO, mesDe } from './format'

export const clave = (anio, mes, id) => `${anio}-${mes}-${id}`
export const idDeClave = (k) => k.split('-').slice(2).join('-')

export const esMesUnico = (mes) => typeof mes === 'number'

export const movimientosDe = (movimientos, anio, mes) =>
  movimientos.filter((m) => anioDe(m.fecha) === anio && mesDe(m.fecha) === mes)

export const movsFiltrados = (movimientos, anio, mes) => {
  if (mes === null) return movimientos.filter((m) => anioDe(m.fecha) === anio)
  if (Array.isArray(mes)) return movimientos.filter((m) => anioDe(m.fecha) === anio && mes.includes(mesDe(m.fecha)))
  return movimientosDe(movimientos, anio, mes)
}

// Período inmediato anterior para comparar: el mes anterior (diciembre del año pasado si es enero) o el año anterior.
// Con varios meses seleccionados no hay comparación. Si el período es el mes en curso, se compara hasta el mismo día
// para no mostrar como "ahorro" un mes que todavía no termina.
export function periodoAnterior({ movimientos, anio, mes }, fecha = new Date()) {
  if (mes === null) return { etiqueta: String(anio - 1), corta: String(anio - 1), movs: movsFiltrados(movimientos, anio - 1, null) }
  if (!esMesUnico(mes)) return null
  const [a, m] = mes > 0 ? [anio, mes - 1] : [anio - 1, 11]
  const enCurso = anio === fecha.getFullYear() && mes === fecha.getMonth()
  const movs = movimientosDe(movimientos, a, m).filter((x) => !enCurso || Number(x.fecha.slice(8, 10)) <= fecha.getDate())
  const corta = MESES_CORTO[m].toLowerCase()
  return { etiqueta: enCurso ? `${MESES[m].toLowerCase()} al día ${fecha.getDate()}` : MESES[m].toLowerCase(), corta: enCurso ? `${corta} · día ${fecha.getDate()}` : corta, movs }
}

// Cambio porcentual redondeado; null si no hay base de comparación.
export const variacion = (actual, anterior) => (anterior ? Math.round(((actual - anterior) / Math.abs(anterior)) * 100) : null)

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

export const nombreBilletera = (billeteras, id) => billeteras.find((b) => b.id === id)?.nombre ?? 'Billetera eliminada'

export function describirMovimiento(mapa, billeteras, m) {
  if (m.tipo === 'Transferencia') return { etiqueta: `${nombreBilletera(billeteras, m.billeteraId)} → ${nombreBilletera(billeteras, m.destinoId)}`, icono: 'transferencia' }
  if (m.deudaId) return { etiqueta: m.tipo === 'Egreso' ? 'Préstamo' : 'Cobro de deuda', icono: 'deuda' }
  return describirCategoria(mapa, m.categoriaId)
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
  for (const m of movsFiltrados(state.movimientos, state.anio, mes)) porId.set(m.categoriaId, (porId.get(m.categoriaId) || 0) + m.valor)
  const filas = state.categorias.filter((c) => c.padreId === padreId).map((c) => ({ ...c, valor: porId.get(c.id) || 0 }))
  const directo = porId.get(padreId) || 0
  return directo ? [...filas, { id: null, nombre: 'Sin subcategoría', valor: directo }] : filas
}

export const saldoBilleteras = ({ saldos, billeteras, anio }, mes) =>
  billeteras.reduce((t, b) => t + (saldos[clave(anio, mes, b.id)] || 0), 0)

const indiceMes = (anio, mes) => anio * 12 + mes

// Saldo de una billetera al cierre de un mes (de cualquier año). Cada mes parte del saldo registrado para ese mes
// (hoja Caja o "Ajustar saldo") y, si no lo tiene, del cierre del mes anterior; luego suma entradas y resta salidas.
export function cierreBilletera(state, anio, mes, billeteraId) {
  const objetivo = indiceMes(anio, mes)
  const registrados = new Map()
  for (const [k, valor] of Object.entries(state.saldos)) {
    if (idDeClave(k) !== billeteraId) continue
    const [a, m] = k.split('-').map(Number)
    registrados.set(indiceMes(a, m), valor)
  }
  const netos = new Map()
  for (const m of state.movimientos) {
    if (m.billeteraId !== billeteraId && m.destinoId !== billeteraId) continue
    const i = indiceMes(anioDe(m.fecha), mesDe(m.fecha))
    if (i > objetivo) continue
    const { entradas, salidas } = actividadBilletera([m], billeteraId)
    netos.set(i, (netos.get(i) || 0) + entradas - salidas)
  }
  const inicio = Math.min(objetivo, ...registrados.keys(), ...netos.keys())
  let saldo = 0
  for (let i = inicio; i <= objetivo; i++) {
    if (registrados.has(i)) saldo = registrados.get(i)
    saldo += netos.get(i) || 0
  }
  return saldo
}

export const saldoVivoBilletera = (state, mes, billeteraId) => cierreBilletera(state, state.anio, mes, billeteraId)

export const saldoVivoBilleteras = (state, mes) => state.billeteras.reduce((total, b) => total + saldoVivoBilletera(state, mes, b.id), 0)

// Cierre del mes anterior (diciembre del año pasado si el mes es enero).
export const cierreAnteriorBilletera = (state, mes, billeteraId) =>
  mes > 0 ? cierreBilletera(state, state.anio, mes - 1, billeteraId) : cierreBilletera(state, state.anio - 1, 11, billeteraId)

export const cierreAnteriorBilleteras = (state, mes) => state.billeteras.reduce((total, b) => total + cierreAnteriorBilletera(state, mes, b.id), 0)

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

export function flujoAnio(state) {
  const { categorias, presupuestos, movimientos, anio } = state
  const movsAnio = movimientos.filter((m) => anioDe(m.fecha) === anio)
  const real = realPorCategoria(movsAnio, categorias)
  const filas = principales(categorias).map((c) => {
    let proyectado = 0
    for (let m = 0; m < 12; m++) proyectado += presupuestos[clave(anio, m, c.id)] || 0
    const r = real.get(c.id) || 0
    return { ...c, proyectado, real: r, diferencia: proyectado - r }
  })
  return {
    ingresos: filas.filter((f) => f.tipo === 'Ingreso'),
    egresos: filas.filter((f) => f.tipo === 'Egreso'),
    saldoInicial: saldoInicial(state, 0),
  }
}

export function flujoMulti(state, meses) {
  const { categorias, presupuestos, anio } = state
  const arr = Array.isArray(meses) ? meses : [meses]
  const real = realPorCategoria(movsFiltrados(state.movimientos, anio, meses), categorias)
  const filas = principales(categorias).map((c) => {
    let proyectado = 0
    for (const m of arr) proyectado += presupuestos[clave(anio, m, c.id)] || 0
    const r = real.get(c.id) || 0
    return { ...c, proyectado, real: r, diferencia: proyectado - r }
  })
  return {
    ingresos: filas.filter((f) => f.tipo === 'Ingreso'),
    egresos: filas.filter((f) => f.tipo === 'Egreso'),
    saldoInicial: arr.length ? saldoInicial(state, Math.min(...arr)) : 0,
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

// Total en billeteras al cierre de cada mes, hasta el mes actual (los meses futuros quedan vacíos).
export function serieBilleteras(state) {
  const hoyIndice = indiceMes(new Date().getFullYear(), new Date().getMonth())
  return Array.from({ length: 12 }, (_, mes) => ({
    mes,
    valor: state.billeteras.length && indiceMes(state.anio, mes) <= hoyIndice ? saldoVivoBilleteras(state, mes) : null,
  }))
}

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

const mesRelativo = (anio, mes, delta) => {
  const i = anio * 12 + mes + delta
  return { anio: Math.floor(i / 12), mes: i % 12 }
}

const tienePresupuesto = (state, anio, mes) => principales(state.categorias).some((c) => (state.presupuestos[clave(anio, mes, c.id)] || 0) > 0)

// Un mes cuenta como "dentro del presupuesto" si tenía presupuesto, tuvo movimientos y ningún egreso superó lo proyectado.
function dentroDelPresupuesto(state, anio, mes) {
  const { egresos } = flujoMes({ ...state, anio }, mes)
  return egresos.some((f) => f.proyectado > 0) && movimientosDe(state.movimientos, anio, mes).length > 0 && excedidas(egresos).length === 0
}

const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`

function deudasSinCobrar(state, preferencias, formatear, hoyIso) {
  const lista = []
  for (const d of state.deudas) {
    if (d.pagada) continue
    const abonado = state.movimientos.filter((m) => m.deudaId === d.id && m.tipo === 'Ingreso').reduce((t, m) => t + m.valor, 0)
    const dias = diasEntre(d.fecha, hoyIso)
    if (d.valor > abonado && dias >= preferencias.diasDeuda) {
      lista.push({ id: `deuda-${d.id}`, texto: `${d.persona} te debe ${formatear(d.valor - abonado)} desde hace ${dias} días.`, ruta: '/deudas' })
    }
  }
  return lista
}

// Compara el gasto del mes con el promedio de los 3 meses anteriores, solo en categorías de uso habitual (con gasto en al menos 2 de esos meses).
function gastosAtipicos(state, formatear) {
  const egresosDe = (anio, mes) => realPorCategoria(movimientosDe(state.movimientos, anio, mes).filter((m) => m.tipo === 'Egreso'), state.categorias)
  const previos = [1, 2, 3].map((d) => {
    const p = mesRelativo(state.anio, state.mes, -d)
    return egresosDe(p.anio, p.mes)
  })
  const actual = egresosDe(state.anio, state.mes)
  const lista = []
  for (const c of principales(state.categorias).filter((x) => x.tipo === 'Egreso')) {
    const valores = previos.map((r) => r.get(c.id) || 0)
    if (valores.filter((v) => v > 0).length < 2) continue
    const promedio = valores.reduce((t, v) => t + v, 0) / 3
    const real = actual.get(c.id) || 0
    if (real > promedio * 1.5 && real - promedio >= 50000) {
      lista.push({ id: `atipico-${c.id}`, texto: `${c.nombre} lleva ${formatear(real)} este mes, ${Math.round((real / promedio - 1) * 100)}% más que tu promedio de ${formatear(promedio)}.`, ruta: '/movimientos' })
    }
  }
  return lista
}

// Proyección simple: saldo de hoy + recurrentes de ingreso pendientes - recurrentes de egreso pendientes - gasto variable diario por los días que faltan.
function saldoEnRiesgo(state, formatear, ahora) {
  const dia = ahora.getDate()
  if (!state.billeteras.length || dia < 5) return null
  const restantes = diasEnMes(state.anio, state.mes) - dia
  const variable = movimientosDe(state.movimientos, state.anio, state.mes)
    .filter((m) => m.tipo === 'Egreso' && !m.recurrenteId && !m.deudaId)
    .reduce((t, m) => t + m.valor, 0)
  const pend = pendientes(state, state.mes)
  const ingresos = pend.filter((r) => r.tipo === 'Ingreso').reduce((t, r) => t + r.valor, 0)
  const egresos = pend.filter((r) => r.tipo !== 'Ingreso').reduce((t, r) => t + r.valor, 0)
  const proyectado = saldoVivoBilleteras(state, state.mes) + ingresos - egresos - (variable / dia) * restantes
  if (proyectado >= 0) return null
  return { id: 'saldo-riesgo', texto: `A este ritmo terminarías ${MESES[state.mes].toLowerCase()} con ${formatear(Math.round(proyectado))} en tus billeteras.`, ruta: '/flujo' }
}

function movimientosIncompletos(state) {
  const previo = mesRelativo(state.anio, state.mes, -1)
  const recientes = [...movimientosDe(state.movimientos, state.anio, state.mes), ...movimientosDe(state.movimientos, previo.anio, previo.mes)]
  const sinCategoria = recientes.filter((m) => m.tipo !== 'Transferencia' && !m.categoriaId && !m.deudaId).length
  const sinBilletera = state.billeteras.length ? recientes.filter((m) => m.tipo !== 'Transferencia' && !m.billeteraId).length : 0
  if (!sinCategoria && !sinBilletera) return null
  const partes = []
  if (sinCategoria) partes.push(`${plural(sinCategoria, 'movimiento', 'movimientos')} sin categoría`)
  if (sinBilletera) partes.push(`${sinCategoria ? sinBilletera : plural(sinBilletera, 'movimiento', 'movimientos')} sin billetera`)
  return { id: 'incompletos', texto: `Tienes ${partes.join(' y ')} en este y el mes pasado.`, ruta: '/movimientos' }
}

// Avisos de la campana. Siempre se calculan sobre el mes en curso (`ahora`), sin importar el período que se esté mirando.
// Los avisos con `positivo` son buenas noticias: no cuentan en el contador de pendientes.
export function recordatorios(estado, preferencias, formatear = formatCOP, ahora = new Date()) {
  if (!preferencias.recordatorios) return []
  const state = { ...estado, anio: ahora.getFullYear(), mes: ahora.getMonth() }
  const activo = (nombre) => preferencias[nombre] !== false
  const hoyIso = fechaIso(state.anio, state.mes, ahora.getDate())
  const dia = ahora.getDate()
  const restantes = diasEnMes(state.anio, state.mes) - dia
  const plazo = restantes === 1 ? 'queda 1 día' : `quedan ${restantes} días`
  const previo = mesRelativo(state.anio, state.mes, -1)
  const siguiente = mesRelativo(state.anio, state.mes, 1)
  const lista = []

  if (activo('avisosDeuda')) lista.push(...deudasSinCobrar(state, preferencias, formatear, hoyIso))
  if (activo('avisosSaldoRiesgo')) {
    const riesgo = saldoEnRiesgo(state, formatear, ahora)
    if (riesgo) lista.push(riesgo)
  }
  if (activo('avisosSaldoBajo')) {
    for (const b of state.billeteras) {
      const minimo = preferencias.saldoMinimo?.[b.id]
      if (!minimo) continue
      const saldo = saldoVivoBilletera(state, state.mes, b.id)
      if (saldo < minimo) lista.push({ id: `saldo-bajo-${b.id}`, texto: `${b.nombre} tiene ${formatear(saldo)}, por debajo de tu mínimo de ${formatear(minimo)}.`, ruta: '/billeteras' })
    }
  }

  for (const f of flujoMes(state, state.mes).egresos) {
    // Un gasto que llegó exactamente a lo proyectado (arriendo, cuotas) está cumplido, no en riesgo; el redondeo hacia abajo evita mostrar "100%" sin haberlo alcanzado.
    const pct = f.proyectado ? Math.floor((f.real / f.proyectado) * 100) : 0
    if (pct >= preferencias.umbralPresupuesto && f.real < f.proyectado) {
      lista.push({ id: `categoria-${f.id}`, texto: `${f.nombre} va al ${pct}% del presupuesto y ${plazo} del mes.`, ruta: '/presupuesto' })
    }
  }
  if (activo('avisosAtipico')) lista.push(...gastosAtipicos(state, formatear))

  const ultima = state.movimientos.reduce((max, m) => (m.fecha > max ? m.fecha : max), '')
  const dias = ultima ? diasEntre(ultima, hoyIso) : 0
  if (ultima && dias >= preferencias.diasSinRegistrar) {
    const texto = dias > 31 ? `No registras movimientos desde el ${fechaLarga(ultima).toLowerCase()} de ${ultima.slice(0, 4)}.` : `Llevas ${dias} ${dias === 1 ? 'día' : 'días'} sin registrar movimientos.`
    lista.push({ id: 'sin-registrar', texto, ruta: '/movimientos' })
  }

  if (activo('avisosIncompletos')) {
    const incompletos = movimientosIncompletos(state)
    if (incompletos) lista.push(incompletos)
  }
  if (restantes <= 5 && state.billeteras.length && !state.billeteras.some((b) => state.saldos[clave(state.anio, state.mes, b.id)] != null)) {
    lista.push({ id: 'billeteras', texto: 'El mes termina pronto y no has registrado los saldos de tus billeteras.', ruta: '/billeteras' })
  }
  if (activo('avisosCierre') && dia <= 10 && state.billeteras.length && movimientosDe(state.movimientos, previo.anio, previo.mes).length && !state.billeteras.some((b) => state.saldos[clave(previo.anio, previo.mes, b.id)] != null)) {
    lista.push({ id: 'cierre-anterior', texto: `${MESES[previo.mes]} quedó sin saldos de billeteras registrados.`, ruta: '/billeteras' })
  }
  if (activo('avisosSinPresupuesto') && principales(state.categorias).length) {
    if (!tienePresupuesto(state, state.anio, state.mes) && tienePresupuesto(state, previo.anio, previo.mes)) {
      lista.push({ id: 'sin-presupuesto-mes', texto: `Aún no defines el presupuesto de ${MESES[state.mes].toLowerCase()}.`, ruta: '/presupuesto' })
    } else if (restantes <= 7 && tienePresupuesto(state, state.anio, state.mes) && !tienePresupuesto(state, siguiente.anio, siguiente.mes)) {
      lista.push({ id: 'sin-presupuesto-siguiente', texto: `Se acerca ${MESES[siguiente.mes].toLowerCase()} y aún no defines su presupuesto.`, ruta: '/presupuesto' })
    }
  }
  if (activo('avisosRacha') && dia <= 7) {
    let racha = 0
    for (let k = 1; k <= 12; k++) {
      const p = mesRelativo(state.anio, state.mes, -k)
      if (!dentroDelPresupuesto(state, p.anio, p.mes)) break
      racha++
    }
    if (racha >= 2) lista.push({ id: 'racha', texto: `¡${racha} meses seguidos dentro del presupuesto!`, ruta: '/flujo', positivo: true })
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
