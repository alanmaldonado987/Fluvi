import { ArrowLeft, CalendarDays, CircleCheck, Clock, Pencil, Plus, ShoppingCart, Trash2, Users } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { ItemDialog } from '@/components/ItemDialog'
import { ListaDialog } from '@/components/ListaDialog'
import { MiembrosDialog } from '@/components/MiembrosDialog'
import { Money } from '@/components/Money'
import { MoneyInput } from '@/components/MoneyInput'
import { PageHeader } from '@/components/PageHeader'
import { Panel } from '@/components/Panel'
import { StatCard } from '@/components/StatCard'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { estaVencido, permisosDe, resumenItems } from '@/lib/listas'
import { fechaCorta, hoy } from '@/lib/format'
import { entrada, escalonado } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { useAuth } from '@/store/auth'
import { useListas } from '@/store/listasContext'

const nombreDe = (nombre, email) => nombre || email.split('@')[0]

const porFecha = (a, b) => (a.fechaCompra ?? '9999-12-31').localeCompare(b.fechaCompra ?? '9999-12-31')

function FilaItem({ item, permisos, fechaHoy, onMarcar, onEditar, onEliminar, indice }) {
  const vencido = estaVencido(item, fechaHoy)
  const esHoy = item.fechaCompra === fechaHoy && !item.comprado
  return (
    <li className={cn('flex items-center gap-3 py-2.5', entrada)} style={escalonado(Math.min(indice, 8))}>
      <Checkbox checked={item.comprado} disabled={!permisos.editar} onCheckedChange={(valor) => onMarcar(item.id, Boolean(valor))} aria-label={`${item.comprado ? 'Desmarcar' : 'Marcar como comprado'}: ${item.nombre}`} className="size-5" />
      <div className="min-w-0 flex-1">
        <p className={cn('truncate font-medium', item.comprado && 'text-muted-foreground line-through')}>{item.nombre}</p>
        {item.fechaCompra ? (
          <p className={cn('mt-0.5 flex items-center gap-1 text-xs', vencido ? 'font-semibold text-negative' : esHoy ? 'font-semibold text-forest' : 'text-muted-foreground')}>
            <CalendarDays className="size-3" aria-hidden="true" />
            {fechaCorta(item.fechaCompra)}
            {vencido ? ' · Vencido' : esHoy ? ' · Hoy' : ''}
          </p>
        ) : null}
      </div>
      <Money value={item.precio} className={cn('shrink-0 text-sm font-semibold', item.comprado && 'text-muted-foreground')} />
      <span className="flex shrink-0">
        {permisos.editar ? (
          <Button variant="ghost" size="icon" className="size-8" aria-label={`Editar ${item.nombre}`} onClick={() => onEditar(item)}>
            <Pencil />
          </Button>
        ) : null}
        {permisos.eliminar ? (
          <Button variant="ghost" size="icon" className="size-8" aria-label={`Eliminar ${item.nombre}`} onClick={() => onEliminar(item)}>
            <Trash2 />
          </Button>
        ) : null}
      </span>
    </li>
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
  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState(0)
  const [fecha, setFecha] = useState('')
  const entradaNombre = useRef(null)

  const lista = state.listas.find((l) => l.id === id)
  const permisos = permisosDe(lista, state.miembros, usuario.id)
  // Si la lista no existe o ya no tienes acceso (la borraron, saliste, te quitaron), se vuelve al listado.
  if (!lista || !permisos.ver) return <Navigate to="/listas" replace />

  const fechaHoy = hoy()
  const items = state.items.filter((i) => i.listaId === lista.id)
  const miembros = state.miembros.filter((m) => m.listaId === lista.id)
  const r = resumenItems(items)
  const porComprar = items.filter((i) => !i.comprado).sort((a, b) => porFecha(a, b))
  const comprados = items.filter((i) => i.comprado).sort((a, b) => (b.compradoEn ?? '').localeCompare(a.compradoEn ?? ''))
  const participantes = miembros.filter((m) => m.estado === 'aceptada').length
  const compartidaConAlguien = lista.compartida && (permisos.propietario || participantes > 0)

  const agregar = (e) => {
    e.preventDefault()
    if (!nombre.trim()) return
    actions.agregarItem(lista.id, { nombre, precio, fechaCompra: fecha })
    setNombre('')
    setPrecio(0)
    setFecha('')
    entradaNombre.current?.focus()
  }
  const eliminarItem = (item) => {
    actions.eliminarItem(item.id)
    toast(`«${item.nombre}» eliminado`, { action: { label: 'Deshacer', onClick: () => actions.restaurarItem(item) } })
  }

  const detalle = permisos.propietario ? (lista.compartida ? 'Tuya · compartida' : 'Solo tuya') : `De ${nombreDe(lista.propietarioNombre, lista.propietarioEmail)}`

  return (
    <div className="grid gap-5">
      <Link to="/listas" className="inline-flex w-fit items-center gap-1.5 rounded-md text-sm font-semibold text-forest underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
        <ArrowLeft className="size-4" aria-hidden="true" /> Todas las listas
      </Link>
      <PageHeader title={lista.nombre} description={detalle}>
        {permisos.propietario || compartidaConAlguien ? (
          <Button variant="outline" onClick={() => setVerMiembros(true)}>
            <Users /> {permisos.propietario ? (lista.compartida ? `Compartida${participantes ? ` · ${participantes}` : ''}` : 'Compartir') : `Participantes · ${participantes + 1}`}
          </Button>
        ) : null}
        {permisos.propietario ? (
          <>
            <Button variant="outline" size="icon" aria-label="Editar lista" onClick={() => setEditandoLista(true)}>
              <Pencil />
            </Button>
            <Button variant="outline" size="icon" aria-label="Eliminar lista" onClick={() => setBorrandoLista(true)}>
              <Trash2 />
            </Button>
          </>
        ) : null}
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatCard icon={ShoppingCart} label="Total de la lista" value={r.total} hint={`${r.cantidad} ${r.cantidad === 1 ? 'ítem' : 'ítems'}`} className={cn('col-span-2 md:col-span-1', entrada)} />
        <StatCard icon={CircleCheck} label="Ya comprado" value={r.comprado} tone="positive" hint={`${r.cuantosComprados} de ${r.cantidad}`} className={entrada} style={escalonado(1)} />
        <StatCard icon={Clock} label="Por comprar" value={r.pendiente} hint={`${r.cantidad - r.cuantosComprados} ${r.cantidad - r.cuantosComprados === 1 ? 'pendiente' : 'pendientes'}`} className={entrada} style={escalonado(2)} />
      </div>

      <Panel title="Ítems" action={permisos.crear || permisos.editar || permisos.eliminar ? null : <span className="text-xs text-muted-foreground">Solo puedes ver esta lista</span>}>
        {permisos.crear ? (
          <form onSubmit={agregar} className="mb-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_9rem_9.5rem_auto]">
            <Input ref={entradaNombre} aria-label="Nombre del ítem" maxLength={120} placeholder="¿Qué vas a comprar?" value={nombre} onChange={(e) => setNombre(e.target.value)} className="bg-card" />
            <MoneyInput aria-label="Precio" className="h-9 bg-card" value={precio} onValueChange={setPrecio} />
            <Input type="date" aria-label="Fecha para comprarlo (opcional)" value={fecha} onChange={(e) => setFecha(e.target.value)} className="bg-card" />
            <Button type="submit" disabled={!nombre.trim()}>
              <Plus /> Agregar
            </Button>
          </form>
        ) : null}

        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{permisos.crear ? 'Agrega lo primero que quieres comprar.' : 'Esta lista aún no tiene ítems.'}</p>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {porComprar.length ? (
              <section aria-label="Por comprar">
                <h3 className="text-xs font-semibold text-muted-foreground">Por comprar · {porComprar.length}</h3>
                <ul className="divide-y">
                  {porComprar.map((item, i) => (
                    <FilaItem key={item.id} item={item} indice={i} permisos={permisos} fechaHoy={fechaHoy} onMarcar={actions.marcarComprado} onEditar={setItemEnEdicion} onEliminar={eliminarItem} />
                  ))}
                </ul>
              </section>
            ) : null}
            {comprados.length ? (
              <section aria-label="Comprados">
                <h3 className="text-xs font-semibold text-muted-foreground">Comprados · {comprados.length}</h3>
                <ul className="divide-y">
                  {comprados.map((item, i) => (
                    <FilaItem key={item.id} item={item} indice={i} permisos={permisos} fechaHoy={fechaHoy} onMarcar={actions.marcarComprado} onEditar={setItemEnEdicion} onEliminar={eliminarItem} />
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        )}
      </Panel>

      <ListaDialog
        open={editandoLista}
        onOpenChange={setEditandoLista}
        lista={lista}
        participantes={miembros.length}
        miCorreo={usuario.email}
        onGuardar={(datos) => actions.editarLista(lista.id, datos)}
      />
      <ItemDialog open={itemEnEdicion !== null} onOpenChange={(abierto) => !abierto && setItemEnEdicion(null)} item={itemEnEdicion} onGuardar={(datos) => actions.editarItem(itemEnEdicion.id, datos)} />
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
