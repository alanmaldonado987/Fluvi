// Colores de cada prioridad (usan la paleta de .lista-viva).
export const estiloPrioridad = {
  alta: 'bg-[var(--lc-alerta-suave)] text-[var(--lc-alerta-texto)]',
  media: 'bg-[var(--lc-hoy-suave)] text-[var(--lc-hoy-texto)]',
  baja: 'bg-[var(--lc-acento-suave)] text-[var(--lc-acento-texto)]',
}

// Solo el color del texto/icono de cada prioridad, y el del borde para los botones sin elegir.
export const colorPrioridad = {
  alta: 'text-[var(--lc-alerta-texto)]',
  media: 'text-[var(--lc-hoy-texto)]',
  baja: 'text-[var(--lc-acento-texto)]',
}
export const bordePrioridad = {
  alta: 'border-[var(--lc-alerta)]/40 hover:bg-[var(--lc-alerta-suave)]',
  media: 'border-[var(--lc-hoy)]/40 hover:bg-[var(--lc-hoy-suave)]',
  baja: 'border-[var(--lc-acento)]/40 hover:bg-[var(--lc-acento-suave)]',
}
