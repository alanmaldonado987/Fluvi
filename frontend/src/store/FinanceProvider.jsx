import { useEffect, useMemo, useReducer, useRef } from 'react'
import { toast } from 'sonner'
import { movimientoDesdeRecurrente } from '@/lib/calc'
import { comenzarGuardado, terminarGuardado } from '@/lib/guardado'
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
    const cargar = (intento = 0) =>
      repo
        .cargarTodo()
        .then((datos) => vigente && dispatch({ type: 'cargar', datos }))
        .catch(() => {
          if (!vigente) return
          if (intento < 2) setTimeout(() => vigente && cargar(intento + 1), 1500)
          else toast.error('No se pudieron cargar tus datos. Revisa la conexión y recarga la página.')
        })
    cargar()
    return () => {
      vigente = false
    }
  }, [usuario])

  const actions = useMemo(() => {
    const recargar = () => repo.cargarTodo().then((datos) => dispatch({ type: 'cargar', datos }))
    // Cada guardado avisa al indicador (Guardando, Guardado o error). Si falla, se vuelve a cargar lo que hay en el servidor
    // para que la pantalla no muestre un valor que nunca se guardó.
    const alFallar = () => {
      terminarGuardado(false)
      toast.error('No se pudo guardar el cambio. Se restauraron los datos.')
      recargar().catch(() => {})
    }
    const ejecutar = (acciones, peticion) => {
      ;[].concat(acciones).forEach(dispatch)
      comenzarGuardado()
      peticion().then(() => terminarGuardado(true), alFallar)
    }
    // Los cambios de presupuesto, saldos y notas se agrupan unos instantes antes de guardarse; el indicador cuenta desde que se
    // programan. `enviar` los manda y cierra ese guardado.
    const enviar = (peticion) => peticion().then(() => terminarGuardado(true), alFallar)
    const programar = (id, peticion) => {
      if (!temporizadores.current.has(id)) comenzarGuardado()
      clearTimeout(temporizadores.current.get(id)?.temporizador)
      const temporizador = setTimeout(() => {
        temporizadores.current.delete(id)
        enviar(peticion)
      }, ESPERA_ESCRITURA)
      temporizadores.current.set(id, { temporizador, peticion })
    }
    // Envía ya los cambios que aún esperan (al ocultar o cerrar la pestaña), para que no se pierdan.
    const guardarPendientes = () => {
      for (const { temporizador, peticion } of temporizadores.current.values()) {
        clearTimeout(temporizador)
        enviar(peticion)
      }
      temporizadores.current.clear()
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
      guardarPendientes,
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
      editarDeuda: (id, datos) => {
        const movOriginal = estadoRef.current.movimientos.find((m) => m.deudaId === id && m.tipo === 'Egreso')
        const datosDeuda = { persona: datos.persona, valor: datos.valor, billeteraId: datos.billeteraId, concepto: datos.concepto, fecha: datos.fecha }
        const accs = [{ type: 'editar', lista: 'deudas', id, datos: datosDeuda }]
        if (movOriginal) {
          const datosMov = { valor: datos.valor, billeteraId: datos.billeteraId, fecha: datos.fecha, concepto: datos.concepto || `Préstamo a ${datos.persona}` }
          accs.push({ type: 'editar', lista: 'movimientos', id: movOriginal.id, datos: datosMov })
        }
        ejecutar(accs, () => {
          const p = repo.actualizar('deudas', id, datosDeuda)
          return movOriginal
            ? p.then(() => repo.actualizar('movimientos', movOriginal.id, { valor: datos.valor, billeteraId: datos.billeteraId, fecha: datos.fecha, concepto: datos.concepto || `Préstamo a ${datos.persona}` }))
            : p
        })
      },
      // Cambia las fechas de una deuda ya pagada y mueve con ellas sus movimientos, para que cuenten en el mes correcto:
      //  - fecha: la del préstamo; mueve el egreso del préstamo.
      //  - fechaPago: la del cobro; mueve el ingreso del cobro. Con abonos, es el que completó el pago (el que tiene la
      //    fecha de pago); si no se encuentra, el más reciente.
      editarFechasDeuda: (deudaId, { fecha, fechaPago }) => {
        const { deudas, movimientos } = estadoRef.current
        const deuda = deudas.find((d) => d.id === deudaId)
        if (!deuda) return
        const masReciente = (a, b) => b.fecha.localeCompare(a.fecha) || b.consecutivo - a.consecutivo
        const delaDeuda = movimientos.filter((m) => m.deudaId === deudaId)
        const cambios = [{ lista: 'deudas', id: deudaId, datos: {} }]
        if (fecha && fecha !== deuda.fecha) {
          cambios[0].datos.fecha = fecha
          const prestamo = delaDeuda.find((m) => m.tipo === 'Egreso')
          if (prestamo) cambios.push({ lista: 'movimientos', id: prestamo.id, datos: { fecha } })
        }
        if (fechaPago && fechaPago !== deuda.fechaPago) {
          cambios[0].datos.fechaPago = fechaPago
          const ingresos = delaDeuda.filter((m) => m.tipo === 'Ingreso')
          const cobro = ingresos.filter((m) => m.fecha === deuda.fechaPago).sort(masReciente)[0] ?? [...ingresos].sort(masReciente)[0]
          if (cobro) cambios.push({ lista: 'movimientos', id: cobro.id, datos: { fecha: fechaPago } })
        }
        if (!Object.keys(cambios[0].datos).length) return
        ejecutar(
          cambios.map((c) => ({ type: 'editar', ...c })),
          () => cambios.reduce((p, c) => p.then(() => repo.actualizar(c.lista, c.id, c.datos)), Promise.resolve()),
        )
      },
      prestar: (datos) => {
        const deuda = { id: crypto.randomUUID(), ...datos, pagada: false }
        const movimiento = nuevoItem('movimientos', {
          fecha: datos.fecha,
          tipo: 'Egreso',
          categoriaId: null,
          valor: datos.valor,
          concepto: datos.concepto || `Préstamo a ${datos.persona}`,
          observacion: '',
          billeteraId: datos.billeteraId,
          deudaId: deuda.id,
        })
        ejecutar(
          [
            { type: 'agregar', lista: 'deudas', datos: deuda },
            { type: 'agregar', lista: 'movimientos', datos: movimiento },
          ],
          () => repo.insertar('deudas', deuda).then(() => repo.insertar('movimientos', movimiento)),
        )
      },
      cobrar: (deudaId, billetePagoId, fecha, monto) => {
        const deuda = estadoRef.current.deudas.find((d) => d.id === deudaId)
        if (!deuda) return
        const abonado = estadoRef.current.movimientos.filter((m) => m.deudaId === deudaId && m.tipo === 'Ingreso').reduce((t, m) => t + m.valor, 0)
        const pagaCompleta = abonado + monto >= deuda.valor
        const movimiento = nuevoItem('movimientos', {
          fecha,
          tipo: 'Ingreso',
          categoriaId: null,
          valor: monto,
          concepto: pagaCompleta ? `Pago de ${deuda.persona}` : `Abono de ${deuda.persona}`,
          observacion: '',
          billeteraId: billetePagoId,
          deudaId: deuda.id,
        })
        const acciones = [{ type: 'agregar', lista: 'movimientos', datos: movimiento }]
        if (pagaCompleta) acciones.push({ type: 'editar', lista: 'deudas', id: deudaId, datos: { pagada: true, billetePagoId, fechaPago: fecha } })
        ejecutar(acciones, () => {
          const p = repo.insertar('movimientos', movimiento)
          return pagaCompleta ? p.then(() => repo.actualizar('deudas', deudaId, { pagada: true, billetePagoId, fechaPago: fecha })) : p
        })
      },
      borrarTodo: () => repo.borrarTodo().then(recargar),
    }
  }, [])

  useEffect(() => {
    const alOcultar = () => {
      if (document.visibilityState === 'hidden') actions.guardarPendientes()
    }
    document.addEventListener('visibilitychange', alOcultar)
    window.addEventListener('pagehide', actions.guardarPendientes)
    return () => {
      document.removeEventListener('visibilitychange', alOcultar)
      window.removeEventListener('pagehide', actions.guardarPendientes)
    }
  }, [actions])

  if (usuario && !state.cargado) {
    return (
      <div className="min-h-svh md:grid md:grid-cols-[16rem_minmax(0,1fr)]" role="status" aria-live="polite">
        <div className="hidden border-r bg-card md:block" aria-hidden="true" />
        <div className="mx-auto grid w-full max-w-[1800px] content-start gap-5 px-4 pt-16 md:px-6 md:py-6 xl:px-10" aria-hidden="true">
          <div className="h-9 w-44 animate-pulse rounded-xl bg-muted" />
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
            <div className="col-span-2 h-28 animate-pulse rounded-2xl bg-muted" />
            <div className="h-28 animate-pulse rounded-2xl bg-muted" />
            <div className="h-28 animate-pulse rounded-2xl bg-muted" />
            <div className="col-span-2 h-28 animate-pulse rounded-2xl bg-muted xl:col-span-1" />
          </div>
          <div className="grid gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <div className="h-72 animate-pulse rounded-2xl bg-muted" />
            <div className="h-72 animate-pulse rounded-2xl bg-muted" />
          </div>
        </div>
        <span className="sr-only">Cargando tus datos</span>
      </div>
    )
  }

  return <FinanceContext value={{ state, actions }}>{children}</FinanceContext>
}
