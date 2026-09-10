import { Pencil, Trash2, Wallet } from 'lucide-react'
import { useState } from 'react'
import { BilleteraCard } from '@/components/BilleteraCard'
import { BarrasMensuales } from '@/components/charts/BarrasMensuales'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'
import { NombreDialog } from '@/components/NombreDialog'
import { NuevaFilaForm } from '@/components/NuevaFilaForm'
import { PageHeader } from '@/components/PageHeader'
import { Panel } from '@/components/Panel'
import { PeriodoPicker } from '@/components/PeriodPickers'
import { StatCard } from '@/components/StatCard'
import { Button } from '@/components/ui/button'
import { actividadBilletera, clave, movimientosDe, saldoVivoBilletera, saldoVivoBilleteras, serieBilleteras } from '@/lib/calc'
import { anioDe, MESES } from '@/lib/format'
import { useFormatoMoneda } from '@/lib/privado'
import { entrada, escalonado } from '@/lib/motion'
import { useFinance } from '@/store/context'

export default function Billeteras() {
  const { state, actions } = useFinance()
  const formatCOP = useFormatoMoneda()
  const [porEliminar, setPorEliminar] = useState(null)
  const [confirmando, setConfirmando] = useState(false)
  const [renombrando, setRenombrando] = useState(null)
  const { mes, anio } = state
  const anual = mes === null
  const mesVivo = anual ? new Date().getMonth() : mes
  const saldoDe = (id, m) => state.saldos[clave(anio, m, id)]
  const total = saldoVivoBilleteras(state, mesVivo)
  const delMes = anual ? state.movimientos.filter((m) => anioDe(m.fecha) === anio) : movimientosDe(state.movimientos, anio, mes)
  const diferencia = !anual && mes > 0 ? total - saldoVivoBilleteras(state, mes - 1) : null
  const principal = state.billeteras.map((b) => ({ ...b, saldo: saldoVivoBilletera(state, mesVivo, b.id) })).sort((a, b) => b.saldo - a.saldo)[0]

  return (
    <div className="grid gap-5">
      <PageHeader title="Billeteras" description="Cuánto tienes en cada cuenta al cierre del mes.">
        <PeriodoPicker />
      </PageHeader>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label={anual ? `Total en ${anio}` : `Total en ${MESES[mes].toLowerCase()}`} value={total} tone="positive" />
        <StatCard label="Frente al mes anterior" value={diferencia ?? 0} signo tone={diferencia == null ? undefined : diferencia < 0 ? 'negative' : 'positive'} hint={diferencia == null ? (anual ? 'Vista anual' : 'Sin mes anterior en este año') : `Cierre de ${MESES[mes - 1].toLowerCase()}`} />
        <StatCard label="Billetera principal" value={principal?.nombre ?? 'Sin billeteras'} hint={principal ? formatCOP(principal.saldo) : undefined} />
        <StatCard label="Billeteras activas" value={String(state.billeteras.length)} />
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section className="grid content-start gap-4">
          {state.billeteras.length ? (
            <ul className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
              {state.billeteras.map((b, i) => (
                <BilleteraCard
                  key={b.id}
                  billetera={b}
                  saldo={saldoVivoBilletera(state, mesVivo, b.id)}
                  anterior={!anual && mes > 0 ? saldoVivoBilletera(state, mes - 1, b.id) : null}
                  actividad={actividadBilletera(delMes, b.id)}
                  onSaldo={anual ? undefined : (valor) => actions.setSaldo(mes, b.id, valor)}
                  className={entrada}
                  style={escalonado(i)}
                  acciones={
                    <span className="flex">
                      <Button variant="ghost" size="icon" className="size-8" aria-label={`Renombrar ${b.nombre}`} onClick={() => setRenombrando(b)}>
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        aria-label={`Eliminar ${b.nombre}`}
                        onClick={() => {
                          setPorEliminar(b)
                          setConfirmando(true)
                        }}
                      >
                        <Trash2 />
                      </Button>
                    </span>
                  }
                />
              ))}
            </ul>
          ) : (
            <EmptyState icon={Wallet} title="Sin billeteras" description="Agrega tus cuentas y el efectivo para registrar el saldo de cada mes." />
          )}
          <NuevaFilaForm placeholder="Nueva billetera" onAgregar={(nombre) => actions.agregar('billeteras', { nombre })} />
        </section>
        <Panel title={`Total por mes, ${anio}`} className="xl:sticky xl:top-6 xl:self-start">
          <BarrasMensuales datos={serieBilleteras(state)} mesActivo={mes} nombre="Total en billeteras" />
        </Panel>
      </div>
      <NombreDialog
        open={renombrando !== null}
        onOpenChange={(abierto) => {
          if (!abierto) setRenombrando(null)
        }}
        title="Renombrar billetera"
        valor={renombrando?.nombre ?? ''}
        onGuardar={(nombre) => actions.editar('billeteras', renombrando.id, { nombre })}
      />
      <ConfirmDialog
        open={confirmando}
        onOpenChange={setConfirmando}
        title={`¿Eliminar "${porEliminar?.nombre}"?`}
        description="Se borrarán sus saldos registrados. Los movimientos asociados quedan sin billetera."
        onConfirm={() => {
          actions.eliminar('billeteras', porEliminar.id)
          setConfirmando(false)
        }}
      />
    </div>
  )
}
