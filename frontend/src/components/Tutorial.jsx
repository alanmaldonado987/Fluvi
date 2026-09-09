import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { entrada } from '@/lib/motion'

const pasos = [
  { ruta: '/', titulo: 'Bienvenida a Fluvi', texto: 'En un minuto te mostramos cómo funciona. Puedes saltar el recorrido y volver a verlo cuando quieras desde tu menú de usuario.' },
  { ruta: '/', objetivo: 'inicio', titulo: 'Inicio', texto: 'Tu mes de un vistazo: saldo en billeteras, ingresos, egresos, ahorro, alertas de presupuesto y recordatorios.' },
  { ruta: '/', objetivo: 'periodo', titulo: 'Mes y año', texto: 'Cambia el periodo aquí. Toda la app muestra el mes que elijas, así puedes revisar también años anteriores.' },
  { ruta: '/presupuesto', objetivo: 'presupuesto', titulo: 'Presupuesto', texto: 'Crea tus categorías de egresos e ingresos y define cuánto planeas cada mes. También puedes usar subcategorías y metas de ahorro.' },
  { ruta: '/billeteras', objetivo: 'billeteras', titulo: 'Billeteras', texto: 'Registra tus cuentas, como Nequi, el banco o el efectivo, y anota el saldo con el que cierras cada mes.' },
  { ruta: '/movimientos', objetivo: 'movimientos', titulo: 'Movimientos', texto: 'Aquí anotas cada gasto, ingreso o transferencia entre billeteras. Marca "Repetir cada mes" en los fijos, como el arriendo.' },
  { ruta: '/movimientos', objetivo: 'importar', titulo: 'Importar Excel', texto: '¿Vienes del Excel? Cárgalo una sola vez y se crean tus categorías, billeteras, presupuestos y movimientos.' },
  { ruta: '/flujo', objetivo: 'flujo', titulo: 'Flujo', texto: 'Compara lo que planeaste con lo que realmente pasó, categoría por categoría y mes a mes.' },
  { objetivo: 'privado', titulo: 'Modo privado', texto: 'Oculta todas las cifras con un toque, útil cuando revisas tus finanzas en público.' },
  { objetivo: 'usuario', titulo: 'Tu cuenta', texto: 'Desde tu menú entras a Configuración: perfil, notificaciones, tema oscuro, copia de seguridad y cierre de sesión.' },
  { ruta: '/', titulo: 'Eso es todo', texto: 'Empieza creando tus categorías en Presupuesto, o importa tu Excel y tendrás todo listo en un minuto.', final: true },
]

const MARGEN = 16
const SEPARACION = 12
const ANCHO = 352

const visible = (objetivo) =>
  [...document.querySelectorAll(`[data-tour="${objetivo}"]`)].find((el) => {
    const r = el.getBoundingClientRect()
    return r.width > 0 && r.height > 0
  })

function ubicar(rect) {
  if (!rect) return { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }
  const vw = window.innerWidth
  const vh = window.innerHeight
  const centroArriba = rect.top + rect.height / 2 < vh / 2
  if (vw < 640) return { left: MARGEN, right: MARGEN, ...(centroArriba ? { bottom: `calc(env(safe-area-inset-bottom) + ${MARGEN}px)` } : { top: MARGEN }) }
  if (rect.left < vw / 3 && rect.left + rect.width + SEPARACION + ANCHO <= vw - MARGEN) {
    return { left: rect.left + rect.width + SEPARACION, ...(centroArriba ? { top: Math.max(rect.top, MARGEN) } : { bottom: Math.max(vh - rect.top - rect.height, MARGEN) }) }
  }
  const left = Math.min(Math.max(rect.left, MARGEN), vw - MARGEN - ANCHO)
  return rect.top + rect.height + SEPARACION + 240 <= vh ? { left, top: rect.top + rect.height + SEPARACION } : { left, bottom: vh - rect.top + SEPARACION }
}

export function Tutorial({ onCerrar }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [paso, setPaso] = useState(0)
  const [rect, setRect] = useState(null)
  const primario = useRef(null)
  const tarjeta = useRef(null)
  const actual = pasos[paso]
  const ultimo = paso === pasos.length - 1

  const medir = useCallback(() => {
    const el = actual.objetivo ? visible(actual.objetivo) : null
    if (!el) {
      setRect(null)
      return false
    }
    el.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    const r = el.getBoundingClientRect()
    setRect({ top: r.top - 6, left: r.left - 6, width: r.width + 12, height: r.height + 12 })
    return true
  }, [actual])

  useEffect(() => {
    let intentos = 0
    let id = requestAnimationFrame(function intentar() {
      if (!medir() && intentos++ < 20) id = requestAnimationFrame(intentar)
    })
    window.addEventListener('resize', medir)
    window.addEventListener('scroll', medir, true)
    return () => {
      cancelAnimationFrame(id)
      window.removeEventListener('resize', medir)
      window.removeEventListener('scroll', medir, true)
    }
  }, [medir, pathname])

  useEffect(() => {
    const previo = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previo
    }
  }, [])

  useEffect(() => {
    primario.current?.focus()
  }, [paso])

  const ir = (n) => {
    setPaso(n)
    if (pasos[n].ruta && pasos[n].ruta !== pathname) navigate(pasos[n].ruta)
  }
  const terminar = (ruta) => {
    onCerrar()
    if (ruta) navigate(ruta)
  }
  const teclas = (e) => {
    if (e.key === 'Escape') terminar()
    else if (e.key === 'ArrowRight' && !ultimo) ir(paso + 1)
    else if (e.key === 'ArrowLeft' && paso > 0) ir(paso - 1)
    else if (e.key === 'Tab') {
      const botones = [...tarjeta.current.querySelectorAll('button')]
      const i = botones.indexOf(document.activeElement)
      const siguiente = botones[(i + (e.shiftKey ? -1 : 1) + botones.length) % botones.length]
      siguiente.focus()
      e.preventDefault()
    }
  }

  return (
    <div className="fixed inset-0 z-60" role="dialog" aria-modal="true" aria-labelledby="tutorial-titulo" onKeyDown={teclas}>
      {rect ? (
        <div aria-hidden="true" className="pointer-events-none fixed rounded-xl shadow-[0_0_0_100vmax_rgba(15,23,19,0.62)] ring-2 ring-white/70 transition-[top,left,width,height] duration-300 ease-out" style={rect} />
      ) : (
        <div aria-hidden="true" className="fixed inset-0 bg-[rgba(15,23,19,0.62)]" />
      )}
      <div className="fixed w-[22rem] max-w-[calc(100vw-2rem)]" style={ubicar(rect)}>
        <div key={paso} ref={tarjeta} className={`rounded-2xl bg-card p-5 text-card-foreground shadow-2xl ${entrada}`}>
          <p className="text-xs font-semibold text-muted-foreground">
            {paso + 1} de {pasos.length}
          </p>
          <h2 id="tutorial-titulo" className="mt-1 text-lg">
            {actual.titulo}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{actual.texto}</p>
          <div className="mt-5 flex items-center justify-end gap-2">
            {ultimo ? (
              <Button variant="outline" size="sm" className="mr-auto" onClick={() => terminar('/importar')}>
                Importar mi Excel
              </Button>
            ) : (
              <Button variant="ghost" size="sm" className="mr-auto text-muted-foreground" onClick={() => terminar()}>
                Saltar
              </Button>
            )}
            {paso > 0 ? (
              <Button variant="outline" size="sm" aria-label="Paso anterior" onClick={() => ir(paso - 1)}>
                <ArrowLeft />
              </Button>
            ) : null}
            <Button size="sm" ref={primario} onClick={() => (ultimo ? terminar('/presupuesto') : ir(paso + 1))}>
              {ultimo ? 'Empezar' : paso === 0 ? 'Ver el recorrido' : 'Siguiente'}
              {ultimo ? null : <ArrowRight />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
