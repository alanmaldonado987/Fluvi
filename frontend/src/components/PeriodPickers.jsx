import { SelectField } from '@/components/SelectField'
import { MESES } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useFinance } from '@/store/context'

const meses = [{ value: 'todos', label: 'Todo el año' }, ...MESES.map((label, i) => ({ value: String(i), label }))]
const actual = new Date().getFullYear()
const anios = [actual - 1, actual, actual + 1].map((a) => ({ value: String(a), label: String(a) }))

export function MonthPicker({ className }) {
  const { state, actions } = useFinance()
  return <SelectField aria-label="Mes" className={className} value={state.mes === null ? 'todos' : String(state.mes)} onChange={(v) => actions.setPeriodo({ mes: v === 'todos' ? null : Number(v) })} items={meses} />
}

export function YearPicker({ className }) {
  const { state, actions } = useFinance()
  return <SelectField aria-label="Año" className={cn('w-28', className)} value={String(state.anio)} onChange={(v) => actions.setPeriodo({ anio: Number(v) })} items={anios} />
}

export function PeriodoPicker({ className }) {
  return (
    <div className={cn('flex', className)} role="group" aria-label="Periodo" data-tour="periodo">
      <MonthPicker className="w-36 rounded-r-none" />
      <YearPicker className="-ml-px w-24 rounded-l-none" />
    </div>
  )
}
