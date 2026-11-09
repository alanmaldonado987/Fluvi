import { Ellipsis, Pencil, Trash2, UserPlus, Users } from 'lucide-react'
import { Money } from '@/components/Money'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useNumeroAnimado } from '@/lib/animado'
import { usePrivado } from '@/lib/privado'
import { cn } from '@/lib/utils'

const nombreDe = (nombre, email) => nombre || (email ?? '').split('@')[0]
const colores = ['bg-tint-violet text-tint-violet', 'bg-tint-aqua text-tint-aqua', 'bg-tint-orange text-tint-orange', 'bg-tint-magenta text-tint-magenta', 'bg-tint-blue text-tint-blue']
const colorDe = (clave) => colores[[...String(clave)].reduce((t, c) => t + c.charCodeAt(0), 0) % colores.length]

// Personas que participan, como círculos apilados. Los pendientes se ven con borde punteado.
function Participantes({ personas, onAbrir, etiqueta }) {
  const visibles = personas.slice(0, 4)
  const resto = personas.length - visibles.length
  return (
    <button type="button" onClick={onAbrir} aria-label={etiqueta} className="flex items-center rounded-full py-1 pr-1 pl-2 transition-colors hover:bg-muted/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lc-acento)]">
      <span className="flex">
        {visibles.map((p, i) => (
          <span
            key={p.id}
            title={p.nombre}
            style={{ zIndex: 10 - i }}
            className={cn('-ml-2 grid size-8 place-items-center rounded-full border-2 border-card text-xs font-bold first:ml-0', colorDe(p.id), p.pendiente && 'border-dashed border-muted-foreground/50 opacity-70')}
          >
            {nombreDe(p.nombre, p.email).charAt(0).toUpperCase()}
          </span>
        ))}
        {resto > 0 ? <span className="-ml-2 grid size-8 place-items-center rounded-full border-2 border-card bg-muted text-xs font-semibold text-muted-foreground">+{resto}</span> : null}
      </span>
    </button>
  )
}

// Encabezado de la lista: el nombre, cuánto falta por comprar (el número cuenta al cambiar), una barra que se llena al marcar
// ítems y las personas con las que se comparte.
export function ResumenVivo({ lista, resumen, personas, propietario, onMiembros, onEditar, onEliminar, detalle }) {
  const privado = usePrivado()
  const falta = useNumeroAnimado(resumen.pendiente)
  const porcentaje = resumen.cantidad ? Math.round((resumen.cuantosComprados / resumen.cantidad) * 100) : 0
  const completa = resumen.cantidad > 0 && resumen.cuantosComprados === resumen.cantidad

  return (
    <section aria-label="Resumen de la lista" className="relative overflow-hidden rounded-3xl border bg-card p-5 md:p-6">
      <div aria-hidden="true" className="pointer-events-none absolute -top-16 -right-10 size-48 rounded-full bg-[var(--lc-acento-suave)] opacity-70 blur-2xl" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-3xl leading-tight font-bold tracking-tight md:text-4xl">{lista.nombre}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{detalle}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {lista.compartida ? (
            <Participantes personas={personas} onAbrir={onMiembros} etiqueta={propietario ? 'Participantes y permisos' : 'Ver participantes'} />
          ) : propietario ? (
            <Button variant="ghost" size="sm" onClick={onMiembros}>
              <UserPlus /> Compartir
            </Button>
          ) : null}
          {propietario ? (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label="Más opciones de la lista" />}>
                <Ellipsis />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEditar}>
                  <Pencil /> Editar lista
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onMiembros}>{lista.compartida ? <Users /> : <UserPlus />}{lista.compartida ? 'Participantes y permisos' : 'Compartir'}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onEliminar}>
                  <Trash2 /> Eliminar lista
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>

      <div className="relative mt-5">
        <p className="text-sm font-medium text-muted-foreground">{completa ? 'Todo comprado' : 'Te falta por comprar'}</p>
        <p className="text-[clamp(1.75rem,9.5vw,3rem)] leading-none font-bold tracking-tight tabular-nums md:text-6xl" aria-label={`Falta por comprar ${privado ? 'un monto oculto' : resumen.pendiente}`}>
          <Money value={falta} className={cn(completa && 'text-[var(--lc-ok)]')} />
        </p>
        <div className="mt-4" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={porcentaje} aria-label="Avance de la compra">
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-[var(--lc-acento)] transition-[width] duration-700 ease-out" style={{ width: `${porcentaje}%` }} />
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>
              <strong className="font-semibold text-foreground">{resumen.cuantosComprados}</strong> de {resumen.cantidad} {resumen.cantidad === 1 ? 'ítem comprado' : 'ítems comprados'}
            </span>
            <span className="tabular-nums">
              Ya compraste <Money value={resumen.comprado} className="font-semibold text-[var(--lc-ok-texto)]" /> de <Money value={resumen.total} />
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
