import { useState } from 'react'
import { Campo } from '@/components/Campo'
import { HistorialMovimiento } from '@/components/HistorialMovimiento'
import { MoneyInput } from '@/components/MoneyInput'
import { SelectorCategoria } from '@/components/SelectorCategoria'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { separarCategoria } from '@/lib/calc'
import { hoy } from '@/lib/format'
import { useFinance } from '@/store/context'

const nuevo = () => ({ fecha: hoy(), tipo: 'Egreso', categoriaId: null, subcategoriaId: null, concepto: '', valor: 0, observacion: '' })

function Formulario({ inicial, onGuardar, onEliminar }) {
  const { state } = useFinance()
  const [datos, setDatos] = useState(() => (inicial ? { ...inicial, ...separarCategoria(state.categorias, inicial.categoriaId) } : nuevo()))
  const [repetir, setRepetir] = useState(false)
  const set = (campo) => (valor) => setDatos((d) => ({ ...d, [campo]: valor }))
  const valido = datos.categoriaId && datos.valor > 0 && datos.fecha

  const enviar = (e) => {
    e.preventDefault()
    const { subcategoriaId, categoriaId, ...resto } = datos
    onGuardar({ ...resto, categoriaId: subcategoriaId ?? categoriaId }, repetir)
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
        <Campo label="Fecha">
          <Input type="date" required value={datos.fecha} onChange={(e) => set('fecha')(e.target.value)} />
        </Campo>
        <SelectorCategoria tipo={datos.tipo} categoriaId={datos.categoriaId} subcategoriaId={datos.subcategoriaId} onChange={(sel) => setDatos((d) => ({ ...d, ...sel }))} claseSub="col-span-2" />
      </div>
      <Campo label="Concepto">
        <Input placeholder="Ej. Mercado de la quincena" value={datos.concepto} onChange={(e) => set('concepto')(e.target.value)} />
      </Campo>
      <Campo label="Observación">
        <Input placeholder="Opcional" value={datos.observacion} onChange={(e) => set('observacion')(e.target.value)} />
      </Campo>
      {inicial ? <HistorialMovimiento movimientoId={inicial.id} /> : (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="size-4 accent-leaf" checked={repetir} onChange={(e) => setRepetir(e.target.checked)} />
          Repetir cada mes el día {Number(datos.fecha.slice(8, 10)) || ''}
        </label>
      )}
      <DialogFooter>
        {onEliminar ? (
          <Button type="button" variant="ghost" className="text-destructive sm:mr-auto" onClick={onEliminar}>
            Eliminar
          </Button>
        ) : null}
        <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
        <Button type="submit" disabled={!valido}>
          Guardar
        </Button>
      </DialogFooter>
    </form>
  )
}

export function MovimientoDialog({ open, onOpenChange, movimiento, onGuardar, onEliminar }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-sm:top-auto max-sm:bottom-0 max-sm:max-w-full max-sm:translate-y-0 max-sm:rounded-b-none max-sm:duration-300 max-sm:ease-drawer max-sm:data-open:zoom-in-100 max-sm:data-open:slide-in-from-bottom-8 max-sm:data-closed:zoom-out-100 max-sm:data-closed:slide-out-to-bottom-8">
        <DialogHeader>
          <DialogTitle>{movimiento ? 'Editar movimiento' : 'Nuevo movimiento'}</DialogTitle>
        </DialogHeader>
        <Formulario
          inicial={movimiento}
          onEliminar={movimiento ? onEliminar : null}
          onGuardar={(datos, repetir) => {
            onGuardar(datos, repetir)
            onOpenChange(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
