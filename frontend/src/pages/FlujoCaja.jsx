import { Waves } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BarrasMensuales } from '@/components/charts/BarrasMensuales'
import { Cascada } from '@/components/charts/Cascada'
import { EmptyState } from '@/components/EmptyState'
import { FilaCategoria } from '@/components/FilaCategoria'
import { Money } from '@/components/Money'
import { PageHeader } from '@/components/PageHeader'
import { Panel } from '@/components/Panel'
import { PeriodoPicker } from '@/components/PeriodPickers'
import { buttonVariants } from '@/components/ui/button'
import { esMesUnico, flujoAnio, flujoMes, flujoMulti, serieSaldos, totalesFilas } from '@/lib/calc'
import { etiquetaPeriodo } from '@/lib/format'
import { entrada, escalonado } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { useFinance } from '@/store/context'

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
  const anual = state.mes === null
  const unico = esMesUnico(state.mes)
  const { ingresos, egresos, saldoInicial } = anual ? flujoAnio(state) : unico ? flujoMes(state, state.mes) : flujoMulti(state, state.mes)
  const ti = totalesFilas(ingresos)
  const te = totalesFilas(egresos)
  const saldoFinal = saldoInicial + ti.real - te.real
  const pasos = [
    { clave: 'inicial', label: 'Saldo inicial', valor: saldoInicial, desde: 0, hasta: saldoInicial, color: 'var(--chart-5)' },
    { clave: 'ingresos', label: anual ? 'Ingresos del año' : 'Ingresos del mes', valor: ti.real, tone: 'positive', desde: saldoInicial, hasta: saldoInicial + ti.real, color: 'var(--leaf)' },
    { clave: 'egresos', label: anual ? 'Egresos del año' : 'Egresos del mes', valor: te.real, desde: saldoInicial + ti.real, hasta: saldoFinal, color: 'var(--chart-3)' },
    { clave: 'final', label: 'Saldo final', valor: saldoFinal, final: true, desde: 0, hasta: saldoFinal, color: 'var(--forest)' },
  ]
  const descripcion = unico ? 'Cómo se mueve tu dinero durante el mes.' : etiquetaPeriodo(state.mes, state.anio)

  return (
    <div className="grid gap-5">
      <PageHeader title="Flujo de caja" description={descripcion}>
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
          <Panel className={entrada}>
            <ul className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-4">
              {pasos.map((p) => (
                <li key={p.clave} className="min-w-0 sm:text-center">
                  <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground sm:justify-center md:text-sm">
                    <span className="size-2 shrink-0 rounded-full" style={{ background: p.color }} aria-hidden="true" />
                    {p.label}
                  </p>
                  <Money value={p.valor} tone={p.tone} className={cn('mt-1 block text-lg font-bold tracking-tight md:text-2xl', p.final && 'text-forest')} />
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <Cascada pasos={pasos} />
            </div>
          </Panel>
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
