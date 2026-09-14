import { useState } from 'react'
import { Campo } from '@/components/Campo'
import { MoneyInput } from '@/components/MoneyInput'
import { SelectField } from '@/components/SelectField'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { hoy } from '@/lib/format'
import { useFinance } from '@/store/context'

function FormPrestar({ onGuardar }) {
  const { state } = useFinance()
  const [datos, setDatos] = useState({ persona: '', valor: 0, billeteraId: null, concepto: '', fecha: hoy() })
  const set = (campo) => (valor) => setDatos((d) => ({ ...d, [campo]: valor }))
  const billeteras = state.billeteras.map((b) => ({ value: b.id, label: b.nombre }))
  const valido = datos.persona.trim() && datos.valor > 0 && datos.billeteraId && datos.fecha

  const enviar = (e) => {
    e.preventDefault()
    onGuardar({ ...datos, persona: datos.persona.trim(), concepto: datos.concepto.trim() })
  }

  return (
    <form className="grid gap-4" onSubmit={enviar}>
      <Campo label="Persona">
        <Input autoFocus placeholder="¿Quién te debe?" value={datos.persona} onChange={(e) => set('persona')(e.target.value)} />
      </Campo>
      <Campo label="Valor prestado">
        <MoneyInput className="h-14 text-2xl font-bold" value={datos.valor} onValueChange={set('valor')} />
      </Campo>
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Billetera de salida">
          <SelectField placeholder="Elige una" value={datos.billeteraId} onChange={set('billeteraId')} items={billeteras} />
        </Campo>
        <Campo label="Fecha">
          <Input type="date" required value={datos.fecha} onChange={(e) => set('fecha')(e.target.value)} />
        </Campo>
      </div>
      <Campo label="Concepto">
        <Input placeholder="Opcional" value={datos.concepto} onChange={(e) => set('concepto')(e.target.value)} />
      </Campo>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
        <Button type="submit" disabled={!valido}>Registrar préstamo</Button>
      </DialogFooter>
    </form>
  )
}

function FormCobrar({ deuda, abonado = 0, onGuardar }) {
  const { state } = useFinance()
  const restante = deuda.valor - abonado
  const [billetePagoId, setBilletePagoId] = useState(null)
  const [fecha, setFecha] = useState(hoy())
  const [monto, setMonto] = useState(restante)
  const billeteras = state.billeteras.map((b) => ({ value: b.id, label: b.nombre }))
  const valido = billetePagoId && fecha && monto > 0 && monto <= restante

  const enviar = (e) => {
    e.preventDefault()
    onGuardar(deuda.id, billetePagoId, fecha, monto)
  }

  return (
    <form className="grid gap-4" onSubmit={enviar}>
      <div className="text-sm text-muted-foreground">
        <p><strong>{deuda.persona}</strong> te debe <strong>${deuda.valor.toLocaleString('es-CO')}</strong>.</p>
        {abonado > 0 && <p>Abonado: ${abonado.toLocaleString('es-CO')} · Resta: <strong className="text-foreground">${restante.toLocaleString('es-CO')}</strong></p>}
      </div>
      <Campo label="Monto a cobrar">
        <MoneyInput className="h-14 text-2xl font-bold" value={monto} onValueChange={setMonto} />
      </Campo>
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Billetera de ingreso">
          <SelectField placeholder="Elige una" value={billetePagoId} onChange={setBilletePagoId} items={billeteras} />
        </Campo>
        <Campo label="Fecha de pago">
          <Input type="date" required value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </Campo>
      </div>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
        <Button type="submit" disabled={!valido}>{monto >= restante ? 'Cobrar todo' : 'Registrar abono'}</Button>
      </DialogFooter>
    </form>
  )
}

export function DeudaDialog({ open, onOpenChange, modo = 'prestar', deuda, abonado, onPrestar, onCobrar }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-sm:top-auto max-sm:bottom-0 max-sm:max-w-full max-sm:translate-y-0 max-sm:rounded-b-none max-sm:duration-300 max-sm:ease-drawer max-sm:data-open:zoom-in-100 max-sm:data-open:slide-in-from-bottom-8 max-sm:data-closed:zoom-out-100 max-sm:data-closed:slide-out-to-bottom-8">
        <DialogHeader>
          <DialogTitle>{modo === 'cobrar' ? 'Cobrar deuda' : 'Nuevo préstamo'}</DialogTitle>
        </DialogHeader>
        {modo === 'cobrar' && deuda ? (
          <FormCobrar deuda={deuda} abonado={abonado} onGuardar={(...args) => { onCobrar(...args); onOpenChange(false) }} />
        ) : (
          <FormPrestar onGuardar={(datos) => { onPrestar(datos); onOpenChange(false) }} />
        )}
      </DialogContent>
    </Dialog>
  )
}
