import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { animacionGrafico } from '@/lib/motion'

// Cascada del periodo: cada barra es un rango [desde, hasta] para que ingresos suban y egresos bajen desde el saldo acumulado.
// Las líneas punteadas unen el final de cada paso con el inicio del siguiente.
export function Cascada({ pasos, height = 180 }) {
  const datos = pasos.map((p) => ({ clave: p.clave, rango: [Math.min(p.desde, p.hasta), Math.max(p.desde, p.hasta)], color: p.color }))
  const minimo = Math.min(0, ...pasos.flatMap((p) => [p.desde, p.hasta]))
  const uniones = pasos.slice(0, -1).map((p, i) => ({ desde: p.clave, hacia: pasos[i + 1].clave, nivel: p.hasta }))
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={datos} margin={{ top: 8, right: 0, bottom: 0, left: 0 }} barCategoryGap="22%">
        <XAxis dataKey="clave" hide />
        <YAxis hide domain={[minimo, 'auto']} />
        {uniones.map((u) => (
          <ReferenceLine key={u.desde} segment={[{ x: u.desde, y: u.nivel }, { x: u.hacia, y: u.nivel }]} stroke="var(--muted-foreground)" strokeOpacity={0.5} strokeDasharray="4 4" />
        ))}
        <Bar dataKey="rango" radius={6} maxBarSize={56} {...animacionGrafico}>
          {datos.map((d) => (
            <Cell key={d.clave} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
