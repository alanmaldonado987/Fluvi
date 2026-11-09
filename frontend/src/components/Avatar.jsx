import { useState } from 'react'
import { iniciales } from '@/lib/avatar'
import { cn } from '@/lib/utils'

// Foto de perfil o, si no hay (o no carga), las iniciales del nombre.
// `inicial` muestra una sola letra en vez de dos.
export function Avatar({ nombre, url, inicial = false, className }) {
  const [fallo, setFallo] = useState(null)
  const hayFoto = Boolean(url) && fallo !== url
  return (
    <span className={cn('grid shrink-0 place-items-center overflow-hidden rounded-full bg-forest font-bold text-on-forest', className)} aria-hidden="true">
      {hayFoto ? <img src={url} alt="" className="size-full object-cover" onError={() => setFallo(url)} /> : inicial ? iniciales(nombre).slice(0, 1) : iniciales(nombre)}
    </span>
  )
}
