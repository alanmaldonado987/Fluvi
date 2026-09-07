import { Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useFormatoMoneda } from '@/lib/privado'
import { estiloTooltip } from './tooltip'

export function BarrasComparativas({ filas, etiquetaReal = 'Real' }) {
  const formatear = useFormatoMoneda()
  return (
    <ResponsiveContainer width="100%" height={filas.length * 44 + 40}>
      <BarChart data={filas} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }} barGap={3} barCategoryGap={12}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="nombre" width={108} axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: 'var(--muted-foreground)' }} />
        <Tooltip formatter={formatear} contentStyle={estiloTooltip} cursor={{ fill: 'var(--muted)' }} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="proyectado" name="Proyectado" fill="var(--chart-5)" radius={[0, 6, 6, 0]} barSize={8} isAnimationActive={false} />
        <Bar dataKey="real" name={etiquetaReal} fill="var(--forest)" radius={[0, 6, 6, 0]} barSize={8} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  )
}
