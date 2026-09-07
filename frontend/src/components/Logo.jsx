import { Droplets } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export function Logo({ compacto = false, className }) {
  return (
    <Link
      to="/"
      aria-label="Fluvi, ir al inicio"
      className={cn('inline-flex items-center gap-2 rounded-lg text-xl font-extrabold tracking-tight text-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring', className)}
    >
      <Droplets className="size-6 shrink-0 text-leaf" aria-hidden="true" />
      {compacto ? null : 'Fluvi'}
    </Link>
  )
}
