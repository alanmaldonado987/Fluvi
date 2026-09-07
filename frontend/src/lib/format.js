export const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
export const MESES_CORTO = MESES.map((m) => m.slice(0, 3))

const cop = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 })
export const formatCOP = (valor) => cop.format(valor || 0).replace(/\s/g, '')

const dosDigitos = (n) => String(n).padStart(2, '0')
export const fechaIso = (anio, mes, dia) => `${anio}-${dosDigitos(mes + 1)}-${dosDigitos(dia)}`
const iso = (d) => fechaIso(d.getFullYear(), d.getMonth(), d.getDate())
export const diasAtras = (n) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return iso(d)
}
export const hoy = () => diasAtras(0)
export const anioDe = (fecha) => Number(fecha.slice(0, 4))
export const mesDe = (fecha) => Number(fecha.slice(5, 7)) - 1
export const fechaCorta = (fecha) => `${Number(fecha.slice(8, 10))} ${MESES_CORTO[mesDe(fecha)].toLowerCase()}`

const conHora = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
export const fechaHora = (iso) => conHora.format(new Date(iso))

const largo = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
export const fechaLarga = (fecha) => {
  const [a, m, d] = fecha.split('-').map(Number)
  const texto = largo.format(new Date(a, m - 1, d))
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}
