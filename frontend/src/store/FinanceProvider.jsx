import { LoaderCircle } from 'lucide-react'
import { useEffect, useMemo, useReducer, useRef } from 'react'
import { toast } from 'sonner'
import { movimientoDesdeRecurrente } from '@/lib/calc'
import * as repo from '@/lib/repo'
import { useAuth } from './auth'
import { FinanceContext } from './context'
import { estadoVacio, reducer } from './reducer'

const ESPERA_ESCRITURA = 600

export function FinanceProvider({ children }) {
  const { usuario } = useAuth()
  const [state, dispatch] = useReducer(reducer, estadoVacio)
  const estadoRef = useRef(estadoVacio)
  const temporizadores = useRef(new Map())

  useEffect(() => {
    estadoRef.current = state
  }, [state])

  useEffect(() => {
    if (!usuario) return undefined
    let vigente = true
    repo
      .cargarTodo()
      .then((datos) => vigente && dispatch({ type: 'cargar', datos }))
      .catch(() => toast.error('No se pudieron cargar tus datos. Revisa la conexión y recarga la página.'))
    return () => {
      vigente = false
    }
  }, [usuario])

  const actions = useMemo(() => {
    const recargar = () => repo.cargarTodo().then((datos) => dispatch({ type: 'cargar', datos }))
    const ejecutar = (acciones, peticion) => {
      ;[].concat(acciones).forEach(dispatch)
      peticion().catch(() => {
        toast.error('No se pudo guardar el cambio. Se restauraron los datos.')
        recargar()
      })
    }
    const programar = (id, peticion) => {
      clearTimeout(temporizadores.current.get(id))
      temporizadores.current.set(
        id,
        setTimeout(() => {
          temporizadores.current.delete(id)
          peticion().catch(() => toast.error('No se pudo guardar el cambio.'))
        }, ESPERA_ESCRITURA),
      )
    }
    const nuevoItem = (lista, datos) => {
      const item = { ...datos, id: crypto.randomUUID() }
      if (lista === 'movimientos') item.consecutivo = estadoRef.current.movimientos.reduce((n, m) => Math.max(n, m.consecutivo), 0) + 1
      if (lista === 'categorias' && !datos.padreId) {
        const hermanas = estadoRef.current.categorias.filter((c) => c.tipo === datos.tipo && !c.padreId)
        item.orden = hermanas.length ? Math.max(...hermanas.map((c) => c.orden ?? 0)) + 1 : 0
      }
      return item
    }
    const agregarItem = (lista, datos) => {
      const item = nuevoItem(lista, datos)
      ejecutar({ type: 'agregar', lista, datos: item }, () => repo.insertar(lista, item))
    }
    return {
      recargar,
      setPeriodo: (periodo) => dispatch({ type: 'periodo', periodo }),
      agregar: agregarItem,
      editar: (lista, id, datos) => ejecutar({ type: 'editar', lista, id, datos }, () => repo.actualizar(lista, id, datos)),
      eliminar: (lista, id) => ejecutar({ type: 'eliminar', lista, id }, () => repo.eliminar(lista, id)),
      setPresupuesto: (mes, id, valor) => {
        const { anio } = estadoRef.current
        dispatch({ type: 'presupuesto', meses: [mes], id, valor })
        programar(`p-${mes}-${id}`, () => repo.guardarPresupuestos(anio, [mes], id, valor))
      },
      copiarPresupuesto: (mes, id, valor) => {
        const meses = Array.from({ length: 12 - mes }, (_, i) => mes + i)
        ejecutar({ type: 'presupuesto', meses, id, valor }, () => repo.guardarPresupuestos(estadoRef.current.anio, meses, id, valor))
      },
      setSaldo: (mes, id, valor) => {
        const { anio } = estadoRef.current
        dispatch({ type: 'saldo', mes, id, valor })
        programar(`s-${mes}-${id}`, () => repo.guardarSaldo(anio, mes, id, valor))
      },
      setNota: (mes, texto) => {
        const { anio } = estadoRef.current
        dispatch({ type: 'nota', mes, texto })
        programar(`n-${mes}`, () => repo.guardarNota(anio, mes, texto))
      },
      agregarConRecurrencia: (datos) => {
        const recurrente = { id: crypto.randomUUID(), tipo: datos.tipo, categoriaId: datos.categoriaId, concepto: datos.concepto, valor: datos.valor, dia: Number(datos.fecha.slice(8, 10)), activo: true }
        const movimiento = nuevoItem('movimientos', { ...datos, recurrenteId: recurrente.id })
        ejecutar(
          [
            { type: 'agregar', lista: 'recurrentes', datos: recurrente },
            { type: 'agregar', lista: 'movimientos', datos: movimiento },
          ],
          () => repo.insertar('recurrentes', recurrente).then(() => repo.insertar('movimientos', movimiento)),
        )
      },
      aplicarRecurrente: (recurrente, mes) => agregarItem('movimientos', movimientoDesdeRecurrente(recurrente, estadoRef.current.anio, mes)),
      omitir: (mes, id) => ejecutar({ type: 'omitir', mes, id }, () => repo.omitir(estadoRef.current.anio, mes, id)),
      reordenar: (actualizaciones) => ejecutar({ type: 'reordenar', actualizaciones }, () => repo.reordenarCategorias(actualizaciones)),
      borrarTodo: () => repo.borrarTodo().then(recargar),
    }
  }, [])

  if (usuario && !state.cargado) {
    return (
      <div className="grid min-h-svh place-items-center text-muted-foreground" role="status" aria-live="polite">
        <LoaderCircle className="size-8 animate-spin text-leaf" aria-hidden="true" />
        <span className="sr-only">Cargando tus datos</span>
      </div>
    )
  }

  return <FinanceContext value={{ state, actions }}>{children}</FinanceContext>
}
