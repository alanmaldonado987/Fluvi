import { ArrowLeftRight, FileSpreadsheet, Plus, Search, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { BotonFlotante } from '@/components/BotonFlotante'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'
import { Money } from '@/components/Money'
import { MovimientoDialog } from '@/components/MovimientoDialog'
import { columnasMovimiento, MovimientoItem } from '@/components/MovimientoItem'
import { PageHeader } from '@/components/PageHeader'
import { PendientesRecurrentes } from '@/components/PendientesRecurrentes'
import { Panel } from '@/components/Panel'
import { PeriodoPicker } from '@/components/PeriodPickers'
import { Progreso } from '@/components/Progreso'
import { RecurrentesPanel } from '@/components/RecurrentesPanel'
import { SelectField } from '@/components/SelectField'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { describirMovimiento, distribucionEgresos, indicePadres, movimientosDe, nombreBilletera, principales, totales } from '@/lib/calc'
import { anioDe, diasAtras, fechaLarga, hoy, MESES, mesDe } from '@/lib/format'
import { useFormatoMoneda } from '@/lib/privado'
import { entrada, escalonado } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { useFinance } from '@/store/context'

const tipos = [
  ['todos', 'Todos'],
  ['Ingreso', 'Ingresos'],
  ['Egreso', 'Egresos'],
  ['Transferencia', 'Transferencias'],
]
const alcances = [
  { value: 'mes', label: 'Solo este mes' },
  { value: 'anio', label: 'Todo el año' },
]
const filtroInicial = { tipo: 'todos', categoriaId: 'todas', billeteraId: 'todas', texto: '', alcance: 'mes' }

const etiquetaDia = (fecha) => (fecha === hoy() ? 'Hoy' : fecha === diasAtras(1) ? 'Ayer' : fechaLarga(fecha))

function Resumen({ titulo, movs, distribucion }) {
  const { ingresos, egresos, neto } = totales(movs)
  const mayor = distribucion[0]?.valor || 1
  return (
    <aside className="grid gap-5 lg:sticky lg:top-6 lg:self-start">
      <Panel title={titulo}>
        <dl className="grid gap-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Ingresos</dt>
            <dd>
              <Money value={ingresos} tone="positive" className="font-semibold" />
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Egresos</dt>
            <dd>
              <Money value={egresos} className="font-semibold" />
            </dd>
          </div>
          <div className="flex justify-between gap-3 border-t pt-2">
            <dt className="font-semibold">Neto</dt>
            <dd>
              <Money value={neto} tone={neto < 0 ? 'negative' : 'positive'} className="font-bold" />
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-muted-foreground">
          {movs.length} {movs.length === 1 ? 'movimiento registrado' : 'movimientos registrados'}
        </p>
      </Panel>
      {distribucion.length ? (
        <Panel title="Egresos por categoría">
          <ul className="grid gap-3">
            {distribucion.slice(0, 6).map((d) => (
              <li key={d.nombre}>
                <div className="flex justify-between gap-3 text-sm">
                  <span className="truncate">{d.nombre}</span>
                  <Money value={d.valor} className="font-semibold" />
                </div>
                <Progreso valor={d.valor / mayor} tone="neutral" className="mt-1 h-1.5" />
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
      <RecurrentesPanel />
    </aside>
  )
}

export default function Movimientos() {
  const { state, actions } = useFinance()
  const formatCOP = useFormatoMoneda()
  const { state: navegacion } = useLocation()
  const [filtro, setFiltro] = useState(filtroInicial)
  const [editando, setEditando] = useState(null)
  const [formularioAbierto, setFormularioAbierto] = useState(() => Boolean(navegacion?.nuevo))
  const [porEliminar, setPorEliminar] = useState(null)
  const [confirmando, setConfirmando] = useState(false)

  const cambiar = (cambios) => setFiltro((f) => ({ ...f, ...cambios }))
  const limpiar = () => setFiltro({ ...filtroInicial, alcance: filtro.alcance })
  const mapa = new Map(state.categorias.map((c) => [c.id, c]))
  const padres = indicePadres(state.categorias)
  const describir = (m) => describirMovimiento(mapa, state.billeteras, m)
  const billeteraDe = (m) => (m.tipo !== 'Transferencia' && m.billeteraId ? nombreBilletera(state.billeteras, m.billeteraId) : null)
  const categorias = [
    { value: 'todas', label: 'Todas las categorías' },
    ...principales(state.categorias)
      .filter((c) => filtro.tipo === 'todos' || c.tipo === filtro.tipo)
      .flatMap((p) => [{ value: p.id, label: p.nombre }, ...state.categorias.filter((c) => c.padreId === p.id).map((h) => ({ value: h.id, label: `${p.nombre} / ${h.nombre}` }))]),
  ]
  const billeteras = [{ value: 'todas', label: 'Todas las billeteras' }, ...state.billeteras.map((b) => ({ value: b.id, label: b.nombre }))]
  const texto = filtro.texto.trim().toLowerCase()
  const anual = state.mes === null || filtro.alcance === 'anio'
  const base = anual ? state.movimientos.filter((m) => anioDe(m.fecha) === state.anio) : movimientosDe(state.movimientos, state.anio, state.mes)
  const coincideTexto = (m) => !texto || [m.concepto, m.observacion, String(m.valor), describir(m).etiqueta, billeteraDe(m) ?? ''].some((t) => t.toLowerCase().includes(texto))
  const lista = base
    .filter(
      (m) =>
        (filtro.tipo === 'todos' || m.tipo === filtro.tipo) &&
        (filtro.categoriaId === 'todas' || m.categoriaId === filtro.categoriaId || padres.get(m.categoriaId) === filtro.categoriaId) &&
        (filtro.billeteraId === 'todas' || m.billeteraId === filtro.billeteraId || m.destinoId === filtro.billeteraId) &&
        coincideTexto(m),
    )
    .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.consecutivo - a.consecutivo)
  const filtrado = filtro.tipo !== 'todos' || filtro.categoriaId !== 'todas' || filtro.billeteraId !== 'todas' || texto !== ''
  const grupos = []
  for (const m of lista) {
    const ultimo = grupos.at(-1)
    if (ultimo && ultimo.fecha === m.fecha) ultimo.items.push(m)
    else grupos.push({ fecha: m.fecha, items: [m] })
  }
  const hayCategorias = state.categorias.length > 0

  const abrir = (movimiento) => {
    setEditando(movimiento)
    setFormularioAbierto(true)
  }
  const guardar = (datos, repetir) => {
    if (editando) actions.editar('movimientos', editando.id, datos)
    else if (repetir) actions.agregarConRecurrencia(datos)
    else actions.agregar('movimientos', datos)
    const anio = anioDe(datos.fecha)
    const mes = mesDe(datos.fecha)
    if (anio !== state.anio || (!anual && state.mes !== null && mes !== state.mes)) {
      actions.setPeriodo({ anio, mes })
      toast.info(`Guardado en ${MESES[mes].toLowerCase()} de ${anio}. Te llevamos a ese mes.`)
    }
  }
  const pedirEliminar = (movimiento) => {
    setPorEliminar(movimiento)
    setConfirmando(true)
  }
  let indice = 0

  return (
    <div className="grid gap-5">
      <PageHeader title="Movimientos" description={anual ? `Todo ${state.anio}` : `${MESES[state.mes]} ${state.anio}`} >
        <PeriodoPicker />
        <Link to="/importar" data-tour="importar" className={cn(buttonVariants({ variant: 'outline' }), 'hidden md:inline-flex')}>
          <FileSpreadsheet /> Importar Excel
        </Link>
        <Button className="hidden md:inline-flex" onClick={() => abrir(null)} disabled={!hayCategorias}>
          <Plus /> Nuevo movimiento
        </Button>
      </PageHeader>

      <div className="grid gap-2 md:flex md:flex-wrap md:items-center">
        <Tabs value={filtro.tipo} onValueChange={(tipo) => cambiar({ tipo, categoriaId: 'todas' })}>
          <TabsList className="w-full md:w-auto">
            {tipos.map(([valor, label]) => (
              <TabsTrigger key={valor} value={valor}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        {filtro.tipo === 'Transferencia' ? null : <SelectField aria-label="Categoría" className="md:w-52" value={filtro.categoriaId} onChange={(categoriaId) => cambiar({ categoriaId })} items={categorias} />}
        {state.billeteras.length ? <SelectField aria-label="Billetera" className="md:w-44" value={filtro.billeteraId} onChange={(billeteraId) => cambiar({ billeteraId })} items={billeteras} /> : null}
        <div className="relative md:min-w-56 md:flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input type="search" aria-label="Buscar" className="bg-card pl-9" placeholder="Buscar por concepto, categoría o valor" value={filtro.texto} onChange={(e) => cambiar({ texto: e.target.value })} />
        </div>
        {state.mes !== null ? <SelectField aria-label="Alcance" className="md:w-40" value={filtro.alcance} onChange={(alcance) => cambiar({ alcance })} items={alcances} /> : null}
        {filtrado ? (
          <Button variant="ghost" size="sm" onClick={limpiar}>
            <X /> Limpiar
          </Button>
        ) : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid gap-5">
          <PendientesRecurrentes />
          {lista.length ? (
            <Panel>
              <div className={cn('hidden gap-4 border-b px-1 pb-2 text-xs font-semibold text-muted-foreground md:grid', columnasMovimiento)}>
                <span>Movimiento</span>
                <span>Categoría</span>
                <span>Fecha</span>
                <span className="text-right">Valor</span>
                <span />
              </div>
              {grupos.map((g) => (
                <section key={g.fecha} className="pt-4">
                  <div className="flex items-center justify-between gap-3 px-1">
                    <h3 className="text-xs font-semibold text-muted-foreground">{etiquetaDia(g.fecha)}</h3>
                    <Money value={totales(g.items).neto} signo className="text-xs font-semibold text-muted-foreground" />
                  </div>
                  <ul className="mt-1 divide-y">
                    {g.items.map((m) => (
                      <MovimientoItem
                        key={m.id}
                        tabla
                        movimiento={m}
                        categoria={describir(m).etiqueta}
                        icono={describir(m).icono}
                        billetera={billeteraDe(m)}
                        mostrarFecha={false}
                        onEditar={() => abrir(m)}
                        onEliminar={() => pedirEliminar(m)}
                        className={entrada}
                        style={escalonado(indice++)}
                      />
                    ))}
                  </ul>
                </section>
              ))}
              <div className="flex items-center justify-between border-t px-1 pt-3">
                <span className="text-sm font-semibold text-muted-foreground">Total ({lista.length} movimiento{lista.length !== 1 ? 's' : ''})</span>
                <Money value={totales(lista).neto} signo className="text-sm font-bold" />
              </div>
            </Panel>
          ) : (
            <EmptyState
              icon={ArrowLeftRight}
              title={base.length ? 'Nada coincide con los filtros' : `Sin movimientos en ${anual ? state.anio : MESES[state.mes].toLowerCase()}`}
              description={base.length ? 'Prueba con otra búsqueda o quita los filtros.' : hayCategorias ? 'Registra un ingreso, un egreso o una transferencia para verlo aquí.' : 'Primero crea tus categorías en Presupuesto.'}
            >
              {base.length ? (
                <Button variant="outline" onClick={limpiar}>
                  <X /> Limpiar filtros
                </Button>
              ) : hayCategorias ? (
                <Button onClick={() => abrir(null)}>
                  <Plus /> Nuevo movimiento
                </Button>
              ) : (
                <Link to="/presupuesto" className={buttonVariants()}>
                  Ir a Presupuesto
                </Link>
              )}
            </EmptyState>
          )}
        </div>
        <Resumen titulo={anual ? 'Resumen del año' : 'Resumen del mes'} movs={base} distribucion={distribucionEgresos(state, base)} />
      </div>

      {hayCategorias ? <BotonFlotante label="Nuevo movimiento" onClick={() => abrir(null)} /> : null}
      <MovimientoDialog
        open={formularioAbierto}
        onOpenChange={setFormularioAbierto}
        movimiento={editando}
        onGuardar={guardar}
        onEliminar={() => {
          setFormularioAbierto(false)
          pedirEliminar(editando)
        }}
      />
      <ConfirmDialog
        open={confirmando}
        onOpenChange={setConfirmando}
        title="¿Eliminar este movimiento?"
        description={porEliminar ? `${porEliminar.concepto || describir(porEliminar).etiqueta} por ${formatCOP(porEliminar.valor)}. Esta acción no se puede deshacer.` : ''}
        onConfirm={() => {
          actions.eliminar('movimientos', porEliminar.id)
          setConfirmando(false)
        }}
      />
    </div>
  )
}
