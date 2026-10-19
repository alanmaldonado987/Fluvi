import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useFormatoMoneda, usePrivado } from '@/lib/privado'
import { animacionGrafico } from '@/lib/motion'
import { estiloTooltip } from './tooltip'

// Cada barra muestra el monto y su peso sobre el total; el porcentaje se omite en modo privado porque revela proporciones.
export function BarrasCategorias({ datos }) {
  const formatear = useFormatoMoneda()
  const privado = usePrivado()
  const total = datos.reduce((t, d) => t + d.valor, 0) || 1
  const etiqueta = (v) => (privado ? formatear(v) : `${formatear(v)} · ${v > 0 && v / total < 0.005 ? '<1' : Math.round((v / total) * 100)}%`)
  const resumen = `Egresos por categoría: ${datos.map((d) => `${d.nombre} ${formatear(d.valor)}`).join(', ')}`
  return (
    <div role="img" aria-label={resumen}>
      <ResponsiveContainer width="100%" height={Math.max(160, datos.length * 34)}>
        <BarChart data={datos} layout="vertical" margin={{ top: 0, right: privado ? 84 : 116, bottom: 0, left: 0 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="nombre" width={104} axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: 'var(--muted-foreground)' }} />
          <Tooltip formatter={formatear} contentStyle={estiloTooltip} cursor={{ fill: 'var(--muted)' }} />
          <Bar dataKey="valor" name="Egresos" fill="var(--leaf)" radius={[0, 8, 8, 0]} barSize={16} background={{ fill: 'var(--muted)', radius: 8 }} {...animacionGrafico}>
            <LabelList dataKey="valor" position="right" formatter={etiqueta} fill="var(--foreground)" fontSize={12} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
