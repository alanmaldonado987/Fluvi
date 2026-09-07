import { MoreHorizontal, Pause, Pencil, Play, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { CategoriaIcono } from '@/components/CategoriaIcono'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Money } from '@/components/Money'
import { Panel } from '@/components/Panel'
import { RecurrenteDialog } from '@/components/RecurrenteDialog'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { describirCategoria } from '@/lib/calc'
import { cn } from '@/lib/utils'
import { useFinance } from '@/store/context'

export function RecurrentesPanel() {
  const { state, actions } = useFinance()
  const [editando, setEditando] = useState(null)
  const [abierto, setAbierto] = useState(false)
  const [porEliminar, setPorEliminar] = useState(null)
  const [confirmando, setConfirmando] = useState(false)
  const mapa = new Map(state.categorias.map((c) => [c.id, c]))
  const abrir = (r) => {
    setEditando(r)
    setAbierto(true)
  }
  return (
    <Panel
      title="Recurrentes"
      action={
        <Button variant="ghost" size="icon" className="size-8" aria-label="Nuevo recurrente" onClick={() => abrir(null)} disabled={!state.categorias.length}>
          <Plus />
        </Button>
      }
    >
      {state.recurrentes.length ? (
        <ul className="divide-y">
          {state.recurrentes.map((r) => {
            const { etiqueta, icono } = describirCategoria(mapa, r.categoriaId)
            const nombre = r.concepto || etiqueta
            return (
              <li key={r.id} className={cn('flex items-center gap-2 py-2', !r.activo && 'opacity-60')}>
                <CategoriaIcono nombre={icono} tipo={r.tipo} className="size-8 [&>svg]:size-4" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{nombre}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    Día {r.dia}
                    {r.activo ? '' : ', pausado'}
                  </span>
                </span>
                <Money value={r.valor} tone={r.tipo === 'Ingreso' ? 'positive' : 'neutral'} signo={r.tipo === 'Ingreso'} className="text-sm font-bold" />
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-7" aria-label={`Opciones de ${nombre}`} />}>
                    <MoreHorizontal />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem onClick={() => abrir(r)}>
                      <Pencil /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => actions.editar('recurrentes', r.id, { activo: !r.activo })}>
                      {r.activo ? <Pause /> : <Play />} {r.activo ? 'Pausar' : 'Reanudar'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => {
                        setPorEliminar(r)
                        setConfirmando(true)
                      }}
                    >
                      <Trash2 /> Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Gastos e ingresos que se repiten cada mes. Créalos aquí o marca "Repetir cada mes" al registrar un movimiento.</p>
      )}
      <RecurrenteDialog open={abierto} onOpenChange={setAbierto} recurrente={editando} onGuardar={(datos) => (editando ? actions.editar('recurrentes', editando.id, datos) : actions.agregar('recurrentes', datos))} />
      <ConfirmDialog
        open={confirmando}
        onOpenChange={setConfirmando}
        title="¿Eliminar este recurrente?"
        description="Los movimientos ya registrados se conservan. Solo deja de proponerse cada mes."
        onConfirm={() => {
          actions.eliminar('recurrentes', porEliminar.id)
          setConfirmando(false)
        }}
      />
    </Panel>
  )
}
