import { Check, HandCoins, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { DeudaDialog } from '@/components/DeudaDialog'
import { EmptyState } from '@/components/EmptyState'
import { Money } from '@/components/Money'
import { PageHeader } from '@/components/PageHeader'
import { Panel } from '@/components/Panel'
import { PeriodoPicker } from '@/components/PeriodPickers'
import { StatCard } from '@/components/StatCard'
import { Button } from '@/components/ui/button'
import { esMesUnico, movsFiltrados, nombreBilletera } from '@/lib/calc'
import { etiquetaPeriodo, fechaCorta } from '@/lib/format'
import { entrada, escalonado } from '@/lib/motion'
import { useFinance } from '@/store/context'

export default function Deudas() {
  const { state, actions } = useFinance()
  const [dialog, setDialog] = useState(null)
  const [porEliminar, setPorEliminar] = useState(null)
  const { mes, anio, deudas, billeteras } = state

  const pendientes = deudas.filter((d) => !d.pagada)
  const totalPorCobrar = pendientes.reduce((t, d) => t + d.valor, 0)

  const movsPeriodo = movsFiltrados(state.movimientos, anio, mes)
  const cobradoEnPeriodo = movsPeriodo.filter((m) => m.tipo === 'Ingreso' && m.deudaId).reduce((t, m) => t + m.valor, 0)

  const pagadasEnPeriodo = deudas.filter((d) => {
    if (!d.pagada || !d.fechaPago) return false
    const a = Number(d.fechaPago.slice(0, 4))
    const m = Number(d.fechaPago.slice(5, 7)) - 1
    if (a !== anio) return false
    if (mes === null) return true
    if (Array.isArray(mes)) return mes.includes(m)
    return m === mes
  })

  return (
    <div className="grid gap-5">
      <PageHeader title="Deudas" description="Registra los préstamos que haces y cobra cuando te paguen.">
        <PeriodoPicker />
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
        <StatCard label="Por cobrar" value={totalPorCobrar} tone="negative" />
        <StatCard label="Deudas pendientes" value={String(pendientes.length)} />
        <StatCard label={`Cobrado en ${etiquetaPeriodo(mes, anio).toLowerCase()}`} value={cobradoEnPeriodo} tone="positive" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section className="grid content-start gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Pendientes</h2>
            <Button size="sm" onClick={() => setDialog({ modo: 'prestar' })}>
              <Plus className="size-4" /> Nuevo préstamo
            </Button>
          </div>

          {pendientes.length ? (
            <ul className="grid gap-3 sm:grid-cols-2">
              {pendientes.map((d, i) => (
                <li key={d.id} className={`rounded-2xl bg-card p-4 ring-1 ring-border ${entrada}`} style={escalonado(i)}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{d.persona}</p>
                      <Money value={d.valor} className="text-xl font-bold" />
                    </div>
                    <span className="flex shrink-0">
                      <Button variant="ghost" size="icon" className="size-8 text-positive" aria-label={`Cobrar a ${d.persona}`} onClick={() => setDialog({ modo: 'cobrar', deuda: d })}>
                        <Check />
                      </Button>
                      <Button variant="ghost" size="icon" className="size-8" aria-label={`Eliminar deuda de ${d.persona}`} onClick={() => setPorEliminar(d)}>
                        <Trash2 />
                      </Button>
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {fechaCorta(d.fecha)} · {nombreBilletera(billeteras, d.billeteraId)}
                    {d.concepto ? ` · ${d.concepto}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={HandCoins} title="Sin deudas pendientes" description="Cuando prestes dinero, regístralo aquí para llevar el control." />
          )}
        </section>

        <Panel title={`Cobradas en ${etiquetaPeriodo(mes, anio).toLowerCase()}`} className="xl:sticky xl:top-6 xl:self-start">
          {pagadasEnPeriodo.length ? (
            <ul className="grid gap-3">
              {pagadasEnPeriodo.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-2 rounded-xl bg-muted/50 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{d.persona}</p>
                    <p className="text-xs text-muted-foreground">{fechaCorta(d.fechaPago)}</p>
                  </div>
                  <Money value={d.valor} tone="positive" className="shrink-0 text-sm font-semibold" />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No hay cobros en este periodo.</p>
          )}
        </Panel>
      </div>

      <DeudaDialog
        open={dialog !== null}
        onOpenChange={(abierto) => { if (!abierto) setDialog(null) }}
        modo={dialog?.modo ?? 'prestar'}
        deuda={dialog?.deuda}
        onPrestar={(datos) => actions.prestar(datos)}
        onCobrar={(id, billetera, fecha) => actions.cobrar(id, billetera, fecha)}
      />

      <ConfirmDialog
        open={porEliminar !== null}
        onOpenChange={(abierto) => { if (!abierto) setPorEliminar(null) }}
        title={`¿Eliminar deuda de "${porEliminar?.persona}"?`}
        description="Se elimina el registro de la deuda. Los movimientos asociados (egreso del préstamo) se conservan."
        onConfirm={() => { actions.eliminar('deudas', porEliminar.id); setPorEliminar(null) }}
      />
    </div>
  )
}
