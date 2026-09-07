import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { MESES_CORTO } from '@/lib/format'
import { useFormatoMoneda } from '@/lib/privado'
import { estiloTooltip } from './tooltip'

export function LineasAnual({ datos, height = 240 }) {
  const formatear = useFormatoMoneda()
  const serie = datos.map((d) => ({ ...d, nombre: MESES_CORTO[d.mes] }))
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={serie} margin={{ top: 8, right: 16, bottom: 0, left: 16 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey="nombre" interval={0} axisLine={false} tickLine={false} tickMargin={6} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
        <YAxis hide />
        <Tooltip formatter={formatear} contentStyle={estiloTooltip} />
        <Legend iconType="plainline" wrapperStyle={{ fontSize: 13 }} />
        <Line type="monotone" dataKey="ingresos" name="Ingresos" stroke="var(--leaf)" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
        <Line type="monotone" dataKey="egresos" name="Egresos" stroke="var(--chart-3)" strokeWidth={2.5} strokeDasharray="6 4" dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
