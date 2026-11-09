import { Plus, Users, X } from 'lucide-react'
import { useState } from 'react'
import { Campo } from '@/components/Campo'
import { hojaMovil } from '@/components/hojaMovil'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { esCorreoValido } from '@/lib/listas'

function Formulario({ lista, participantes, miCorreo, onGuardar }) {
  const [nombre, setNombre] = useState(lista?.nombre ?? '')
  const [compartida, setCompartida] = useState(lista?.compartida ?? false)
  const [correos, setCorreos] = useState([])
  const [correo, setCorreo] = useState('')
  const [errorCorreo, setErrorCorreo] = useState('')

  // Al activar "Compartir" se pide de una vez con quién: al crear la lista, o al compartir una que no lo estaba. Una lista que
  // ya es compartida administra a sus participantes desde el botón "Compartida" de la lista.
  const pideCorreos = compartida && !lista?.compartida
  const dejaDeCompartir = Boolean(lista?.compartida) && !compartida && participantes > 0
  const pendiente = correo.trim()
  const pendienteValido = esCorreoValido(pendiente)
  const hayDestinatario = correos.length > 0 || pendienteValido
  const valido = nombre.trim().length > 0 && (!pideCorreos || hayDestinatario)

  const agregarCorreo = () => {
    const limpio = pendiente.toLowerCase()
    if (!limpio) return false
    if (!esCorreoValido(limpio)) {
      setErrorCorreo('Escribe un correo válido, como nombre@correo.com.')
      return false
    }
    if (miCorreo && limpio === miCorreo.toLowerCase()) {
      setErrorCorreo('Ese es tu propio correo.')
      return false
    }
    if (correos.includes(limpio)) {
      setErrorCorreo('Ya agregaste ese correo.')
      return false
    }
    setCorreos((c) => [...c, limpio])
    setCorreo('')
    setErrorCorreo('')
    return true
  }

  const enviar = (e) => {
    e.preventDefault()
    if (!valido) return
    // Un correo escrito pero sin agregar con el botón también cuenta.
    const lista_ = pideCorreos ? [...correos] : []
    if (pideCorreos && pendienteValido) {
      const limpio = pendiente.toLowerCase()
      if (!lista_.includes(limpio) && limpio !== miCorreo?.toLowerCase()) lista_.push(limpio)
    }
    onGuardar({ nombre, compartida, correos: lista_ })
  }

  return (
    <form className="grid grid-cols-1 gap-4" onSubmit={enviar}>
      <Campo label="Nombre de la lista">
        <Input autoFocus maxLength={80} placeholder="Ej. Regalos de diciembre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
      </Campo>
      <label className="flex items-start gap-3 rounded-xl border bg-muted/40 p-3">
        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-mint text-forest" aria-hidden="true">
          <Users className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">Compartir con otros usuarios de Fluvi</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">Invitas a otras personas por su correo y entre todos agregan, editan y eliminan ítems. Tú decides qué puede hacer cada una.</span>
        </span>
        <Switch checked={compartida} onCheckedChange={setCompartida} aria-label="Compartir con otros usuarios de Fluvi" />
      </label>

      {pideCorreos ? (
        <div className="grid grid-cols-1 gap-2 rounded-xl border bg-card p-3" role="group" aria-label="Con quién compartes la lista">
          <Campo label="¿Con quién la compartes?">
            <Input
              type="email"
              inputMode="email"
              autoComplete="off"
              placeholder="nombre@correo.com"
              value={correo}
              onChange={(e) => {
                setCorreo(e.target.value)
                setErrorCorreo('')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  if (pendiente) agregarCorreo()
                }
              }}
              aria-invalid={errorCorreo ? true : undefined}
              aria-describedby="ayuda-correos"
            />
          </Campo>
          <div className="flex items-start justify-between gap-3">
            <p id="ayuda-correos" className={errorCorreo ? 'text-xs text-negative' : 'text-xs text-muted-foreground'} role={errorCorreo ? 'alert' : undefined}>
              {errorCorreo || 'El correo con el que la persona usa Fluvi. Le llega la invitación dentro de la app y por correo.'}
            </p>
            <Button type="button" variant="outline" size="sm" className="shrink-0" disabled={!pendiente} onClick={agregarCorreo}>
              <Plus /> Agregar
            </Button>
          </div>
          {correos.length ? (
            <ul className="flex flex-wrap gap-1.5" aria-label="Personas a invitar">
              {correos.map((c) => (
                <li key={c} className="flex max-w-full items-center gap-1 rounded-full bg-mint py-1 pr-1 pl-3 text-sm text-forest">
                  <span className="min-w-0 truncate">{c}</span>
                  <button
                    type="button"
                    onClick={() => setCorreos((lista) => lista.filter((x) => x !== c))}
                    aria-label={`Quitar a ${c}`}
                    className="grid size-6 shrink-0 place-items-center rounded-full hover:bg-forest/10 focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">Agrega al menos una persona para compartir la lista.</p>
          )}
        </div>
      ) : null}

      {dejaDeCompartir ? (
        <p role="status" className="rounded-xl bg-negative-soft px-3 py-2 text-sm text-negative">
          Al dejar de compartir, {participantes === 1 ? 'la persona con la que compartes pierde' : `las ${participantes} personas con las que compartes pierden`} el acceso a la lista.
        </p>
      ) : null}
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
        <Button type="submit" disabled={!valido}>
          {lista ? 'Guardar cambios' : pideCorreos ? 'Crear e invitar' : 'Crear lista'}
        </Button>
      </DialogFooter>
    </form>
  )
}

// Crear (lista vacía) o editar una lista. `participantes` es cuántas personas tienen acceso ahora, para avisar al dejar de
// compartir; `miCorreo` evita que alguien se invite a sí mismo. `onGuardar` recibe { nombre, compartida, correos }.
export function ListaDialog({ open, onOpenChange, lista = null, participantes = 0, miCorreo = '', onGuardar }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={hojaMovil}>
        <DialogHeader>
          <DialogTitle>{lista ? 'Editar lista' : 'Nueva lista'}</DialogTitle>
          <DialogDescription>{lista ? 'Cambia el nombre o si la lista se comparte.' : 'Escribe lo que quieres comprar y cuánto cuesta. Esta lista no afecta tus saldos.'}</DialogDescription>
        </DialogHeader>
        {open ? (
          <Formulario
            key={lista?.id ?? 'nueva'}
            lista={lista}
            participantes={participantes}
            miCorreo={miCorreo}
            onGuardar={(datos) => {
              onGuardar(datos)
              onOpenChange(false)
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
