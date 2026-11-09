import { useState } from 'react'
import { Campo } from '@/components/Campo'
import { hojaMovil } from '@/components/hojaMovil'
import { SelectorPrioridad } from '@/components/listas/Prioridad'
import { MoneyInput } from '@/components/MoneyInput'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

function Formulario({ item, onGuardar, conPrioridad }) {
  const [prioridad, setPrioridad] = useState(item?.prioridad ?? null)
  const [nombre, setNombre] = useState(item?.nombre ?? '')
  const [precio, setPrecio] = useState(item?.precio ?? 0)
  const [fechaCompra, setFechaCompra] = useState(item?.fechaCompra ?? '')
  const valido = nombre.trim().length > 0

  const enviar = (e) => {
    e.preventDefault()
    if (valido) onGuardar({ nombre, precio, fechaCompra, ...(conPrioridad ? { prioridad } : {}) })
  }

  return (
    <form className="grid gap-4" onSubmit={enviar}>
      <Campo label="¿Qué vas a comprar?">
        <Input autoFocus maxLength={120} placeholder="Ej. Torta de cumpleaños" value={nombre} onChange={(e) => setNombre(e.target.value)} />
      </Campo>
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Precio">
          <MoneyInput className="h-9 bg-card" value={precio} onValueChange={setPrecio} />
        </Campo>
        <Campo label="Fecha (opcional)">
          <Input type="date" value={fechaCompra} onChange={(e) => setFechaCompra(e.target.value)} />
        </Campo>
      </div>
      {conPrioridad ? (
        <Campo label="Prioridad (opcional)">
          <SelectorPrioridad valor={prioridad} onCambiar={setPrioridad} />
        </Campo>
      ) : null}
      {fechaCompra ? (
        <button type="button" onClick={() => setFechaCompra('')} className="justify-self-start rounded-md text-xs font-semibold text-forest underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
          Quitar la fecha
        </button>
      ) : null}
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
        <Button type="submit" disabled={!valido}>
          {item ? 'Guardar cambios' : 'Agregar'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function ItemDialog({ open, onOpenChange, item = null, onGuardar, conPrioridad = false }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={hojaMovil}>
        <DialogHeader>
          <DialogTitle>{item ? 'Editar ítem' : 'Nuevo ítem'}</DialogTitle>
          <DialogDescription>El precio y la fecha son opcionales; la fecha es para recordar cuándo piensas comprarlo.</DialogDescription>
        </DialogHeader>
        {open ? (
          <Formulario
            key={item?.id ?? 'nuevo'}
            item={item}
            conPrioridad={conPrioridad}
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
