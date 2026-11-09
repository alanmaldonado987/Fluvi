import { Users } from 'lucide-react'
import { useState } from 'react'
import { Campo } from '@/components/Campo'
import { hojaMovil } from '@/components/hojaMovil'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

function Formulario({ lista, participantes, onGuardar }) {
  const [nombre, setNombre] = useState(lista?.nombre ?? '')
  const [compartida, setCompartida] = useState(lista?.compartida ?? false)
  const valido = nombre.trim().length > 0
  const dejaDeCompartir = Boolean(lista?.compartida) && !compartida && participantes > 0

  const enviar = (e) => {
    e.preventDefault()
    if (valido) onGuardar({ nombre, compartida })
  }

  return (
    <form className="grid gap-4" onSubmit={enviar}>
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
      {dejaDeCompartir ? (
        <p role="status" className="rounded-xl bg-negative-soft px-3 py-2 text-sm text-negative">
          Al dejar de compartir, {participantes === 1 ? 'la persona con la que compartes pierde' : `las ${participantes} personas con las que compartes pierden`} el acceso a la lista.
        </p>
      ) : null}
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
        <Button type="submit" disabled={!valido}>
          {lista ? 'Guardar cambios' : 'Crear lista'}
        </Button>
      </DialogFooter>
    </form>
  )
}

// Crear (lista vacía) o editar una lista. `participantes` es cuántas personas tienen acceso ahora, para avisar al dejar de compartir.
export function ListaDialog({ open, onOpenChange, lista = null, participantes = 0, onGuardar }) {
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
