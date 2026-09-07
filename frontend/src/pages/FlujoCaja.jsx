import { ArrowRight, Waves } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BarrasMensuales } from '@/components/charts/BarrasMensuales'
import { EmptyState } from '@/components/EmptyState'
import { FilaCategoria } from '@/components/FilaCategoria'
import { Money } from '@/components/Money'
import { PageHeader } from '@/components/PageHeader'
import { Panel } from '@/components/Panel'
import { PeriodoPicker } from '@/components/PeriodPickers'
import { StatCard } from '@/components/StatCard'
import { buttonVariants } from '@/components/ui/button'
import { flujoMes, serieSaldos, totalesFilas } from '@/lib/calc'
import { entrada, escalonado } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { useFinance } from '@/store/context'

const Flecha = () => <ArrowRight className="mx-auto size-5 rotate-90 text-muted-foreground sm:rotate-0" aria-hidden="true" />

function Seccion({ titulo, filas, totales, columnas = false }) {
  return (
    <Panel
      title={titulo}
      action={
        <p className="text-sm text-muted-foreground">
          <Money value={totales.real} className="font-semibold text-foreground" /> de <Money value={totales.proyectado} />
        </p>
      }
    >
      <ul className={cn('[&>li]:border-b', columnas && '2xl:grid 2xl:grid-cols-2 2xl:gap-x-8')}>
        {filas.map((f, i) => (
          <FilaCategoria key={f.id} categoria={f} proyectado={f.proyectado} real={f.real} className={entrada} style={escalonado(i)} />
        ))}
      </ul>
    </Panel>
  )
}

export default function FlujoCaja() {
  const { state } = useFinance()
  const { ingresos, egresos, saldoInicial } = flujoMes(state, state.mes)
  const ti = totalesFilas(ingresos)
  const te = totalesFilas(egresos)
  const saldoFinal = saldoInicial + ti.real - te.real

  return (
    <div className="grid gap-5">
      <PageHeader title="Flujo de caja" description="Cómo se mueve tu dinero durante el mes.">
        <PeriodoPicker />
      </PageHeader>
      {state.categorias.length === 0 ? (
        <EmptyState icon={Waves} title="Sin categorías" description="El flujo de caja compara tu presupuesto con lo registrado. Empieza creando categorías.">
          <Link to="/presupuesto" className={buttonVariants()}>
            Ir a Presupuesto
          </Link>
        </EmptyState>
      ) : (
        <>
          <div className="grid items-center gap-2 sm:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]">
            <StatCard label="Saldo inicial" value={saldoInicial} className={entrada} style={escalonado(0)} />
            <Flecha />
            <StatCard label="Ingresos del mes" value={ti.real} tone="positive" className={entrada} style={escalonado(1)} />
            <Flecha />
            <StatCard label="Egresos del mes" value={te.real} className={entrada} style={escalonado(2)} />
            <Flecha />
            <StatCard label="Saldo final" value={saldoFinal} destacado className={entrada} style={escalonado(3)} />
          </div>
          <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <Seccion titulo="Ingresos" filas={ingresos} totales={ti} />
            <Seccion titulo="Egresos" filas={egresos} totales={te} columnas />
          </div>
          <Panel title={`Saldo al cierre de cada mes, ${state.anio}`}>
            <BarrasMensuales datos={serieSaldos(state)} mesActivo={state.mes} nombre="Saldo final" />
          </Panel>
          <p className="text-xs text-muted-foreground">El saldo inicial de enero es el total registrado en billeteras para enero. Los demás meses arrastran el saldo final del mes anterior.</p>
        </>
      )}
    </div>
  )
}
