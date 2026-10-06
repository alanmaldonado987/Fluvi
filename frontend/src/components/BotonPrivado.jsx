import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { alternarPrivado, usePrivado } from '@/lib/privado'
import { cn } from '@/lib/utils'

// Oculta o muestra todas las cifras de la app.
export function BotonPrivado({ variant = 'ghost', className }) {
  const privado = usePrivado()
  return (
    <Button
      data-tour="privado"
      variant={variant}
      size="icon"
      className={cn('text-muted-foreground', privado && 'text-forest', className)}
      aria-label={privado ? 'Mostrar cifras' : 'Ocultar cifras'}
      aria-pressed={privado}
      onClick={alternarPrivado}
    >
      {privado ? <EyeOff /> : <Eye />}
    </Button>
  )
}
