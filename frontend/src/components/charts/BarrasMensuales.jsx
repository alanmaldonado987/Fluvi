import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { MESES_CORTO } from '@/lib/format'
import { useFormatoMoneda } from '@/lib/privado'
import { estiloTooltip } from './tooltip'

export function BarrasMensuales({ datos, mesActivo, nombre = 'Saldo', height = 220 }) {
  const formatear = useFormatoMoneda()
  const serie = datos.map((d) => ({ ...d, etiqueta: MESES_CORTO[d.mes] }))
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={serie} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
        <XAxis dataKey="etiqueta" interval={0} axisLine={false} tickLine={false} tickMargin={6} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
        <YAxis hide />
        <Tooltip formatter={formatear} contentStyle={estiloTooltip} cursor={{ fill: 'var(--muted)' }} />
        <Bar dataKey="valor" name={nombre} radius={[6, 6, 0, 0]} isAnimationActive={false}>
          {serie.map((d) => (
            <Cell key={d.mes} fill={d.mes === mesActivo ? 'var(--leaf)' : 'var(--chart-5)'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
