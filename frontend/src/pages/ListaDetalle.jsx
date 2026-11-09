import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useDroppable, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { ArrowDownAZ, ArrowDownNarrowWide, ArrowDownUp, ArrowLeft, ArrowUpWideNarrow, CalendarClock, ChevronDown, Flag, ListPlus, PackageCheck, Search, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { BotonPrivado } from '@/components/BotonPrivado'
import { Campana } from '@/components/Campana'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { ItemDialog } from '@/components/ItemDialog'
import { ListaDialog } from '@/components/ListaDialog'
import { Compositor } from '@/components/listas/Compositor'
import { Confeti } from '@/components/listas/Confeti'
import { FilaItem } from '@/components/listas/FilaItem'
import { ResumenVivo } from '@/components/listas/ResumenVivo'
import { MiembrosDialog } from '@/components/MiembrosDialog'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { hoy } from '@/lib/format'
import { hayOrden, hayPrioridad, moverItem, ordenarItems, pesoPrioridad, permisosDe, reasignarOrden, resumenItems } from '@/lib/listas'
import { cn } from '@/lib/utils'
import { useAuth } from '@/store/auth'
import { useListas } from '@/store/listasContext'

const ZONA_COMPRADOS = 'zona-comprados'
const DURACION_MARCADO = 520
const MIN_ITEMS_BUSQUEDA = 7

const nombreDe = (nombre, email) => nombre || (email ?? '').split('@')[0]

const criterios = [
  { id: 'fecha', icono: CalendarClock, etiqueta: 'Fecha más cercana', comparar: (a, b) => (a.fechaCompra ?? '9999-12-31').localeCompare(b.fechaCompra ?? '9999-12-31') },
  { id: 'prioridad', icono: Flag, etiqueta: 'Prioridad, la más alta primero', conPrioridad: true, comparar: (a, b) => pesoPrioridad(a.prioridad) - pesoPrioridad(b.prioridad) },
  { id: 'precio-asc', icono: ArrowDownNarrowWide, etiqueta: 'Precio, de menor a mayor', comparar: (a, b) => a.precio - b.precio },
  { id: 'precio-desc', icono: ArrowUpWideNarrow, etiqueta: 'Precio, de mayor a menor', comparar: (a, b) => b.precio - a.precio },
  { id: 'nombre', icono: ArrowDownAZ, etiqueta: 'Nombre, de la A a la Z', comparar: (a, b) => a.nombre.localeCompare(b.nombre, 'es') },
]

// Mientras se arrastra aparece esta zona: soltar un ítem aquí lo marca como comprado.
function ZonaComprados({ visible }) {
  const { setNodeRef, isOver } = useDroppable({ id: ZONA_COMPRADOS })
  if (!visible) return null
  return (
    <div
      ref={setNodeRef}
      className={cn('lc-entra flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-5 text-sm font-semibold transition-colors', isOver ? 'border-[var(--lc-ok)] bg-[var(--lc-ok-suave)] text-[var(--lc-ok-texto)]' : 'border-border text-muted-foreground')}
    >
      <PackageCheck className="size-5" aria-hidden="true" /> Suelta aquí para marcarlo como comprado
    </div>
  )
}

export default function ListaDetalle() {
  const { id } = useParams()
  const { state, actions } = useListas()
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [editandoLista, setEditandoLista] = useState(false)
  const [borrandoLista, setBorrandoLista] = useState(false)
  const [verMiembros, setVerMiembros] = useState(false)
  const [itemEnEdicion, setItemEnEdicion] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [recien, setRecien] = useState(() => new Set())
  const [verComprados, setVerComprados] = useState(false)
  const [arrastrando, setArrastrando] = useState(false)
  const [celebracion, setCelebracion] = useState(0)
  const compositor = useRef(null)
  const fin = useRef(null)
  const temporizadores = useRef(new Set())

  const sensores = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))

  const lista = state.listas.find((l) => l.id === id)
  const permisos = permisosDe(lista, state.miembros, usuario.id)

  // El indicador de "Guardando" sube para no quedar tapado por la barra de agregar.
  useEffect(() => {
    document.documentElement.style.setProperty('--guardado-extra', '4.5rem')
    const pendientes = temporizadores.current
    return () => {
      document.documentElement.style.removeProperty('--guardado-extra')
      pendientes.forEach(clearTimeout)
    }
  }, [])

  // Atajo: "n" lleva el cursor a la barra de agregar (si no se está escribiendo en otro campo).
  useEffect(() => {
    if (!permisos.crear) return undefined
    const alTeclear = (e) => {
      const el = e.target
      const escribiendo = el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))
      if (e.key === 'n' && !escribiendo && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        compositor.current?.focus()
      }
    }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [permisos.crear])

  // Si la lista no existe o ya no tienes acceso (la borraron, saliste, te quitaron), se vuelve al listado.
  if (!lista || !permisos.ver) return <Navigate to="/listas" replace />

  const fechaHoy = hoy()
  const items = state.items.filter((i) => i.listaId === lista.id)
  const miembros = state.miembros.filter((m) => m.listaId === lista.id)
  const resumen = resumenItems(items)
  const ordenados = ordenarItems(items)
  const puedeOrdenar = hayOrden(items) && permisos.editar
  const conPrioridad = hayPrioridad(state.items)
  const q = busqueda.trim().toLowerCase()
  const coincide = (i) => !q || i.nombre.toLowerCase().includes(q)
  // Un ítem recién marcado se queda unos instantes en su sección para que se vea la animación antes de pasar a la otra.
  const posicionComprado = (i) => (recien.has(i.id) ? !i.comprado : i.comprado)
  const pendientes = ordenados.filter((i) => !posicionComprado(i) && coincide(i))
  const comprados = ordenados.filter((i) => posicionComprado(i) && coincide(i)).sort((a, b) => (b.compradoEn ?? '').localeCompare(a.compradoEn ?? ''))
  const todoPendiente = ordenados.filter((i) => !i.comprado)
  const aceptados = miembros.filter((m) => m.estado === 'aceptada')
  const personas = [
    { id: lista.propietarioId, nombre: nombreDe(lista.propietarioNombre, lista.propietarioEmail), email: lista.propietarioEmail },
    ...miembros.map((m) => ({ id: m.usuarioId, nombre: nombreDe(m.nombre, m.email), email: m.email, pendiente: m.estado === 'pendiente' })),
  ]
  const detalle = permisos.propietario ? (lista.compartida ? `Tuya · compartida con ${aceptados.length} ${aceptados.length === 1 ? 'persona' : 'personas'}` : 'Solo tuya') : `De ${nombreDe(lista.propietarioNombre, lista.propietarioEmail)}`
  const arrastrable = puedeOrdenar && !q
  const comprasAbiertas = verComprados || q !== '' || (comprados.length > 0 && pendientes.length === 0)

  const programar = (fn, ms) => {
    const t = setTimeout(() => {
      temporizadores.current.delete(t)
      fn()
    }, ms)
    temporizadores.current.add(t)
  }

  const marcar = (itemId, valor) => {
    setRecien((r) => new Set(r).add(itemId))
    actions.marcarComprado(itemId, valor)
    if (valor && todoPendiente.length === 1 && todoPendiente[0].id === itemId) {
      setCelebracion((c) => c + 1)
      programar(() => setCelebracion(0), 1800)
    }
    programar(
      () =>
        setRecien((r) => {
          const nuevo = new Set(r)
          nuevo.delete(itemId)
          return nuevo
        }),
      DURACION_MARCADO,
    )
  }

  const cambiar = (itemId, parcial) => {
    const i = items.find((x) => x.id === itemId)
    if (i) actions.editarItem(itemId, { nombre: i.nombre, precio: i.precio, fechaCompra: i.fechaCompra, prioridad: i.prioridad, ...parcial })
  }

  const agregar = (datos) => {
    actions.agregarItem(lista.id, datos)
    programar(() => fin.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 60)
  }

  const eliminarItem = (item) => {
    actions.eliminarItem(item.id)
    toast(`«${item.nombre}» eliminado`, { action: { label: 'Deshacer', onClick: () => actions.restaurarItem(item) } })
  }

  const ordenarPor = (criterio) => {
    const nuevos = [...todoPendiente].sort(criterio.comparar)
    const compradosEnOrden = ordenados.filter((i) => i.comprado)
    actions.reordenarItems(reasignarOrden([...nuevos, ...compradosEnOrden]))
  }

  const alSoltar = ({ active, over }) => {
    setArrastrando(false)
    if (!over) return
    if (over.id === ZONA_COMPRADOS) {
      marcar(active.id, true)
      return
    }
    if (active.id === over.id) return
    const de = pendientes.findIndex((i) => i.id === active.id)
    const a = pendientes.findIndex((i) => i.id === over.id)
    if (de < 0 || a < 0) return
    const nuevo = arrayMove(pendientes, de, a)
    const posicion = nuevo.findIndex((i) => i.id === active.id)
    const siguiente = nuevo[posicion + 1]
    const anterior = nuevo[posicion - 1]
    const resto = ordenados.filter((i) => i.id !== active.id)
    const destino = siguiente ? resto.findIndex((i) => i.id === siguiente.id) : anterior ? resto.findIndex((i) => i.id === anterior.id) + 1 : 0
    actions.reordenarItems(moverItem(ordenados, active.id, destino))
  }

  const filas = (lista_, { arrastre }) =>
    lista_.map((item, indice) => (
      <FilaItem
        key={item.id}
        item={item}
        indice={indice}
        permisos={permisos}
        fechaHoy={fechaHoy}
        conPrioridad={conPrioridad}
        marcado={item.comprado}
        animar={recien.has(item.id)}
        arrastrable={arrastre}
        onMarcar={marcar}
        onCambiar={cambiar}
        onEditar={setItemEnEdicion}
        onEliminar={eliminarItem}
      />
    ))

  return (
    <div className="lista-viva relative mx-auto grid w-full max-w-3xl gap-5 pb-24">
      <Confeti disparo={celebracion} />

      <div className="flex items-center justify-between gap-3">
        <Link to="/listas" className="inline-flex items-center gap-1.5 rounded-md text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lc-acento)]">
          <ArrowLeft className="size-4" aria-hidden="true" /> Todas las listas
        </Link>
        <span className="hidden items-center gap-2 md:flex">
          <Campana variant="outline" className="bg-card" />
          <BotonPrivado variant="outline" className="bg-card" />
        </span>
      </div>

      <ResumenVivo lista={lista} resumen={resumen} personas={personas} propietario={permisos.propietario} onMiembros={() => setVerMiembros(true)} onEditar={() => setEditandoLista(true)} onEliminar={() => setBorrandoLista(true)} detalle={detalle} />

      {resumen.cantidad > 0 && resumen.cuantosComprados === resumen.cantidad ? (
        <p role="status" className="lc-entra flex items-center gap-2 rounded-2xl bg-[var(--lc-ok-suave)] px-4 py-3 text-sm font-semibold text-[var(--lc-ok-texto)]">
          <Sparkles className="size-4" aria-hidden="true" /> ¡Listo! Compraste todo lo de esta lista.
        </p>
      ) : null}

      {items.length === 0 ? (
        <div className="lc-entra flex flex-col items-center gap-3 rounded-3xl border border-dashed bg-card/50 px-6 py-14 text-center">
          <span className="grid size-16 place-items-center rounded-full bg-[var(--lc-acento-suave)] text-[var(--lc-acento-texto)]">
            <ListPlus className="size-7" aria-hidden="true" />
          </span>
          <h2 className="text-lg font-semibold">Tu lista está vacía</h2>
          <p className="max-w-xs text-sm text-muted-foreground">{permisos.crear ? 'Escribe en la barra de abajo lo que quieres comprar y pulsa Enter. Puedes seguir agregando sin parar.' : 'Quien creó la lista todavía no agrega ítems.'}</p>
        </div>
      ) : (
        <DndContext sensors={sensores} collisionDetection={closestCenter} onDragStart={() => setArrastrando(true)} onDragCancel={() => setArrastrando(false)} onDragEnd={alSoltar}>
          <div className="grid gap-5">
            <section aria-label="Por comprar" className="grid gap-2">
              <div className="flex items-center justify-between gap-2 px-1">
                <h2 className="text-sm font-semibold text-muted-foreground">Por comprar · {pendientes.length}</h2>
                <div className="flex items-center gap-1">
                  {items.length > MIN_ITEMS_BUSQUEDA ? (
                    <label className="relative flex items-center">
                      <Search className="pointer-events-none absolute left-2.5 size-3.5 text-muted-foreground" aria-hidden="true" />
                      <input type="search" aria-label="Buscar en la lista" placeholder="Buscar" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="h-8 w-28 rounded-full border bg-card pr-3 pl-8 text-sm outline-none transition-[width] focus:w-44 focus-visible:border-[var(--lc-acento)]" />
                    </label>
                  ) : null}
                  {puedeOrdenar && todoPendiente.length > 1 ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="sm" aria-label="Ordenar los ítems por comprar" />}>
                        <ArrowDownUp /> <span className="hidden sm:inline">Ordenar</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-auto min-w-64 p-2">
                        <p className="px-2.5 pt-1 pb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Ordenar por</p>
                        {criterios.filter((c) => conPrioridad || !c.conPrioridad).map((c) => (
                          <DropdownMenuItem key={c.id} onClick={() => ordenarPor(c)} className="gap-3 rounded-lg px-2.5 py-2.5 text-sm whitespace-nowrap">
                            <c.icono className="size-4 text-[var(--lc-acento-texto)]" aria-hidden="true" />
                            {c.etiqueta}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
                </div>
              </div>
              {pendientes.length ? (
                <SortableContext items={pendientes.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                  <ul className="grid grid-cols-1 gap-2">{filas(pendientes, { arrastre: arrastrable })}</ul>
                </SortableContext>
              ) : q ? (
                <p className="px-1 py-4 text-sm text-muted-foreground">Nada por comprar coincide con «{busqueda.trim()}».</p>
              ) : null}
              <ZonaComprados visible={arrastrando && permisos.editar} />
            </section>

            {comprados.length ? (
              <section aria-label="Comprados" className="grid gap-2">
                <button
                  type="button"
                  aria-expanded={comprasAbiertas}
                  onClick={() => setVerComprados((v) => !v)}
                  className="flex items-center gap-1.5 self-start rounded-md px-1 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lc-acento)]"
                >
                  <ChevronDown className={cn('size-4 transition-transform duration-300', !comprasAbiertas && '-rotate-90')} aria-hidden="true" /> Comprados · {comprados.length}
                </button>
                <div className={cn('grid transition-[grid-template-rows] duration-300 ease-out', comprasAbiertas ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
                  <div className="overflow-hidden">
                    <ul className="grid grid-cols-1 gap-2 pb-1" inert={!comprasAbiertas || undefined}>
                      {filas(comprados, { arrastre: false })}
                    </ul>
                  </div>
                </div>
              </section>
            ) : null}
          </div>
        </DndContext>
      )}
      <div ref={fin} aria-hidden="true" className="scroll-mb-36" />

      {permisos.crear ? (
        <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-20 md:bottom-6">
          <Compositor ref={compositor} onAgregar={agregar} conPrioridad={conPrioridad} />
        </div>
      ) : (
        <p className="sticky bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-20 mx-auto w-fit rounded-full border bg-card px-4 py-2 text-xs text-muted-foreground shadow-elevated md:bottom-6">
          {permisos.editar || permisos.eliminar ? 'No puedes agregar ítems nuevos a esta lista' : 'Solo puedes ver esta lista'}
        </p>
      )}

      <ListaDialog open={editandoLista} onOpenChange={setEditandoLista} lista={lista} participantes={miembros.length} miCorreo={usuario.email} onGuardar={(datos) => actions.editarLista(lista.id, datos)} />
      <ItemDialog conPrioridad={conPrioridad} open={itemEnEdicion !== null} onOpenChange={(abierto) => !abierto && setItemEnEdicion(null)} item={itemEnEdicion} onGuardar={(datos) => actions.editarItem(itemEnEdicion.id, datos)} />
      <MiembrosDialog open={verMiembros} onOpenChange={setVerMiembros} lista={lista} miembros={miembros} soyPropietario={permisos.propietario} acciones={actions} />
      <ConfirmDialog
        open={borrandoLista}
        onOpenChange={setBorrandoLista}
        title={`¿Eliminar «${lista.nombre}»?`}
        description={`Se elimina la lista con sus ${items.length} ${items.length === 1 ? 'ítem' : 'ítems'}${miembros.length ? ` y deja de estar disponible para ${miembros.length === 1 ? 'la persona con la que la compartes' : `las ${miembros.length} personas con las que la compartes`}` : ''}. No afecta tus saldos. Esta acción no se puede deshacer.`}
        onConfirm={() => {
          setBorrandoLista(false)
          actions.eliminarLista(lista.id)
          navigate('/listas')
        }}
      />
    </div>
  )
}
