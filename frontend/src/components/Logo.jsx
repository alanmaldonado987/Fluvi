import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

// Piezas de la marca en /public/marca. tono "auto" sigue el tema de la app; "oscuro" es para fondos verde profundo.
export function Logo({ compacto = false, tono = 'auto', className }) {
  const pieza = compacto ? 'simbolo' : 'logo-horizontal'
  const tamano = compacto ? 'h-6.5 w-auto' : 'h-8 w-auto'
  return (
    <Link
      to="/"
      aria-label="Fluvi, ir al inicio"
      className={cn('inline-flex shrink-0 items-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring', className)}
    >
      {tono === 'oscuro' ? (
        <img src={`/marca/fluvi-${pieza}-oscuro.svg`} alt="" className={tamano} />
      ) : (
        <>
          <img src={`/marca/fluvi-${pieza}-claro.svg`} alt="" className={cn(tamano, 'dark:hidden')} />
          <img src={`/marca/fluvi-${pieza}-oscuro.svg`} alt="" className={cn(tamano, 'hidden dark:block')} />
        </>
      )}
    </Link>
  )
}
