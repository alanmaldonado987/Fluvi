import { useState } from 'react'
import { iniciales } from '@/lib/avatar'
import { cn } from '@/lib/utils'

// Foto de perfil o, si no hay (o no carga), las iniciales del nombre.
export function Avatar({ nombre, url, className }) {
  const [fallo, setFallo] = useState(null)
  const hayFoto = Boolean(url) && fallo !== url
  return (
    <span className={cn('grid shrink-0 place-items-center overflow-hidden rounded-full bg-forest font-bold text-on-forest', className)} aria-hidden="true">
      {hayFoto ? <img src={url} alt="" className="size-full object-cover" onError={() => setFallo(url)} /> : iniciales(nombre)}
    </span>
  )
}
