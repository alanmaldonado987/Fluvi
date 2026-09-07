import { CalendarRange, ChartPie, ChevronDown, ListTree, MoreHorizontal, Pencil, PiggyBank, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { BarrasComparativas } from '@/components/charts/BarrasComparativas'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'
import { CategoriaIcono } from '@/components/CategoriaIcono'
import { FilaCategoria } from '@/components/FilaCategoria'
import { MetaDialog } from '@/components/MetaDialog'
import { Money } from '@/components/Money'
import { NombreDialog } from '@/components/NombreDialog'
import { NuevaFilaForm } from '@/components/NuevaFilaForm'
import { PageHeader } from '@/components/PageHeader'
import { Panel } from '@/components/Panel'
import { Progreso } from '@/components/Progreso'
import { PeriodoPicker } from '@/components/PeriodPickers'
import { StatCard } from '@/components/StatCard'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { avance, describirCategoria, desglose, flujoMes, progresoMeta, totalesFilas } from '@/lib/calc'
import { fechaCorta, MESES } from '@/lib/format'
import { useFormatoMoneda } from '@/lib/privado'
import { entrada, escalonado } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { useFinance } from '@/store/context'

function AccionesCategoria({ nombre, onRenombrar, onSubcategorias, onCopiar, onEliminar }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8" aria-label={`Opciones de ${nombre}`} />}>
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuItem onClick={onRenombrar}>
          <Pencil /> Renombrar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onSubcategorias}>
          <ListTree /> Subcategorías
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onCopiar}>
          <CalendarRange /> Usar este valor el resto del año
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onEliminar}>
          <Trash2 /> Eliminar categoría
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function Subcategorias({ padre, filas, onAgregar, onRenombrar, onEliminar }) {
  return (
    <div className={cn('mt-3 rounded-xl bg-muted/50 p-3', entrada)}>
      {filas.length ? (
        <ul className="divide-y divide-border/60">
          {filas.map((f) => (
            <li key={f.id ?? 'directo'} className="flex items-center gap-1 py-1 text-sm">
              <span className={cn('min-w-0 flex-1 truncate', f.id ? 'font-medium' : 'text-muted-foreground')}>{f.nombre}</span>
              <Money value={f.valor} className="font-semibold" />
              {f.id ? (
                <span className="flex">
                  <Button variant="ghost" size="icon" className="size-7" aria-label={`Renombrar ${f.nombre}`} onClick={() => onRenombrar(f)}>
                    <Pencil />
                  </Button>
                  <Button variant="ghost" size="icon" className="size-7" aria-label={`Eliminar ${f.nombre}`} onClick={() => onEliminar(f)}>
                    <Trash2 />
                  </Button>
                </span>
              ) : (
                <span className="w-14" />
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Sin subcategorías todavía. Sirven para saber en qué se fue el gasto sin cambiar el presupuesto.</p>
      )}
      <NuevaFilaForm className="mt-2" placeholder={`Nueva subcategoría de ${padre.nombre}`} onAgregar={onAgregar} />
    </div>
  )
}

function Metas() {
  const { state, actions } = useFinance()
  const formatCOP = useFormatoMoneda()
  const [editando, setEditando] = useState(null)
  const [abierto, setAbierto] = useState(false)
  const [porEliminar, setPorEliminar] = useState(null)
  const [confirmando, setConfirmando] = useState(false)
  const mapa = new Map(state.categorias.map((c) => [c.id, c]))
  const abrir = (meta) => {
    setEditando(meta)
    setAbierto(true)
  }
  const detalle = (p) => {
    if (p.cumplida) return 'Meta cumplida'
    if (p.vencida) return `Venció y faltan ${formatCOP(p.restante)}`
    if (p.mensual) return `Faltan ${formatCOP(p.restante)}: ${formatCOP(Math.ceil(p.mensual))} al mes durante ${p.meses} ${p.meses === 1 ? 'mes' : 'meses'}`
    return `Faltan ${formatCOP(p.restante)}`
  }
  return (
    <div className="grid gap-5">
      <div className="flex justify-end">
        <Button onClick={() => abrir(null)} disabled={!state.categorias.length}>
          <Plus /> Nueva meta
        </Button>
      </div>
      {state.metas.length ? (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {state.metas.map((meta, i) => {
            const p = progresoMeta(state, meta)
            const { etiqueta, icono } = describirCategoria(mapa, meta.categoriaId)
            return (
              <li key={meta.id} className={cn('rounded-2xl bg-card p-4 ring-1 ring-border', entrada)} style={escalonado(i)}>
                <div className="flex items-start gap-3">
                  <CategoriaIcono nombre={icono} tipo={mapa.get(meta.categoriaId)?.tipo} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{meta.nombre}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {etiqueta}
                      {meta.fechaLimite ? `, hasta el ${fechaCorta(meta.fechaLimite)} de ${meta.fechaLimite.slice(0, 4)}` : ''}
                    </p>
                  </div>
                  <span className="flex shrink-0">
                    <Button variant="ghost" size="icon" className="size-8" aria-label={`Editar ${meta.nombre}`} onClick={() => abrir(meta)}>
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label={`Eliminar ${meta.nombre}`}
                      onClick={() => {
                        setPorEliminar(meta)
                        setConfirmando(true)
                      }}
                    >
                      <Trash2 />
                    </Button>
                  </span>
                </div>
                <p className="mt-3">
                  <Money value={p.ahorrado} className="text-2xl font-bold tracking-tight" />{' '}
                  <span className="text-sm text-muted-foreground">
                    de <Money value={meta.objetivo} />
                  </span>
                </p>
                <Progreso valor={p.avance} tone={p.vencida ? 'negative' : 'positive'} className="mt-2" />
                <p className={cn('mt-2 text-xs', p.vencida ? 'font-semibold text-negative' : 'text-muted-foreground')}>{detalle(p)}</p>
              </li>
            )
          })}
        </ul>
      ) : (
        <EmptyState icon={PiggyBank} title="Sin metas de ahorro" description="Define cuánto quieres reunir y para cuándo. Los movimientos de la categoría que elijas cuentan como aportes." />
      )}
      <MetaDialog open={abierto} onOpenChange={setAbierto} meta={editando} onGuardar={(datos) => (editando ? actions.editar('metas', editando.id, datos) : actions.agregar('metas', datos))} />
      <ConfirmDialog
        open={confirmando}
        onOpenChange={setConfirmando}
        title={`¿Eliminar "${porEliminar?.nombre}"?`}
        description="Los movimientos registrados se conservan. Solo se borra la meta."
        onConfirm={() => {
          actions.eliminar('metas', porEliminar.id)
          setConfirmando(false)
        }}
      />
    </div>
  )
}

export default function Presupuesto() {
  const { state, actions } = useFinance()
  const { state: navegacion } = useLocation()
  const [tipo, setTipo] = useState(() => navegacion?.tab ?? 'Egreso')
  const [abiertas, setAbiertas] = useState(() => new Set())
  const [renombrando, setRenombrando] = useState(null)
  const [porEliminar, setPorEliminar] = useState(null)
  const [confirmando, setConfirmando] = useState(false)
  const { mes } = state
  const egreso = tipo === 'Egreso'
  const flujo = flujoMes(state, mes)
  const filas = egreso ? flujo.egresos : flujo.ingresos
  const t = totalesFilas(filas)
  const porcentaje = Math.round(avance(t.proyectado, t.real) * 100)
  const cumplidas = filas.filter((f) => (egreso ? f.real > f.proyectado : f.proyectado && f.real >= f.proyectado)).length
  const hijasDe = (id) => state.categorias.filter((c) => c.padreId === id)
  const usos = porEliminar ? state.movimientos.filter((m) => m.categoriaId === porEliminar.id || hijasDe(porEliminar.id).some((h) => h.id === m.categoriaId)).length : 0

  const alternar = (id) =>
    setAbiertas((prev) => {
      const siguiente = new Set(prev)
      if (siguiente.has(id)) siguiente.delete(id)
      else siguiente.add(id)
      return siguiente
    })
  const pedirEliminar = (categoria) => {
    setPorEliminar(categoria)
    setConfirmando(true)
  }
  const descripcionEliminar = () => {
    if (!porEliminar) return ''
    if (usos) return `Tiene ${usos} ${usos === 1 ? 'movimiento asociado' : 'movimientos asociados'}. Elimínalos o cámbialos de categoría antes.`
    if (porEliminar.padreId) return 'Se borrará la subcategoría. Los movimientos futuros podrán ir a la categoría principal.'
    const hijas = hijasDe(porEliminar.id).length
    return hijas ? `También se borrarán sus ${hijas} ${hijas === 1 ? 'subcategoría' : 'subcategorías'} y su presupuesto de todos los meses.` : 'También se borrará su presupuesto de todos los meses.'
  }

  return (
    <div className="grid gap-5">
      <PageHeader title="Presupuesto" description="Lo que proyectas frente a lo que pasa, mes a mes.">
        <PeriodoPicker />
      </PageHeader>
      <Tabs value={tipo} onValueChange={setTipo}>
        <TabsList>
          <TabsTrigger value="Egreso">Egresos</TabsTrigger>
          <TabsTrigger value="Ingreso">Ingresos</TabsTrigger>
          <TabsTrigger value="Metas">Metas</TabsTrigger>
        </TabsList>
        <TabsContent value={tipo} className="grid gap-5 text-base">
          {tipo === 'Metas' ? (
            <Metas />
          ) : (
            <>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <StatCard label={`Proyectado en ${MESES[mes].toLowerCase()}`} value={t.proyectado} />
            <StatCard label={egreso ? 'Gastado' : 'Recibido'} value={t.real} tone={egreso && t.real > t.proyectado ? 'negative' : 'positive'} hint={`${porcentaje}% de lo proyectado`} />
            <StatCard label={egreso ? 'Disponible' : 'Pendiente por recibir'} value={Math.max(t.diferencia, 0)} tone={egreso && t.diferencia < 0 ? 'negative' : undefined} hint={egreso && t.diferencia < 0 ? 'Presupuesto agotado' : undefined} />
            <StatCard label={egreso ? 'Categorías excedidas' : 'Categorías completas'} value={`${cumplidas} de ${filas.length}`} />
          </div>
          <div className="grid gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <Panel title={`Categorías de ${tipo.toLowerCase()}`} action={<p className="hidden text-xs text-muted-foreground md:block">Edita el valor proyectado en cada fila</p>}>
              {filas.length ? (
                <ul className="[&>li]:border-b 2xl:grid 2xl:grid-cols-2 2xl:gap-x-8">
                  {filas.map((f, i) => {
                    const hijas = hijasDe(f.id)
                    const abierta = abiertas.has(f.id)
                    return (
                      <FilaCategoria
                        key={f.id}
                        categoria={f}
                        proyectado={f.proyectado}
                        real={f.real}
                        onProyectado={(valor) => actions.setPresupuesto(mes, f.id, valor)}
                        className={entrada}
                        style={escalonado(i)}
                        acciones={
                          <AccionesCategoria
                            nombre={f.nombre}
                            onRenombrar={() => setRenombrando(f)}
                            onSubcategorias={() => alternar(f.id)}
                            onCopiar={() => actions.copiarPresupuesto(mes, f.id, f.proyectado)}
                            onEliminar={() => pedirEliminar(f)}
                          />
                        }
                      >
                        {hijas.length || abierta ? (
                          <>
                            <button type="button" onClick={() => alternar(f.id)} aria-expanded={abierta} className="mt-2 inline-flex items-center gap-1 rounded-md text-xs font-semibold text-forest focus-visible:outline-2 focus-visible:outline-ring">
                              <ChevronDown className={cn('size-4 transition-transform duration-200 ease-out', abierta && 'rotate-180')} aria-hidden="true" />
                              {hijas.length ? `${hijas.length} ${hijas.length === 1 ? 'subcategoría' : 'subcategorías'}` : 'Subcategorías'}
                            </button>
                            {abierta ? (
                              <Subcategorias
                                padre={f}
                                filas={desglose(state, mes, f.id)}
                                onAgregar={(nombre) => actions.agregar('categorias', { nombre, tipo: f.tipo, padreId: f.id })}
                                onRenombrar={setRenombrando}
                                onEliminar={pedirEliminar}
                              />
                            ) : null}
                          </>
                        ) : null}
                      </FilaCategoria>
                    )
                  })}
                </ul>
              ) : (
                <EmptyState icon={ChartPie} title={`Sin categorías de ${tipo.toLowerCase()}`} description="Agrega la primera con el campo de abajo. Después podrás proyectar un valor para cada mes." />
              )}
              <NuevaFilaForm className="mt-4" placeholder={`Nueva categoría de ${tipo.toLowerCase()}`} onAgregar={(nombre) => actions.agregar('categorias', { nombre, tipo })} />
            </Panel>
            {filas.length ? (
              <Panel title="Proyectado frente a real" className="xl:sticky xl:top-6 xl:self-start">
                <BarrasComparativas filas={filas} etiquetaReal={egreso ? 'Gastado' : 'Recibido'} />
              </Panel>
            ) : null}
          </div>
            </>
          )}
        </TabsContent>
      </Tabs>
      <NombreDialog
        open={renombrando !== null}
        onOpenChange={(abierto) => {
          if (!abierto) setRenombrando(null)
        }}
        title={renombrando?.padreId ? 'Renombrar subcategoría' : 'Renombrar categoría'}
        valor={renombrando?.nombre ?? ''}
        onGuardar={(nombre) => actions.editar('categorias', renombrando.id, { nombre })}
      />
      <ConfirmDialog
        open={confirmando}
        onOpenChange={setConfirmando}
        title={`¿Eliminar "${porEliminar?.nombre}"?`}
        description={descripcionEliminar()}
        disabled={usos > 0}
        onConfirm={() => {
          actions.eliminar('categorias', porEliminar.id)
          setConfirmando(false)
        }}
      />
    </div>
  )
}
