import { AlertTriangle, ChartPie, FileSpreadsheet, Plus, Sparkles } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { BotonFlotante } from '@/components/BotonFlotante'
import { BarrasCategorias } from '@/components/charts/BarrasCategorias'
import { LineasAnual } from '@/components/charts/LineasAnual'
import { EmptyState } from '@/components/EmptyState'
import { FilaCategoria } from '@/components/FilaCategoria'
import { Money } from '@/components/Money'
import { MovimientoItem } from '@/components/MovimientoItem'
import { PageHeader } from '@/components/PageHeader'
import { PendientesRecurrentes } from '@/components/PendientesRecurrentes'
import { Panel } from '@/components/Panel'
import { PeriodoPicker } from '@/components/PeriodPickers'
import { Progreso } from '@/components/Progreso'
import { NotasMes } from '@/components/NotasMes'
import { Recordatorios } from '@/components/Recordatorios'
import { StatCard } from '@/components/StatCard'
import { buttonVariants } from '@/components/ui/button'
import { avance, clave, describirMovimiento, distribucionEgresos, nombreBilletera, excedidas, flujoMes, movimientosDe, progresoMeta, saldoBilleteras, serieAnual, totales, totalesFilas } from '@/lib/calc'
import { anioDe, MESES } from '@/lib/format'
import { useFormatoMoneda } from '@/lib/privado'
import { iconoBilletera } from '@/lib/iconos'
import { entrada, escalonado } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { useAuth } from '@/store/auth'
import { useFinance } from '@/store/context'

const enlace = 'text-sm font-semibold text-forest underline-offset-4 hover:underline'

function Alertas({ lista, hayMovimientos }) {
  const formatCOP = useFormatoMoneda()
  if (!hayMovimientos) return null
  if (lista.length === 0) {
    return (
      <p className="flex items-center gap-3 rounded-2xl bg-positive-soft px-4 py-3 text-sm font-semibold text-positive">
        <Sparkles className="size-5 shrink-0" aria-hidden="true" />
        Mes saludable: todos los egresos están dentro del presupuesto.
      </p>
    )
  }
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl bg-negative-soft px-4 py-3 text-sm text-negative">
      <p className="flex items-center gap-2 font-bold">
        <AlertTriangle className="size-5 shrink-0" aria-hidden="true" />
        {lista.length === 1 ? 'Una categoría supera' : `${lista.length} categorías superan`} el presupuesto
      </p>
      <ul className="flex flex-wrap gap-x-5 gap-y-1">
        {lista.map((c) => (
          <li key={c.id} className="flex gap-2">
            <span className="font-semibold">{c.nombre}</span>
            <span className="tabular-nums">
              {formatCOP(c.real)} de {formatCOP(c.proyectado)}
            </span>
          </li>
        ))}
      </ul>
      <Link to="/flujo" className="font-semibold underline underline-offset-4 md:ml-auto">
        Ver flujo de caja
      </Link>
    </div>
  )
}

export default function Dashboard() {
  const { state } = useFinance()
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const { anio, mes } = state
  const movs = movimientosDe(state.movimientos, anio, mes)
  const { ingresos, egresos, neto } = totales(movs)
  const { egresos: filasEgresos } = flujoMes(state, mes)
  const te = totalesFilas(filasEgresos)
  const destacadas = filasEgresos
    .filter((f) => f.proyectado || f.real)
    .sort((a, b) => avance(b.proyectado, b.real) - avance(a.proyectado, a.real))
    .slice(0, 4)
  const recientes = state.movimientos
    .filter((m) => anioDe(m.fecha) === anio)
    .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.consecutivo - a.consecutivo)
    .slice(0, 5)
  const mapa = new Map(state.categorias.map((c) => [c.id, c]))
  const distribucion = distribucionEgresos(state, movs)
  const billeteras = state.billeteras.map((b) => ({ ...b, saldo: state.saldos[clave(anio, mes, b.id)] || 0 }))
  const sinConfigurar = state.categorias.length === 0 && state.billeteras.length === 0
  const tasaAhorro = ingresos ? Math.round((neto / ingresos) * 100) : null
  const cuentaIngresos = movs.filter((m) => m.tipo === 'Ingreso').length
  const nombreMes = MESES[mes].toLowerCase()

  return (
    <div className="grid gap-5">
      <PageHeader title="Inicio" description={`${MESES[mes]} ${anio} de un vistazo.`}>
        <PeriodoPicker />
        {state.categorias.length ? (
          <Link to="/movimientos" state={{ nuevo: true }} className={cn(buttonVariants(), 'hidden md:inline-flex')}>
            <Plus /> Nuevo movimiento
          </Link>
        ) : null}
      </PageHeader>

      {sinConfigurar ? (
        <EmptyState icon={ChartPie} title="Empieza por tu presupuesto" description="Crea tus categorías de ingresos y egresos. Luego registra tus billeteras y tus primeros movimientos.">
          <div className="flex flex-wrap justify-center gap-2">
            <Link to="/presupuesto" className={buttonVariants()}>
              Crear categorías
            </Link>
            <Link to="/importar" className={buttonVariants({ variant: 'outline' })}>
              <FileSpreadsheet /> Importar desde Excel
            </Link>
          </div>
        </EmptyState>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <StatCard destacado label="Saldo en billeteras" value={saldoBilleteras(state, mes)} hint={`${billeteras.length} ${billeteras.length === 1 ? 'billetera' : 'billeteras'}`} className={entrada} style={escalonado(0)} />
            <StatCard label="Ingresos del mes" value={ingresos} tone="positive" hint={`${cuentaIngresos} ${cuentaIngresos === 1 ? 'registrado' : 'registrados'}`} className={entrada} style={escalonado(1)} />
            <StatCard label="Egresos del mes" value={egresos} hint={te.proyectado ? `${Math.round(avance(te.proyectado, te.real) * 100)}% del presupuesto` : 'Sin presupuesto definido'} className={entrada} style={escalonado(2)} />
            <StatCard label="Ahorro neto" value={neto} tone={neto < 0 ? 'negative' : 'positive'} hint={tasaAhorro == null ? 'Sin ingresos este mes' : `${tasaAhorro}% de los ingresos`} className={entrada} style={escalonado(3)} />
          </div>

          {usuario.preferencias.alertasPresupuesto ? <Alertas lista={excedidas(filasEgresos)} hayMovimientos={movs.length > 0} /> : null}
          <Recordatorios />
          {usuario.preferencias.pendientesInicio ? <PendientesRecurrentes /> : null}
          {state.metas.length ? (
            <Panel
              title="Metas de ahorro"
              action={
                <Link to="/presupuesto" state={{ tab: 'Metas' }} className={enlace}>
                  Ver todas
                </Link>
              }
            >
              <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {state.metas.slice(0, 3).map((meta, i) => {
                  const p = progresoMeta(state, meta)
                  return (
                    <li key={meta.id} className={entrada} style={escalonado(i)}>
                      <div className="flex justify-between gap-3 text-sm">
                        <span className="truncate font-semibold">{meta.nombre}</span>
                        <span className="shrink-0 text-muted-foreground">
                          <Money value={p.ahorrado} className="font-semibold text-foreground" /> de <Money value={meta.objetivo} />
                        </span>
                      </div>
                      <Progreso valor={p.avance} className="mt-2" />
                    </li>
                  )
                })}
              </ul>
            </Panel>
          ) : null}

          <div className="grid gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <Panel title={`Ingresos y egresos ${anio}`} className="flex flex-col">
              <div className="min-h-64 flex-1">
                <LineasAnual datos={serieAnual(state.movimientos, anio)} height="100%" />
              </div>
            </Panel>
            <Panel
              title={`Presupuesto de ${nombreMes}`}
              action={
                <Link to="/presupuesto" className={enlace}>
                  Ver todo
                </Link>
              }
            >
              <p className="text-sm text-muted-foreground">
                <Money value={te.real} className="font-semibold text-foreground" /> gastados de <Money value={te.proyectado} /> proyectados
              </p>
              <Progreso valor={avance(te.proyectado, te.real)} tone={te.real > te.proyectado ? 'negative' : 'positive'} className="mt-2" />
              {destacadas.length ? (
                <ul className="mt-2 divide-y">
                  {destacadas.map((f, i) => (
                    <FilaCategoria key={f.id} categoria={f} proyectado={f.proyectado} real={f.real} className={entrada} style={escalonado(i)} />
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">Aún no hay presupuesto ni gastos este mes.</p>
              )}
            </Panel>
          </div>

          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            <Panel title={`Egresos de ${nombreMes}`}>
              {distribucion.length ? <BarrasCategorias datos={distribucion} /> : <p className="text-sm text-muted-foreground">Aún no hay egresos este mes.</p>}
            </Panel>
            <Panel
              title="Últimos movimientos"
              action={
                <Link to="/movimientos" className={enlace}>
                  Ver todos
                </Link>
              }
            >
              {recientes.length ? (
                <ul className="divide-y">
                  {recientes.map((m, i) => (
                    <MovimientoItem
                      key={m.id}
                      movimiento={m}
                      categoria={describirMovimiento(mapa, state.billeteras, m).etiqueta}
                      icono={describirMovimiento(mapa, state.billeteras, m).icono}
                      billetera={m.tipo !== 'Transferencia' && m.billeteraId ? nombreBilletera(state.billeteras, m.billeteraId) : null}
                      onEditar={() => navigate('/movimientos')}
                      className={entrada}
                      style={escalonado(i)}
                    />
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Registra tu primer movimiento para verlo aquí.</p>
              )}
            </Panel>
            <Panel
              title="Billeteras"
              action={
                <Link to="/billeteras" className={enlace}>
                  Ver todas
                </Link>
              }
            >
              {billeteras.length ? (
                <ul className="divide-y">
                  {billeteras.map((b, i) => (
                    <li key={b.id} className={cn('flex items-center gap-3 py-2.5', entrada)} style={escalonado(i)}>
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-mint text-forest" aria-hidden="true">
                        {iconoBilletera(b.nombre)}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-semibold">{b.nombre}</span>
                      <Money value={b.saldo} className="font-bold" />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Agrega tus cuentas y el efectivo para ver el saldo aquí.</p>
              )}
            </Panel>
          </div>
          <NotasMes />
          <BotonFlotante label="Nuevo movimiento" onClick={() => navigate('/movimientos', { state: { nuevo: true } })} />
        </>
      )}
    </div>
  )
}
