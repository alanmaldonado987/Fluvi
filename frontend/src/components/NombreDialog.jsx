import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

function Formulario({ valor, onGuardar }) {
  const [nombre, setNombre] = useState(valor)
  const limpio = nombre.trim()
  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        onGuardar(limpio)
      }}
    >
      <Input autoFocus aria-label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
        <Button type="submit" disabled={!limpio || limpio === valor}>
          Guardar
        </Button>
      </DialogFooter>
    </form>
  )
}

export function NombreDialog({ open, onOpenChange, title, valor, onGuardar }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Formulario
          valor={valor}
          onGuardar={(nombre) => {
            onGuardar(nombre)
            onOpenChange(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
