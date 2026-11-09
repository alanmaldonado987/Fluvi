import { LoaderCircle } from 'lucide-react'
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { toast } from 'sonner'
import { comenzarGuardado, terminarGuardado } from '@/lib/guardado'
import { refrescarInvitaciones } from '@/lib/invitaciones'
import { faltaMigracion } from '@/lib/listas'
import * as repo from '@/lib/listasRepo'
import { useAuth } from './auth'
import { ListasContext } from './listasContext'
import { estadoInicialListas, listasReducer } from './listasReducer'

const CADA_MS = 20 * 1000

// Estado del módulo de listas. Se monta solo en las pantallas de listas, así el resto de la app no carga nada de esto.
// Los cambios se ven al instante y se guardan en segundo plano; si el guardado falla se vuelve a cargar lo que hay en el
// servidor. Si alguna lista es compartida, se vuelve a leer cada pocos segundos para ver lo que cambian los demás.
export function ListasProvider({ children }) {
  const { usuario } = useAuth()
  const [state, dispatch] = useReducer(listasReducer, estadoInicialListas)
  const [error, setError] = useState(null)
  const estadoRef = useRef(estadoInicialListas)
  const enVuelo = useRef(0)

  useEffect(() => {
    estadoRef.current = state
  }, [state])

  const recargar = useCallback(() => repo.cargarListas().then((datos) => dispatch({ type: 'cargar', datos })), [])

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

  // Tiempo real: Supabase avisa por websocket cuando algo cambia y la app vuelve a leer. Se espera un instante para agrupar
  // varios avisos seguidos y no se relee mientras haya cambios propios sin guardar (para no pisarlos).
  const [conectado, setConectado] = useState(false)
  useEffect(() => {
    if (!state.cargado) return undefined
    let espera = null
    const intentar = () => {
      if (enVuelo.current > 0) espera = setTimeout(intentar, 400)
      else recargar().catch(() => {})
    }
    const alCambiar = () => {
      clearTimeout(espera)
      espera = setTimeout(intentar, 300)
    }
    const darseDeBaja = repo.suscribirCambios(alCambiar, setConectado)
    return () => {
      clearTimeout(espera)
      darseDeBaja()
      setConectado(false)
    }
  }, [state.cargado, recargar])

  // Respaldo: si el websocket no está conectado y hay listas compartidas, se relee cada pocos segundos.
  const hayCompartidas = state.listas.some((l) => l.compartida)
  useEffect(() => {
    if (!state.cargado || !hayCompartidas || conectado) return undefined
    const releer = () => {
      if (document.visibilityState === 'visible' && enVuelo.current === 0) recargar().catch(() => {})
    }
    const id = setInterval(releer, CADA_MS)
    document.addEventListener('visibilitychange', releer)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', releer)
    }
  }, [state.cargado, hayCompartidas, conectado, recargar])

  const actions = useMemo(() => {
    const yo = { id: usuario.id, nombre: usuario.nombre, email: usuario.email }
    const alFallar = () => {
      terminarGuardado(false)
      enVuelo.current--
      toast.error('No se pudo guardar el cambio. Se restauraron los datos.')
      recargar().catch(() => {})
    }
    // Aplica el cambio en pantalla y lo guarda; el indicador de guardado de la app cuenta cada guardado.
    const ejecutar = (acciones, peticion) => {
      ;[].concat(acciones).forEach(dispatch)
      comenzarGuardado()
      enVuelo.current++
      peticion().then(() => {
        terminarGuardado(true)
        enVuelo.current--
      }, alFallar)
    }
    const nuevoId = () => crypto.randomUUID()

    return {
      recargar,
      crearLista: ({ nombre, compartida }) => {
        const lista = { id: nuevoId(), nombre: nombre.trim(), compartida: Boolean(compartida), propietarioId: yo.id, propietarioNombre: yo.nombre, propietarioEmail: yo.email }
        ejecutar({ type: 'agregarLista', lista }, () => repo.crearLista(lista))
        return lista.id
      },
      // Dejar de compartir también saca a todos los participantes.
      editarLista: (id, { nombre, compartida }) => {
        const actual = estadoRef.current.listas.find((l) => l.id === id)
        if (!actual) return
        const datos = { nombre: nombre.trim(), compartida: Boolean(compartida) }
        const acciones = [{ type: 'editarLista', id, datos }]
        const dejaDeCompartir = actual.compartida && !datos.compartida
        if (dejaDeCompartir) acciones.push({ type: 'quitarMiembros', listaId: id })
        ejecutar(acciones, () => repo.actualizarLista(id, datos).then(() => (dejaDeCompartir ? repo.quitarMiembros(id) : undefined)))
      },
      eliminarLista: (id) => ejecutar({ type: 'quitarLista', id }, () => repo.eliminarLista(id)),
      agregarItem: (listaId, { nombre, precio, fechaCompra }) => {
        const item = { id: nuevoId(), listaId, nombre: nombre.trim(), precio: precio || 0, fechaCompra: fechaCompra || null, comprado: false, compradoEn: null, creadoPor: yo.id }
        ejecutar({ type: 'agregarItem', item }, () => repo.crearItem(item))
      },
      editarItem: (id, { nombre, precio, fechaCompra }) => {
        const datos = { nombre: nombre.trim(), precio: precio || 0, fechaCompra: fechaCompra || null }
        ejecutar({ type: 'editarItem', id, datos }, () => repo.actualizarItem(id, datos))
      },
      marcarComprado: (id, comprado) => {
        const datos = { comprado, compradoEn: comprado ? new Date().toISOString() : null }
        ejecutar({ type: 'editarItem', id, datos }, () => repo.actualizarItem(id, datos))
      },
      eliminarItem: (id) => ejecutar({ type: 'quitarItem', id }, () => repo.eliminarItem(id)),
      // Deshacer un borrado: vuelve a crear el ítem con los mismos datos.
      restaurarItem: (item) => ejecutar({ type: 'agregarItem', item }, () => repo.crearItem(item)),
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
  }, [usuario.id, usuario.nombre, usuario.email, recargar])

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
