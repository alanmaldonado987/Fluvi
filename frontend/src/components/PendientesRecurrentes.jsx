import { CategoriaIcono } from '@/components/CategoriaIcono'
import { Money } from '@/components/Money'
import { Panel } from '@/components/Panel'
import { Button } from '@/components/ui/button'
import { describirCategoria, pendientes } from '@/lib/calc'
import { MESES } from '@/lib/format'
import { entrada, escalonado } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { useFinance } from '@/store/context'

export function PendientesRecurrentes({ className }) {
  const { state, actions } = useFinance()
  if (state.mes === null) return null
  const lista = pendientes(state, state.mes)
  if (!lista.length) return null
  const mapa = new Map(state.categorias.map((c) => [c.id, c]))
  return (
    <Panel title={`Recurrentes de ${MESES[state.mes].toLowerCase()}`} className={className} action={<p className="text-xs text-muted-foreground">{lista.length} por confirmar</p>}>
      <ul className="divide-y">
        {lista.map((r, i) => {
          const { etiqueta, icono } = describirCategoria(mapa, r.categoriaId)
          const ingreso = r.tipo === 'Ingreso'
          return (
            <li key={r.id} className={cn('flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5', entrada)} style={escalonado(i)}>
              <CategoriaIcono nombre={icono} tipo={r.tipo} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{r.concepto || etiqueta}</span>
                <span className="block truncate text-sm text-muted-foreground">
                  {etiqueta}, día {r.dia}
                </span>
              </span>
              <Money value={r.valor} tone={ingreso ? 'positive' : 'neutral'} signo={ingreso} className="font-bold" />
              <span className="flex gap-1">
                <Button size="sm" onClick={() => actions.aplicarRecurrente(r, state.mes)}>
                  Registrar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => actions.omitir(state.mes, r.id)}>
                  Omitir
                </Button>
              </span>
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}
