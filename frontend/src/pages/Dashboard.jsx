import { Anillo } from '@/components/Anillo'
import { ArrowDownLeft, ArrowUpRight, ChartPie, FileSpreadsheet, PiggyBank, Plus, Wallet } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { BotonFlotante } from '@/components/BotonFlotante'
import { BarrasCategorias } from '@/components/charts/BarrasCategorias'
import { LineasAnual } from '@/components/charts/LineasAnual'
import { EmptyState } from '@/components/EmptyState'
import { EstadoMes } from '@/components/EstadoMes'
import { FilaCategoria } from '@/components/FilaCategoria'
import { Money } from '@/components/Money'
import { MovimientoItem } from '@/components/MovimientoItem'
import { PageHeader } from '@/components/PageHeader'
import { PendientesRecurrentes } from '@/components/PendientesRecurrentes'
import { Panel } from '@/components/Panel'
import { PeriodoPicker } from '@/components/PeriodPickers'
import { Progreso } from '@/components/Progreso'
import { NotasMes } from '@/components/NotasMes'
import { StatCard } from '@/components/StatCard'
import { buttonVariants } from '@/components/ui/button'
import { avance, clave, describirMovimiento, distribucionEgresos, esMesUnico, nombreBilletera, excedidas, flujoAnio, flujoMes, flujoMulti, movsFiltrados, periodoAnterior, progresoMeta, saldoVivoBilletera, saldoVivoBilleteras, serieAnual, totales, totalesFilas, variacion } from '@/lib/calc'
import { anioDe, etiquetaPeriodo, MESES } from '@/lib/format'
import { iconoBilletera } from '@/lib/iconos'
import { entrada, escalonado } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { useAuth } from '@/store/auth'
import { useFinance } from '@/store/context'

const enlace = 'text-sm font-semibold text-forest underline-offset-4 hover:underline'

export default function Dashboard() {
  const { state } = useFinance()
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const { anio, mes } = state
  const anual = mes === null
  const unico = esMesUnico(mes)
  const movs = movsFiltrados(state.movimientos, anio, mes)
  const { ingresos, egresos, neto } = totales(movs)
  const flujo = anual ? flujoAnio(state) : unico ? flujoMes(state, mes) : flujoMulti(state, mes)
  const filasEgresos = flujo.egresos
  const te = totalesFilas(filasEgresos)
  const cumplidas = filasEgresos.filter((f) => f.proyectado > 0 && f.real === f.proyectado)
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
  const mesVivo = unico ? mes : Array.isArray(mes) ? Math.max(...mes) : new Date().getMonth()
  const billeteras = state.billeteras.map((b) => ({ ...b, saldo: saldoVivoBilletera(state, mesVivo, b.id) }))
  const sinConfigurar = state.categorias.length === 0 && state.billeteras.length === 0
  const tasaAhorro = ingresos ? Math.round((neto / ingresos) * 100) : null
  const cuentaIngresos = movs.filter((m) => m.tipo === 'Ingreso').length
  const etiqueta = etiquetaPeriodo(mes, anio)
  const anterior = periodoAnterior(state)
  const totAnterior = anterior ? totales(anterior.movs) : null
  const vIngresos = totAnterior && variacion(ingresos, totAnterior.ingresos)
  const vEgresos = totAnterior && variacion(egresos, totAnterior.egresos)
  const vNeto = totAnterior && variacion(neto, totAnterior.neto)
  // `bueno` indica si subir es favorable: sí para ingresos y ahorro, no para egresos.
  const cambio = (pct, subirEsBueno) => (pct == null ? null : { pct, etiqueta: anterior.etiqueta, corta: anterior.corta, bueno: subirEsBueno ? pct >= 0 : pct <= 0 })

  return (
    <div className="grid gap-5">
      <PageHeader
        title="Inicio"
        description={`${etiqueta} de un vistazo.`}
        extra={!sinConfigurar && usuario.preferencias.alertasPresupuesto ? <EstadoMes excedidas={excedidas(filasEgresos)} cumplidas={cumplidas} hayMovimientos={movs.length > 0} /> : null}
      >
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
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
            <StatCard destacado grande icon={Wallet} label="Saldo en billeteras" value={saldoVivoBilleteras(state, mesVivo)} hint={`${billeteras.length} ${billeteras.length === 1 ? 'billetera' : 'billeteras'}`} className={cn('col-span-2', entrada)} style={escalonado(0)} />
            <StatCard label="Ingresos" icon={ArrowDownLeft} value={ingresos} tone="positive" hint={`${cuentaIngresos} ${cuentaIngresos === 1 ? 'registrado' : 'registrados'}`} variacion={cambio(vIngresos, true)} className={entrada} style={escalonado(1)} />
            <StatCard label="Egresos" icon={ArrowUpRight} value={egresos} tone="negative" hint={te.proyectado ? `${Math.round(avance(te.proyectado, te.real) * 100)}% del presupuesto` : 'Sin presupuesto definido'} variacion={cambio(vEgresos, false)} className={entrada} style={escalonado(2)} />
            <StatCard label="Ahorro neto" icon={PiggyBank} value={neto} tone={neto < 0 ? 'negative' : 'positive'} hint={tasaAhorro == null ? 'Sin ingresos' : `${tasaAhorro}% de los ingresos`} variacion={cambio(vNeto, true)} className={cn('col-span-2 xl:col-span-1', entrada)} style={escalonado(3)} />
          </div>

          {usuario.preferencias.pendientesInicio ? <PendientesRecurrentes /> : null}

          <div className="grid gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
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
              title={`Presupuesto de ${etiqueta}`}
              action={
                <Link to="/presupuesto" className={enlace}>
                  Ver todo
                </Link>
              }
            >
              <p className="text-sm text-muted-foreground">
                <Money value={te.real} tone="negative" className="font-semibold" /> gastados de <Money value={te.proyectado} /> proyectados
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

          <div className={cn('grid gap-5 lg:grid-cols-2', state.metas.length > 0 && 'xl:grid-cols-3')}>
            <Panel title={`Egresos de ${etiqueta}`}>
              {distribucion.length ? <BarrasCategorias datos={distribucion} /> : <p className="text-sm text-muted-foreground">Aún no hay egresos este mes.</p>}
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
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-mint text-forest" aria-hidden="true">
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
            {state.metas.length ? (
              <Panel
                title="Metas de ahorro"
                action={
                  <Link to="/presupuesto" state={{ tab: 'Metas' }} className={enlace}>
                    Ver todas
                  </Link>
                }
              >
                <ul className="grid gap-4">
                  {state.metas.slice(0, 3).map((meta, i) => {
                    const p = progresoMeta(state, meta)
                    return (
                      <li key={meta.id} className={cn('flex items-center gap-3', entrada)} style={escalonado(i)}>
                        <Anillo valor={p.avance} tone={p.vencida ? 'negative' : 'positive'} />
                        <div className="min-w-0 text-sm">
                          <p className="truncate font-semibold">{meta.nombre}</p>
                          <p className="truncate text-muted-foreground">
                            <Money value={p.ahorrado} className="font-semibold text-foreground" /> de <Money value={meta.objetivo} />
                          </p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </Panel>
            ) : null}
          </div>

          <Panel title={`Ingresos y egresos ${anio}`} className="flex flex-col">
            <div className="min-h-64 flex-1">
              <LineasAnual datos={serieAnual(state.movimientos, anio)} height="100%" mesActual={anio === new Date().getFullYear() ? new Date().getMonth() : null} />
            </div>
          </Panel>

          <NotasMes />
          <BotonFlotante label="Nuevo movimiento" onClick={() => navigate('/movimientos', { state: { nuevo: true } })} />
        </>
      )}
    </div>
  )
}
