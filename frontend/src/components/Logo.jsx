import { Link } from 'react-router-dom'
import { Marca } from '@/components/Marca'
import { cn } from '@/lib/utils'

export function Logo({ compacto = false, className }) {
  return (
    <Link
      to="/"
      aria-label="Fluvi, ir al inicio"
      className={cn('inline-flex items-center gap-2 rounded-lg text-xl font-extrabold tracking-tight text-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring', className)}
    >
      <Marca className="size-7" />
      {compacto ? null : 'Fluvi'}
    </Link>
  )
}
