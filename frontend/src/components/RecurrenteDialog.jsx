import { useState } from 'react'
import { Campo } from '@/components/Campo'
import { MoneyInput } from '@/components/MoneyInput'
import { SelectorCategoria } from '@/components/SelectorCategoria'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { separarCategoria } from '@/lib/calc'
import { useFinance } from '@/store/context'

const nuevo = () => ({ tipo: 'Egreso', categoriaId: null, subcategoriaId: null, concepto: '', valor: 0, dia: 1, activo: true })

function Formulario({ inicial, onGuardar }) {
  const { state } = useFinance()
  const [datos, setDatos] = useState(() => (inicial ? { ...inicial, ...separarCategoria(state.categorias, inicial.categoriaId) } : nuevo()))
  const set = (campo) => (valor) => setDatos((d) => ({ ...d, [campo]: valor }))
  const dia = Number(datos.dia)
  const valido = datos.categoriaId && datos.valor > 0 && dia >= 1 && dia <= 31

  const enviar = (e) => {
    e.preventDefault()
    const { subcategoriaId, categoriaId, ...resto } = datos
    onGuardar({ ...resto, categoriaId: subcategoriaId ?? categoriaId, dia })
  }

  return (
    <form className="grid gap-4" onSubmit={enviar}>
      <Tabs value={datos.tipo} onValueChange={(tipo) => setDatos((d) => ({ ...d, tipo, categoriaId: null, subcategoriaId: null }))}>
        <TabsList className="w-full">
          <TabsTrigger value="Egreso">Egreso</TabsTrigger>
          <TabsTrigger value="Ingreso">Ingreso</TabsTrigger>
        </TabsList>
      </Tabs>
      <Campo label="Valor">
        <MoneyInput autoFocus className="h-14 text-2xl font-bold" value={datos.valor} onValueChange={set('valor')} />
      </Campo>
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Día del mes">
          <Input type="number" inputMode="numeric" min={1} max={31} required value={datos.dia} onChange={(e) => set('dia')(e.target.value)} />
        </Campo>
        <SelectorCategoria tipo={datos.tipo} categoriaId={datos.categoriaId} subcategoriaId={datos.subcategoriaId} onChange={(sel) => setDatos((d) => ({ ...d, ...sel }))} claseSub="col-span-2" />
      </div>
      <Campo label="Concepto">
        <Input placeholder="Ej. Arriendo" value={datos.concepto} onChange={(e) => set('concepto')(e.target.value)} />
      </Campo>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
        <Button type="submit" disabled={!valido}>
          Guardar
        </Button>
      </DialogFooter>
    </form>
  )
}

export function RecurrenteDialog({ open, onOpenChange, recurrente, onGuardar }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{recurrente ? 'Editar recurrente' : 'Nuevo movimiento recurrente'}</DialogTitle>
        </DialogHeader>
        <Formulario
          inicial={recurrente}
          onGuardar={(datos) => {
            onGuardar(datos)
            onOpenChange(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
