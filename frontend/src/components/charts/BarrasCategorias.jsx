import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useFormatoMoneda } from '@/lib/privado'
import { estiloTooltip } from './tooltip'

export function BarrasCategorias({ datos }) {
  const formatear = useFormatoMoneda()
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, datos.length * 34)}>
      <BarChart data={datos} layout="vertical" margin={{ top: 0, right: 84, bottom: 0, left: 0 }}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="nombre" width={104} axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: 'var(--muted-foreground)' }} />
        <Tooltip formatter={formatear} contentStyle={estiloTooltip} cursor={{ fill: 'var(--muted)' }} />
        <Bar dataKey="valor" name="Egresos" fill="var(--leaf)" radius={[0, 8, 8, 0]} barSize={16} isAnimationActive={false}>
          <LabelList dataKey="valor" position="right" formatter={formatear} fill="var(--foreground)" fontSize={12} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
