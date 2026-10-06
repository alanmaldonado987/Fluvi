import { useId } from 'react'
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { MESES_CORTO } from '@/lib/format'
import { animacionGrafico } from '@/lib/motion'
import { useFormatoMoneda } from '@/lib/privado'
import { estiloTooltip } from './tooltip'

export function LineasAnual({ datos, height = 240 }) {
  const formatear = useFormatoMoneda()
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const serie = datos.map((d) => ({ ...d, nombre: MESES_CORTO[d.mes] }))
  const solo = serie.filter((d) => d.ingresos != null).length === 1
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={serie} margin={{ top: 8, right: 16, bottom: 0, left: 16 }}>
        <defs>
          <linearGradient id={`${id}-ingresos`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: 'var(--leaf)', stopOpacity: 0.28 }} />
            <stop offset="100%" style={{ stopColor: 'var(--leaf)', stopOpacity: 0 }} />
          </linearGradient>
          <linearGradient id={`${id}-egresos`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: 'var(--chart-3)', stopOpacity: 0.18 }} />
            <stop offset="100%" style={{ stopColor: 'var(--chart-3)', stopOpacity: 0 }} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 6" />
        <XAxis dataKey="nombre" interval={0} axisLine={false} tickLine={false} tickMargin={6} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
        <YAxis hide />
        <Tooltip formatter={formatear} contentStyle={estiloTooltip} cursor={{ stroke: 'var(--border)', strokeWidth: 1 }} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 13 }} />
        <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="var(--leaf)" strokeWidth={2.5} fill={`url(#${id}-ingresos)`} dot={solo && { r: 4, strokeWidth: 0, fill: 'var(--leaf)' }} activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--card)' }} {...animacionGrafico} />
        <Area type="monotone" dataKey="egresos" name="Egresos" stroke="var(--chart-3)" strokeWidth={2.5} fill={`url(#${id}-egresos)`} dot={solo && { r: 4, strokeWidth: 0, fill: 'var(--chart-3)' }} activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--card)' }} {...animacionGrafico} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
