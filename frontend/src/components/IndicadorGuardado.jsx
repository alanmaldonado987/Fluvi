import { Check, CircleAlert, LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useEstadoGuardado } from '@/lib/guardado'
import { cn } from '@/lib/utils'

const RETRASO_GUARDANDO = 300

const textos = {
  guardando: 'Guardando…',
  guardado: 'Guardado',
  error: 'No se pudo guardar',
}

// Pastilla flotante con el estado del guardado. "Guardando…" solo aparece si tarda más de un instante, para que los guardados
// rápidos muestren directamente "Guardado" sin parpadeos. Un error se queda visible unos segundos.
export function IndicadorGuardado() {
  const { fase } = useEstadoGuardado()
  const [pasoRetraso, setPasoRetraso] = useState(false)
  const [ultima, setUltima] = useState('guardado')

  useEffect(() => {
    if (fase !== 'guardando') return undefined
    const id = setTimeout(() => setPasoRetraso(true), RETRASO_GUARDANDO)
    return () => {
      clearTimeout(id)
      setPasoRetraso(false)
    }
  }, [fase])

  const visible = fase === 'guardado' || fase === 'error' || (fase === 'guardando' && pasoRetraso)
  // Al ocultarse se conserva el último estado mostrado para que la salida no cambie de contenido a mitad de la animación.
  if (visible && ultima !== fase) setUltima(fase)
  const mostrado = visible ? fase : ultima

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+5.5rem+var(--guardado-extra,0rem))] z-30 flex justify-center md:bottom-[calc(1.5rem+var(--guardado-extra,0rem))]" role="status" aria-live="polite">
      <div
        aria-hidden={!visible}
        className={cn(
          'flex items-center gap-2 rounded-full border bg-card/90 py-1.5 pr-4 pl-1.5 text-sm font-semibold shadow-elevated backdrop-blur-md transition-[opacity,translate,scale] duration-300 ease-out motion-reduce:transition-none',
          visible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-95 opacity-0',
        )}
      >
        <span
          className={cn(
            'grid size-6 place-items-center rounded-full',
            mostrado === 'guardando' && 'bg-muted text-muted-foreground',
            mostrado === 'guardado' && 'bg-positive/15 text-positive',
            mostrado === 'error' && 'bg-negative/15 text-negative',
          )}
        >
          {mostrado === 'guardando' ? <LoaderCircle className="size-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : null}
          {mostrado === 'guardado' ? <Check className="size-3.5" strokeWidth={3} aria-hidden="true" /> : null}
          {mostrado === 'error' ? <CircleAlert className="size-3.5" aria-hidden="true" /> : null}
        </span>
        <span className={cn(mostrado === 'error' && 'text-negative')}>{textos[mostrado]}</span>
      </div>
    </div>
  )
}
