import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Campo } from '@/components/Campo'
import { HistorialMovimiento } from '@/components/HistorialMovimiento'
import { MoneyInput } from '@/components/MoneyInput'
import { SelectField } from '@/components/SelectField'
import { SelectorCategoria } from '@/components/SelectorCategoria'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { separarCategoria } from '@/lib/calc'
import { hoy } from '@/lib/format'
import { useFinance } from '@/store/context'

const SIN_BILLETERA = 'ninguna'
const nuevo = () => ({ fecha: hoy(), tipo: 'Egreso', categoriaId: null, subcategoriaId: null, billeteraId: null, destinoId: null, concepto: '', valor: 0, observacion: '' })

function Formulario({ inicial, onGuardar, onEliminar }) {
  const { state } = useFinance()
  const [datos, setDatos] = useState(() => (inicial ? { ...nuevo(), ...inicial, ...separarCategoria(state.categorias, inicial.categoriaId) } : nuevo()))
  const [repetir, setRepetir] = useState(false)
  const set = (campo) => (valor) => setDatos((d) => ({ ...d, [campo]: valor }))
  const transferencia = datos.tipo === 'Transferencia'
  const billeteras = state.billeteras.map((b) => ({ value: b.id, label: b.nombre }))
  const mismaBilletera = transferencia && datos.billeteraId && datos.billeteraId === datos.destinoId
  const valido = datos.valor > 0 && datos.fecha && (transferencia ? datos.billeteraId && datos.destinoId && !mismaBilletera : datos.categoriaId)

  const enviar = (e) => {
    e.preventDefault()
    const { subcategoriaId, categoriaId, ...resto } = datos
    onGuardar(transferencia ? { ...resto, categoriaId: null } : { ...resto, categoriaId: subcategoriaId ?? categoriaId, destinoId: null }, !transferencia && repetir)
  }

  return (
    <form className="grid gap-4" onSubmit={enviar}>
      <Tabs value={datos.tipo} onValueChange={(tipo) => setDatos((d) => ({ ...d, tipo, categoriaId: null, subcategoriaId: null, destinoId: null }))}>
        <TabsList className="w-full">
          <TabsTrigger value="Egreso">Egreso</TabsTrigger>
          <TabsTrigger value="Ingreso">Ingreso</TabsTrigger>
          <TabsTrigger value="Transferencia">Transferencia</TabsTrigger>
        </TabsList>
      </Tabs>
      <Campo label="Valor">
        <MoneyInput autoFocus className="h-14 text-2xl font-bold" value={datos.valor} onValueChange={set('valor')} />
      </Campo>
      <div className="grid grid-cols-2 gap-3">
        {transferencia ? (
          <>
            <Campo label="Desde">
              <SelectField placeholder="Elige una" value={datos.billeteraId} onChange={set('billeteraId')} items={billeteras} />
            </Campo>
            <Campo label="Hacia">
              <SelectField placeholder="Elige una" value={datos.destinoId} onChange={set('destinoId')} items={billeteras} />
            </Campo>
            {billeteras.length < 2 ? (
              <p className="col-span-2 text-sm text-muted-foreground">
                Necesitas al menos dos billeteras.{' '}
                <Link to="/billeteras" className="font-semibold text-forest underline underline-offset-4">
                  Créalas en Billeteras
                </Link>
                .
              </p>
            ) : null}
            {mismaBilletera ? <p className="col-span-2 text-xs text-negative">Elige dos billeteras distintas.</p> : null}
            <Campo label="Fecha" className="col-span-2">
              <Input type="date" required value={datos.fecha} onChange={(e) => set('fecha')(e.target.value)} />
            </Campo>
          </>
        ) : (
          <>
            <Campo label="Fecha">
              <Input type="date" required value={datos.fecha} onChange={(e) => set('fecha')(e.target.value)} />
            </Campo>
            <SelectorCategoria tipo={datos.tipo} categoriaId={datos.categoriaId} subcategoriaId={datos.subcategoriaId} onChange={(sel) => setDatos((d) => ({ ...d, ...sel }))} claseSub="col-span-2" />
            {billeteras.length ? (
              <Campo label="Billetera" className="col-span-2">
                <SelectField value={datos.billeteraId ?? SIN_BILLETERA} onChange={(id) => set('billeteraId')(id === SIN_BILLETERA ? null : id)} items={[{ value: SIN_BILLETERA, label: 'Sin billetera' }, ...billeteras]} />
              </Campo>
            ) : null}
          </>
        )}
      </div>
      <Campo label="Concepto">
        <Input placeholder={transferencia ? 'Ej. Retiro en cajero' : 'Ej. Mercado de la quincena'} value={datos.concepto} onChange={(e) => set('concepto')(e.target.value)} />
      </Campo>
      <Campo label="Observación">
        <Input placeholder="Opcional" value={datos.observacion} onChange={(e) => set('observacion')(e.target.value)} />
      </Campo>
      {inicial ? (
        <HistorialMovimiento movimientoId={inicial.id} />
      ) : transferencia ? null : (
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
