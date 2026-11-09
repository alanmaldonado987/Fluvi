import { LoaderCircle } from 'lucide-react'
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { toast } from 'sonner'
import { comenzarGuardado, terminarGuardado } from '@/lib/guardado'
import { refrescarInvitaciones } from '@/lib/invitaciones'
import { faltaMigracion, hayOrden } from '@/lib/listas'
import * as repo from '@/lib/listasRepo'
import { useAuth } from './auth'
import { ListasContext } from './listasContext'
import { estadoInicialListas, listasReducer } from './listasReducer'

const CADA_MS = 20 * 1000
// Con el websocket conectado basta una relectura lenta de seguridad: un canal puede quedar conectado sin recibir avisos.
const CADA_MS_SEGURIDAD = 60 * 1000

// Estado del módulo de listas. Se monta solo en las pantallas de listas, así el resto de la app no carga nada de esto.
// Los cambios se ven al instante y se guardan en segundo plano, de uno en uno y en el orden en que se hicieron (así crear una
// lista y borrarla enseguida no se cruzan). Tras cada guardado se confirma con una lectura del servidor, y una lectura que
// empezó antes de un cambio propio se descarta por vieja, para que la pantalla nunca vuelva a mostrar algo ya borrado.
// Además se escuchan los cambios de otras personas por websocket, con una relectura periódica de respaldo.
export function ListasProvider({ children }) {
  const { usuario } = useAuth()
  const [state, dispatch] = useReducer(listasReducer, estadoInicialListas)
  const [error, setError] = useState(null)
  const estadoRef = useRef(estadoInicialListas)
  const enVuelo = useRef(0)
  const version = useRef(0)
  const cola = useRef(Promise.resolve())
  const espera = useRef(null)

  useEffect(() => {
    estadoRef.current = state
  }, [state])

  const recargar = useCallback(() => {
    const inicio = version.current
    return repo.cargarListas().then((datos) => {
      // Si hubo cambios propios mientras se leía, esa lectura puede estar vieja: se descarta y la relectura que sigue a cada
      // guardado la reemplaza.
      if (version.current === inicio) dispatch({ type: 'cargar', datos })
    })
  }, [])

  // Vuelve a leer en un momento: agrupa varios avisos seguidos y espera a que terminen los guardados propios.
  const programarRelectura = useCallback(() => {
    clearTimeout(espera.current)
    const intentar = () => {
      if (enVuelo.current > 0) espera.current = setTimeout(intentar, 400)
      else recargar().catch(() => {})
    }
    espera.current = setTimeout(intentar, 300)
  }, [recargar])

  useEffect(() => {
    let vigente = true
    const cargar = (intento = 0) =>
      recargar().catch((err) => {
        if (!vigente) return
        if (faltaMigracion(err)) setError('migracion')
        else if (intento < 2) setTimeout(() => vigente && cargar(intento + 1), 1500)
        else setError('carga')
      })
    cargar()
    return () => {
      vigente = false
    }
  }, [recargar])

  // Tiempo real: Supabase avisa por websocket cuando algo cambia y la app vuelve a leer.
  const [conectado, setConectado] = useState(false)
  useEffect(() => {
    if (!state.cargado) return undefined
    const darseDeBaja = repo.suscribirCambios(programarRelectura, setConectado)
    return () => {
      clearTimeout(espera.current)
      darseDeBaja()
      setConectado(false)
    }
  }, [state.cargado, programarRelectura])

  // Respaldo: con listas compartidas se relee cada cierto tiempo (cada pocos segundos si el websocket no está conectado).
  const hayCompartidas = state.listas.some((l) => l.compartida)
  useEffect(() => {
    if (!state.cargado || !hayCompartidas) return undefined
    const releer = () => {
      if (document.visibilityState === 'visible' && enVuelo.current === 0) recargar().catch(() => {})
    }
    const id = setInterval(releer, conectado ? CADA_MS_SEGURIDAD : CADA_MS)
    document.addEventListener('visibilitychange', releer)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', releer)
    }
  }, [state.cargado, hayCompartidas, conectado, recargar])

  const actions = useMemo(() => {
    const yo = { id: usuario.id, nombre: usuario.nombre, email: usuario.email }
    const alFallar = () => {
      version.current++
      terminarGuardado(false)
      enVuelo.current--
      toast.error('No se pudo guardar el cambio. Se restauraron los datos.')
      recargar().catch(() => {})
    }
    // Aplica el cambio en pantalla y lo guarda; el indicador de guardado de la app cuenta cada guardado. Los guardados salen en
    // fila, en orden: así un borrado nunca llega al servidor antes que la creación que lo precede.
    const ejecutar = (acciones, peticion) => {
      ;[].concat(acciones).forEach(dispatch)
      comenzarGuardado()
      enVuelo.current++
      version.current++
      cola.current = cola.current
        .then(() => peticion())
        .then(() => {
          version.current++
          terminarGuardado(true)
          enVuelo.current--
          programarRelectura()
        }, alFallar)
    }
    const nuevoId = () => crypto.randomUUID()

    // Invita a varias personas justo después de que la lista quede guardada. Va en la misma fila de guardados, así la lista
    // ya existe en el servidor cuando llegan las invitaciones. `listoPara()` dice si el paso anterior salió bien.
    const invitarDespues = (listaId, correos, listoPara) => {
      if (!correos?.length) return
      cola.current = cola.current.then(async () => {
        if (!listoPara()) return
        const fallidos = []
        for (const email of correos) {
          try {
            await repo.invitar(listaId, email)
          } catch (err) {
            fallidos.push({ email, mensaje: err?.message || 'No se pudo invitar' })
          }
        }
        const enviadas = correos.length - fallidos.length
        if (enviadas > 0) {
          const porCorreo = await repo.enviarCorreoInvitacion(listaId)
          toast.success(`${enviadas === 1 ? 'Invitación enviada' : `${enviadas} invitaciones enviadas`}. ${porCorreo ? 'También avisamos por correo.' : 'Las verán al abrir Fluvi.'}`)
        }
        for (const f of fallidos) toast.error(`${f.email}: ${f.mensaje}`)
        programarRelectura()
      })
    }

    return {
      recargar,
      // Si se comparte, `correos` son las personas a invitar: se invitan en cuanto la lista queda guardada.
      crearLista: ({ nombre, compartida, correos = [] }) => {
        const lista = { id: nuevoId(), nombre: nombre.trim(), compartida: Boolean(compartida), propietarioId: yo.id, propietarioNombre: yo.nombre, propietarioEmail: yo.email, propietarioAvatar: usuario.avatar }
        let creada = false
        ejecutar({ type: 'agregarLista', lista }, () => repo.crearLista(lista).then(() => (creada = true)))
        if (lista.compartida) invitarDespues(lista.id, correos, () => creada)
        return lista.id
      },
      // Dejar de compartir también saca a todos los participantes.
      editarLista: (id, { nombre, compartida, correos = [] }) => {
        const actual = estadoRef.current.listas.find((l) => l.id === id)
        if (!actual) return
        const datos = { nombre: nombre.trim(), compartida: Boolean(compartida) }
        const acciones = [{ type: 'editarLista', id, datos }]
        const dejaDeCompartir = actual.compartida && !datos.compartida
        const empiezaACompartir = !actual.compartida && datos.compartida
        if (dejaDeCompartir) acciones.push({ type: 'quitarMiembros', listaId: id })
        let guardada = false
        ejecutar(acciones, () => repo.actualizarLista(id, datos).then(() => (dejaDeCompartir ? repo.quitarMiembros(id) : undefined)).then(() => (guardada = true)))
        if (empiezaACompartir) invitarDespues(id, correos, () => guardada)
      },
      eliminarLista: (id) => ejecutar({ type: 'quitarLista', id }, () => repo.eliminarLista(id)),
      agregarItem: (listaId, { nombre, precio, fechaCompra, prioridad }) => {
        const item = { id: nuevoId(), listaId, nombre: nombre.trim(), precio: precio || 0, fechaCompra: fechaCompra || null, prioridad: prioridad || null, comprado: false, compradoEn: null, creadoPor: yo.id, orden: Date.now() / 1000 }
        ejecutar({ type: 'agregarItem', item }, () => repo.crearItem(item))
      },
      editarItem: (id, { nombre, precio, fechaCompra, prioridad }) => {
        const datos = { nombre: nombre.trim(), precio: precio || 0, fechaCompra: fechaCompra || null }
        if (prioridad !== undefined) datos.prioridad = prioridad || null
        ejecutar({ type: 'editarItem', id, datos }, () => repo.actualizarItem(id, datos))
      },
      marcarComprado: (id, comprado) => {
        const datos = { comprado, compradoEn: comprado ? new Date().toISOString() : null }
        ejecutar({ type: 'editarItem', id, datos }, () => repo.actualizarItem(id, datos))
      },
      eliminarItem: (id) => ejecutar({ type: 'quitarItem', id }, () => repo.eliminarItem(id)),
      // Mueve ítems de lugar: `cambios` es [{ id, orden }] (ver moverItem y reasignarOrden en lib/listas.js).
      reordenarItems: (cambios) => {
        if (!cambios.length) return
        ejecutar(
          cambios.map((c) => ({ type: 'editarItem', id: c.id, datos: { orden: c.orden } })),
          () => Promise.all(cambios.map((c) => repo.actualizarItem(c.id, { orden: c.orden }))),
        )
      },
      // Deshacer un borrado: vuelve a crear el ítem con los mismos datos.
      restaurarItem: (item) => ejecutar({ type: 'agregarItem', item }, () => repo.crearItem(item, hayOrden(estadoRef.current.items))),
      // La invitación la resuelve el servidor (busca al usuario por su correo), así que no hay cambio optimista: si falla,
      // el mensaje llega a quien la llamó para mostrarlo en el diálogo. Después se pide el correo de aviso (un extra): devuelve
      // { correo } para saber si salió.
      invitar: async (listaId, email) => {
        await repo.invitar(listaId, email)
        const [correo] = await Promise.all([repo.enviarCorreoInvitacion(listaId), recargar()])
        return { correo }
      },
      cambiarPermisos: (listaId, usuarioId, permisos) =>
        ejecutar(
          { type: 'editarMiembro', listaId, usuarioId, datos: { puedeCrear: permisos.crear, puedeEditar: permisos.editar, puedeEliminar: permisos.eliminar } },
          () => repo.cambiarPermisos(listaId, usuarioId, permisos),
        ),
      quitarMiembro: (listaId, usuarioId) => ejecutar({ type: 'quitarMiembro', listaId, usuarioId }, () => repo.quitarMiembro(listaId, usuarioId)),
      salirDeLista: (listaId) => ejecutar({ type: 'quitarLista', id: listaId }, () => repo.quitarMiembro(listaId, yo.id)),
      responderInvitacion: async (listaId, aceptar) => {
        await repo.responderInvitacion(listaId, aceptar)
        await Promise.all([recargar(), refrescarInvitaciones()])
      },
    }
  }, [usuario.id, usuario.nombre, usuario.email, usuario.avatar, recargar, programarRelectura])

  if (error) {
    return (
      <div className="grid gap-2 rounded-2xl border border-dashed bg-card/40 p-8 text-center" role="alert">
        <h2 className="text-lg">{error === 'migracion' ? 'El módulo de listas aún no está instalado' : 'No se pudieron cargar tus listas'}</h2>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          {error === 'migracion'
            ? 'Falta aplicar la migración 20261109120000_listas_compras.sql en el SQL Editor de Supabase. Cuando esté aplicada, recarga esta página.'
            : 'Revisa la conexión y recarga la página.'}
        </p>
      </div>
    )
  }
  if (!state.cargado) {
    return (
      <div className="grid min-h-60 place-items-center" role="status">
        <LoaderCircle className="size-7 animate-spin text-leaf" aria-hidden="true" />
        <span className="sr-only">Cargando tus listas</span>
      </div>
    )
  }
  return <ListasContext value={{ state, actions }}>{children ?? <Outlet />}</ListasContext>
}
