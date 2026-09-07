import { BellRing, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Panel } from '@/components/Panel'
import { recordatorios } from '@/lib/calc'
import { entrada, escalonado } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { useAuth } from '@/store/auth'
import { useFinance } from '@/store/context'

export function Recordatorios() {
  const { usuario } = useAuth()
  const { state } = useFinance()
  const lista = recordatorios(state, usuario.preferencias)
  if (!lista.length) return null
  return (
    <Panel title="Recordatorios" action={<BellRing className="size-4 text-gold" aria-hidden="true" />}>
      <ul className="grid gap-1">
        {lista.map((r, i) => (
          <li key={r.id} className={entrada} style={escalonado(i)}>
            <Link to={r.ruta} className={cn('flex items-center justify-between gap-3 rounded-xl px-2 py-2 text-sm transition-colors hover:bg-muted/60', 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring')}>
              <span>{r.texto}</span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
