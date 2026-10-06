import { usePrivado } from '@/lib/privado'
import { cn } from '@/lib/utils'

const colores = { positive: 'var(--leaf)', warning: 'var(--gold)', negative: 'var(--negative)' }

// Progreso circular; el porcentaje del centro se oculta en modo privado porque revela la proporción.
export function Anillo({ valor, tone = 'positive', tamano = 56, grosor = 6, className }) {
  const privado = usePrivado()
  const escala = Math.min(Math.max(valor, 0), 1)
  const radio = (tamano - grosor) / 2
  const perimetro = 2 * Math.PI * radio
  const centro = tamano / 2
  return (
    <div
      className={cn('relative grid shrink-0 place-items-center', className)}
      style={{ width: tamano, height: tamano }}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(escala * 100)}
    >
      <svg viewBox={`0 0 ${tamano} ${tamano}`} className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx={centro} cy={centro} r={radio} fill="none" stroke="var(--muted)" strokeWidth={grosor} />
        <circle
          cx={centro}
          cy={centro}
          r={radio}
          fill="none"
          stroke={colores[tone]}
          strokeWidth={grosor}
          strokeLinecap="round"
          opacity={escala ? 1 : 0}
          strokeDasharray={perimetro}
          className="transition-[stroke-dashoffset] duration-700 ease-out [stroke-dashoffset:var(--o)] starting:[stroke-dashoffset:var(--c)]"
          style={{ '--o': perimetro * (1 - escala), '--c': perimetro }}
        />
      </svg>
      {privado ? null : <span className="text-xs font-bold tabular-nums">{Math.round(escala * 100)}%</span>}
    </div>
  )
}
