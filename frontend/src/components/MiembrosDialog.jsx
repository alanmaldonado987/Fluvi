import { ChevronDown, LoaderCircle, LogOut, Send, UserMinus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Campo } from '@/components/Campo'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { hojaMovil } from '@/components/hojaMovil'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

const nombreDe = (nombre, email) => nombre || email.split('@')[0]

const permisosEtiquetas = [
  ['puedeCrear', 'crear', 'Agregar ítems'],
  ['puedeEditar', 'editar', 'Editar ítems y marcar comprados'],
  ['puedeEliminar', 'eliminar', 'Eliminar ítems'],
]

// Los permisos se eligen por rol y, si hace falta, se afinan uno por uno. Cada rol es una combinación de los tres permisos.
const ROLES = [
  { id: 'ver', etiqueta: 'Solo ver', permisos: { crear: false, editar: false, eliminar: false }, detalle: 'Puede ver la lista, sin cambiar nada.' },
  { id: 'colaborar', etiqueta: 'Colaborar', permisos: { crear: true, editar: true, eliminar: false }, detalle: 'Puede agregar ítems, editarlos y marcarlos como comprados. No puede eliminar.' },
  { id: 'todo', etiqueta: 'Todo', permisos: { crear: true, editar: true, eliminar: true }, detalle: 'Puede agregar, editar y eliminar ítems.' },
]

const rolDe = (m) => ROLES.find((r) => r.permisos.crear === m.puedeCrear && r.permisos.editar === m.puedeEditar && r.permisos.eliminar === m.puedeEliminar) ?? null

function PermisosDePersona({ m, nombre, onCambiar }) {
  const rol = rolDe(m)
  // Una combinación que no es ningún rol (p. ej. agregar y eliminar, pero no editar) abre el detalle para que se vea cuál es.
  const [abierto, setAbierto] = useState(false)
  const detalleVisible = abierto || !rol
  return (
    <div className="grid gap-2 border-t pt-2">
      <div role="radiogroup" aria-label={`Permisos de ${nombre}`} className="grid grid-cols-3 overflow-hidden rounded-lg border">
        {ROLES.map((r) => (
          <button
            key={r.id}
            type="button"
            role="radio"
            aria-checked={rol?.id === r.id}
            onClick={() => onCambiar(r.permisos)}
            className={cn('border-r px-2 py-2 text-center text-sm last:border-r-0 transition-colors focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring', rol?.id === r.id ? 'bg-mint font-semibold text-forest' : 'text-muted-foreground hover:bg-muted/60')}
          >
            {r.etiqueta}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{rol ? rol.detalle : 'Permisos personalizados.'}</p>
      <button
        type="button"
        aria-expanded={detalleVisible}
        onClick={() => setAbierto((a) => !a)}
        disabled={!rol}
        className="flex w-fit items-center gap-1 rounded-md text-xs font-semibold text-forest underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:no-underline disabled:opacity-60"
      >
        Personalizar permisos <ChevronDown className={cn('size-3.5 transition-transform', detalleVisible && 'rotate-180')} aria-hidden="true" />
      </button>
      {detalleVisible ? (
        <div className="grid gap-1.5">
          {permisosEtiquetas.map(([campo, clave, etiqueta]) => (
            <label key={clave} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">{etiqueta}</span>
              <Switch checked={m[campo]} aria-label={`${etiqueta}: ${nombre}`} onCheckedChange={(valor) => onCambiar({ crear: m.puedeCrear, editar: m.puedeEditar, eliminar: m.puedeEliminar, [clave]: valor })} />
            </label>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function FilaPersona({ nombre, email, detalle, children }) {
  return (
    <li className="grid grid-cols-1 gap-2 rounded-xl border p-3">
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-mint text-sm font-bold text-forest" aria-hidden="true">
          {nombreDe(nombre, email).charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{nombreDe(nombre, email)}</span>
          <span className="block truncate text-xs text-muted-foreground">{email}</span>
        </span>
        {detalle}
      </div>
      {children}
    </li>
  )
}

// Participantes de una lista. Quien la creó invita por correo y decide qué puede hacer cada persona; los demás solo ven quién
// participa y pueden salir de la lista.
export function MiembrosDialog({ open, onOpenChange, lista, miembros, soyPropietario, acciones }) {
  const [correo, setCorreo] = useState('')
  const [invitando, setInvitando] = useState(false)
  const [error, setError] = useState('')
  const [porQuitar, setPorQuitar] = useState(null)
  const [saliendo, setSaliendo] = useState(false)

  const invitar = async (e) => {
    e.preventDefault()
    const email = correo.trim()
    if (!email) return
    setInvitando(true)
    setError('')
    try {
      const { correo: porCorreo } = await acciones.invitar(lista.id, email)
      toast.success(porCorreo ? 'Invitación enviada. También le avisamos por correo.' : 'Invitación enviada. La persona la verá al abrir Fluvi.')
      setCorreo('')
    } catch (err) {
      setError(err?.message || 'No se pudo enviar la invitación.')
    } finally {
      setInvitando(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={hojaMovil}>
          <DialogHeader>
            <DialogTitle>Compartida con</DialogTitle>
            <DialogDescription>{soyPropietario ? 'Invita a otros usuarios de Fluvi y elige qué puede hacer cada uno.' : `Lista de ${nombreDe(lista.propietarioNombre, lista.propietarioEmail)}.`}</DialogDescription>
          </DialogHeader>

          {soyPropietario ? (
            <form className="grid gap-2" onSubmit={invitar}>
              <Campo label="Correo de la persona a invitar">
                <Input type="email" inputMode="email" autoComplete="off" placeholder="nombre@correo.com" value={correo} onChange={(e) => setCorreo(e.target.value)} disabled={!lista.compartida} />
              </Campo>
              {!lista.compartida ? <p className="text-xs text-muted-foreground">Activa «Compartir» al editar la lista para poder invitar.</p> : null}
              {error ? (
                <p role="alert" className="rounded-xl bg-negative-soft px-3 py-2 text-sm text-negative">
                  {error}
                </p>
              ) : null}
              <Button type="submit" disabled={!lista.compartida || !correo.trim() || invitando} className="justify-self-start">
                {invitando ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Send />} Invitar
              </Button>
            </form>
          ) : null}

          <ul className="grid max-h-80 grid-cols-1 gap-2 overflow-y-auto">
            <FilaPersona nombre={lista.propietarioNombre} email={lista.propietarioEmail} detalle={<span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">Creador</span>} />
            {miembros.map((m) => (
              <FilaPersona
                key={m.usuarioId}
                nombre={m.nombre}
                email={m.email}
                detalle={
                  <>
                    {m.estado === 'pendiente' ? <span className="shrink-0 rounded-full bg-gold/25 px-2 py-0.5 text-xs font-semibold text-foreground">Pendiente</span> : null}
                    {soyPropietario ? (
                      <Button variant="ghost" size="icon" className="size-8 shrink-0" aria-label={`Quitar a ${nombreDe(m.nombre, m.email)}`} onClick={() => setPorQuitar(m)}>
                        <UserMinus />
                      </Button>
                    ) : null}
                  </>
                }
              >
                {soyPropietario ? <PermisosDePersona m={m} nombre={nombreDe(m.nombre, m.email)} onCambiar={(permisos) => acciones.cambiarPermisos(lista.id, m.usuarioId, permisos)} /> : null}
              </FilaPersona>
            ))}
          </ul>
          {soyPropietario && miembros.length === 0 && lista.compartida ? <p className="text-sm text-muted-foreground">Aún no has invitado a nadie.</p> : null}
          {soyPropietario && miembros.some((m) => m.estado === 'pendiente') ? <p className="text-xs text-muted-foreground">Quienes están «Pendiente» todavía no aceptan la invitación y no ven la lista.</p> : null}

          <DialogFooter>
            {!soyPropietario ? (
              <Button variant="outline" onClick={() => setSaliendo(true)}>
                <LogOut /> Salir de la lista
              </Button>
            ) : null}
            <DialogClose render={<Button />}>Cerrar</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={porQuitar !== null}
        onOpenChange={(abierto) => !abierto && setPorQuitar(null)}
        title={`¿Quitar a ${porQuitar ? nombreDe(porQuitar.nombre, porQuitar.email) : ''}?`}
        description="Pierde el acceso a la lista. Sus ítems se conservan. Puedes volver a invitar a esa persona cuando quieras."
        confirmLabel="Quitar"
        onConfirm={() => {
          acciones.quitarMiembro(lista.id, porQuitar.usuarioId)
          setPorQuitar(null)
        }}
      />
      <ConfirmDialog
        open={saliendo}
        onOpenChange={setSaliendo}
        title="¿Salir de esta lista?"
        description="Dejas de ver la lista y sus ítems. Quien la creó puede volver a invitarte."
        confirmLabel="Salir"
        onConfirm={() => {
          setSaliendo(false)
          onOpenChange(false)
          acciones.salirDeLista(lista.id)
        }}
      />
    </>
  )
}
