import { useState } from 'react'
import { Campo } from '@/components/Campo'
import { MoneyInput } from '@/components/MoneyInput'
import { SelectField } from '@/components/SelectField'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { principales } from '@/lib/calc'
import { hoy } from '@/lib/format'
import { useFinance } from '@/store/context'

const nueva = () => ({ nombre: '', objetivo: 0, categoriaId: null, fechaInicio: hoy(), fechaLimite: '' })

function Formulario({ inicial, onGuardar }) {
  const { state } = useFinance()
  const [datos, setDatos] = useState(() => (inicial ? { ...inicial, fechaLimite: inicial.fechaLimite ?? '' } : nueva()))
  const set = (campo) => (valor) => setDatos((d) => ({ ...d, [campo]: valor }))
  const categorias = principales(state.categorias).flatMap((p) => [
    { value: p.id, label: p.nombre },
    ...state.categorias.filter((c) => c.padreId === p.id).map((h) => ({ value: h.id, label: `${p.nombre} / ${h.nombre}` })),
  ])
  const valido = datos.nombre.trim() && datos.objetivo > 0 && datos.categoriaId && datos.fechaInicio

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        onGuardar({ nombre: datos.nombre.trim(), objetivo: datos.objetivo, categoriaId: datos.categoriaId, fechaInicio: datos.fechaInicio, fechaLimite: datos.fechaLimite || null })
      }}
    >
      <Campo label="Nombre">
        <Input autoFocus placeholder="Ej. Viaje a Cartagena" value={datos.nombre} onChange={(e) => set('nombre')(e.target.value)} />
      </Campo>
      <Campo label="Objetivo">
        <MoneyInput className="h-12 text-xl font-bold" value={datos.objetivo} onValueChange={set('objetivo')} />
      </Campo>
      <Campo label="Categoría que cuenta como aporte">
        <SelectField placeholder="Elige una" value={datos.categoriaId} onChange={set('categoriaId')} items={categorias} />
      </Campo>
      <p className="-mt-2 text-xs text-muted-foreground">Cada movimiento registrado en esa categoría suma al progreso de la meta. Conviene usar una subcategoría propia, por ejemplo "Ahorros / Viaje".</p>
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Desde">
          <Input type="date" required value={datos.fechaInicio} onChange={(e) => set('fechaInicio')(e.target.value)} />
        </Campo>
        <Campo label="Fecha límite">
          <Input type="date" value={datos.fechaLimite} onChange={(e) => set('fechaLimite')(e.target.value)} />
        </Campo>
      </div>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
        <Button type="submit" disabled={!valido}>
          Guardar
        </Button>
      </DialogFooter>
    </form>
  )
}

export function MetaDialog({ open, onOpenChange, meta, onGuardar }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{meta ? 'Editar meta' : 'Nueva meta de ahorro'}</DialogTitle>
        </DialogHeader>
        <Formulario
          inicial={meta}
          onGuardar={(datos) => {
            onGuardar(datos)
            onOpenChange(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
