import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CalendarPlus, Check, EllipsisVertical, GripVertical, Pencil, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { CampoEditable } from '@/components/listas/CampoEditable'
import { FichaPrioridad } from '@/components/listas/Prioridad'
import { Money } from '@/components/Money'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useDeslizar } from '@/lib/deslizar'
import { fechaCorta } from '@/lib/format'
import { estaVencido } from '@/lib/listas'
import { cn } from '@/lib/utils'

const transicionSuave = { duration: 240, easing: 'cubic-bezier(0.25, 1, 0.5, 1)' }

// Etiqueta de la fecha de compra: coral si ya venció, ámbar si es hoy, neutra si es futura. Tocarla abre el selector de fecha.
function FichaFecha({ item, fechaHoy, puedeEditar, onCambiar }) {
  const selector = useRef(null)
  const vencido = estaVencido(item, fechaHoy)
  const esHoy = item.fechaCompra === fechaHoy && !item.comprado
  const abrir = () => {
    const el = selector.current
    if (!el) return
    if (el.showPicker) el.showPicker()
    else el.click()
  }
  if (!item.fechaCompra && !puedeEditar) return null
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        disabled={!puedeEditar}
        onClick={abrir}
        aria-label={item.fechaCompra ? `Fecha de ${item.nombre}: ${fechaCorta(item.fechaCompra)}. Tocar para cambiar` : `Agregar fecha a ${item.nombre}`}
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lc-acento)]',
          !item.fechaCompra && 'text-muted-foreground opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 group-data-[activa=true]:opacity-100 [@media(hover:none)]:opacity-60',
          item.fechaCompra && !vencido && !esHoy && 'bg-muted text-muted-foreground',
          vencido && 'bg-[var(--lc-alerta-suave)] text-[var(--lc-alerta-texto)]',
          esHoy && 'bg-[var(--lc-hoy-suave)] text-[var(--lc-hoy-texto)]',
          puedeEditar && 'hover:brightness-95',
        )}
      >
        <CalendarPlus className="size-3" aria-hidden="true" />
        {item.fechaCompra ? `${fechaCorta(item.fechaCompra)}${vencido ? ' · vencido' : esHoy ? ' · hoy' : ''}` : 'Fecha'}
      </button>
      <input ref={selector} type="date" tabIndex={-1} aria-hidden="true" value={item.fechaCompra ?? ''} onChange={(e) => onCambiar({ fechaCompra: e.target.value || null })} className="pointer-events-none absolute inset-0 opacity-0" />
    </span>
  )
}

// Círculo para marcar como comprado: se rellena con un pequeño rebote y el visto se dibuja.
function Marcador({ marcado, animar, deshabilitado, nombre, onAlternar }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={marcado}
      aria-label={`${marcado ? 'Desmarcar' : 'Marcar como comprado'}: ${nombre}`}
      disabled={deshabilitado}
      onClick={onAlternar}
      className={cn(
        'relative grid size-7 shrink-0 place-items-center rounded-full border-2 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lc-acento)] disabled:cursor-not-allowed disabled:opacity-60',
        marcado ? 'border-[var(--lc-ok)] bg-[var(--lc-ok)] text-white' : 'border-border hover:border-[var(--lc-acento)]',
        animar && 'lc-pop',
      )}
    >
      {marcado ? (
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12.5l4.5 4.5L19 7.5" className={animar ? 'lc-trazo' : undefined} />
        </svg>
      ) : null}
    </button>
  )
}

// Un ítem de la lista: se arrastra por el asa para cambiar su lugar, se marca con el círculo, se edita tocando el nombre o el
// precio, y en el celular se desliza (derecha = comprado, izquierda = eliminar).
export function FilaItem({ item, indice = 0, permisos, fechaHoy, conPrioridad, marcado, animar, arrastrable, onMarcar, onCambiar, onEditar, onEliminar }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id, disabled: !arrastrable, transition: transicionSuave })
  const gesto = useDeslizar({ alDerecha: permisos.editar ? () => onMarcar(item.id, !marcado) : undefined, alIzquierda: permisos.eliminar ? () => onEliminar(item) : undefined })

  // Con un menú abierto (se dibuja fuera de la fila) el cursor deja de estar sobre ella: se mantiene activa para que no desaparezcan sus botones.
  const [menuAbierto, setMenuAbierto] = useState(false)
  const tieneFichas = Boolean(item.fechaCompra) || Boolean(conPrioridad && item.prioridad)
  const fichas = (
    <>
      {conPrioridad ? <FichaPrioridad item={item} puedeEditar={permisos.editar} onCambiar={(datos) => onCambiar(item.id, datos)} onAbrir={setMenuAbierto} /> : null}
      <FichaFecha item={{ ...item, comprado: marcado }} fechaHoy={fechaHoy} puedeEditar={permisos.editar} onCambiar={(datos) => onCambiar(item.id, datos)} />
    </>
  )

  return (
    <li ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition, animationDelay: `${Math.min(indice, 8) * 35}ms` }} className={cn('lc-entra relative', isDragging && 'z-30')}>
      <div className={cn('relative overflow-hidden rounded-2xl', isDragging && 'shadow-elevated ring-2 ring-[var(--lc-acento)]')}>
        <div aria-hidden="true" className="absolute inset-0 flex items-center bg-[var(--lc-ok)] pl-5 text-white" style={{ opacity: gesto.dx > 0 ? Math.min(1, gesto.avance * 1.2) : 0 }}>
          <Check className="size-5" style={{ transform: `scale(${0.7 + gesto.avance * 0.5})` }} />
        </div>
        <div aria-hidden="true" className="absolute inset-0 flex items-center justify-end bg-[var(--lc-alerta)] pr-5 text-white" style={{ opacity: gesto.dx < 0 ? Math.min(1, gesto.avance * 1.2) : 0 }}>
          <Trash2 className="size-5" style={{ transform: `scale(${0.7 + gesto.avance * 0.5})` }} />
        </div>

        <div
          {...gesto.manejadores}
          style={{ transform: `translateX(${gesto.dx}px)`, transition: gesto.suelto ? 'transform 240ms var(--ease-out)' : 'none', touchAction: 'pan-y' }}
          data-activa={menuAbierto}
          className={cn('group relative flex items-center gap-2 rounded-2xl border bg-card py-2.5 pr-2 pl-1.5 transition-colors', marcado && 'bg-card/70')}
        >
          {arrastrable ? (
            <button
              type="button"
              {...attributes}
              {...listeners}
              aria-label={`Mover ${item.nombre}`}
              className="grid h-8 w-6 shrink-0 cursor-grab touch-none place-items-center rounded-md text-muted-foreground/60 transition-opacity hover:text-muted-foreground focus-visible:outline-2 focus-visible:outline-[var(--lc-acento)] active:cursor-grabbing md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 md:group-data-[activa=true]:opacity-100"
            >
              <GripVertical className="size-4" aria-hidden="true" />
            </button>
          ) : (
            <span className="w-1.5 shrink-0" aria-hidden="true" />
          )}
          <Marcador marcado={marcado} animar={animar} deshabilitado={!permisos.editar} nombre={item.nombre} onAlternar={() => onMarcar(item.id, !marcado)} />

          <div className="min-w-0 flex-1 px-1">
            <div className="flex items-center gap-2">
              <CampoEditable
                valor={item.nombre}
                etiqueta={`Nombre de ${item.nombre}`}
                deshabilitado={!permisos.editar}
                onGuardar={(nombre) => onCambiar(item.id, { nombre })}
                className="block min-w-0 px-1 py-1"
                mostrar={
                  <span className="relative inline-block max-w-full">
                    <span className={cn('block truncate text-[15px] font-medium transition-colors duration-300', marcado && 'text-[var(--lc-ok-texto)]')}>{item.nombre}</span>
                    <span aria-hidden="true" className={cn('pointer-events-none absolute top-1/2 left-0 h-0.5 origin-left rounded-full bg-[var(--lc-ok)]/70 transition-transform duration-300 ease-out', marcado ? 'w-full scale-x-100' : 'w-full scale-x-0')} />
                  </span>
                }
              />
              {/* Sin prioridad ni fecha, las fichas para agregarlas aparecen al lado del nombre (solo escritorio) y no ocupan una línea. */}
              {!tieneFichas && permisos.editar ? (
                <span className="hidden shrink-0 items-center gap-1 md:flex">{fichas}</span>
              ) : null}
            </div>
            {tieneFichas ? <div className="flex flex-wrap items-center gap-1.5 px-1 pb-1">{fichas}</div> : null}
          </div>

          <CampoEditable
            tipo="dinero"
            valor={item.precio}
            etiqueta={`Precio de ${item.nombre}`}
            deshabilitado={!permisos.editar}
            onGuardar={(precio) => onCambiar(item.id, { precio })}
            className="shrink-0 px-2 py-1"
            mostrar={<Money value={item.precio} className={cn('text-[15px] font-semibold tabular-nums', marcado ? 'text-muted-foreground' : item.precio ? 'text-foreground' : 'text-muted-foreground')} />}
          />

          <span className="hidden shrink-0 items-center md:flex md:opacity-0 md:transition-opacity md:group-hover:opacity-100 md:group-focus-within:opacity-100 md:group-data-[activa=true]:opacity-100">
            {permisos.editar ? (
              <Button variant="ghost" size="icon" className="size-8" aria-label={`Editar ${item.nombre}`} onClick={() => onEditar(item)}>
                <Pencil />
              </Button>
            ) : null}
            {permisos.eliminar ? (
              <Button variant="ghost" size="icon" className="size-8 hover:text-[var(--lc-alerta)]" aria-label={`Eliminar ${item.nombre}`} onClick={() => onEliminar(item)}>
                <Trash2 />
              </Button>
            ) : null}
          </span>
          {permisos.editar || permisos.eliminar ? (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8 shrink-0 md:hidden" aria-label={`Más acciones de ${item.nombre}`} />}>
                <EllipsisVertical />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {permisos.editar ? (
                  <DropdownMenuItem onClick={() => onEditar(item)}>
                    <Pencil /> Editar
                  </DropdownMenuItem>
                ) : null}
                {permisos.eliminar ? (
                  <DropdownMenuItem onClick={() => onEliminar(item)}>
                    <Trash2 /> Eliminar
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>
    </li>
  )
}
