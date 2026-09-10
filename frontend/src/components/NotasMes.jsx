import { Panel } from '@/components/Panel'
import { Textarea } from '@/components/ui/textarea'
import { MESES } from '@/lib/format'
import { useFinance } from '@/store/context'

export function NotasMes() {
  const { state, actions } = useFinance()
  if (state.mes === null) return null
  const texto = state.notas[`${state.anio}-${state.mes}`] ?? ''
  return (
    <Panel title={`Notas de ${MESES[state.mes].toLowerCase()}`} action={<p className="text-xs text-muted-foreground">Se guardan solas</p>}>
      <Textarea
        rows={3}
        aria-label={`Notas de ${MESES[state.mes]} ${state.anio}`}
        placeholder="Contexto del mes: un viaje, un cambio de plan, algo que explique los números cuando los mires dentro de un año."
        className="bg-card"
        value={texto}
        onChange={(e) => actions.setNota(state.mes, e.target.value)}
      />
    </Panel>
  )
}
