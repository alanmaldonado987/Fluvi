const COLORES = ['var(--lc-acento)', 'var(--lc-ok)', 'var(--lc-hoy)', 'var(--lc-alerta)']
const PIEZAS = 26

// Ráfaga de confeti que sale del centro: se muestra cuando se compra el último ítem. `disparo` cambia para repetirla.
export function Confeti({ disparo }) {
  if (!disparo) return null
  return (
    <div key={disparo} aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1/3 z-40 flex justify-center">
      {Array.from({ length: PIEZAS }, (_, i) => {
        const angulo = (i / PIEZAS) * Math.PI * 2 + (i % 3) * 0.2
        const distancia = 110 + (i % 5) * 38
        return (
          <span
            key={i}
            className="lc-confeti absolute h-2.5 w-1.5 rounded-sm"
            style={{ background: COLORES[i % COLORES.length], '--dx': `${Math.cos(angulo) * distancia}px`, '--dy': `${Math.sin(angulo) * distancia - 60}px`, '--giro': `${(i * 67) % 360}deg`, animationDelay: `${(i % 6) * 25}ms` }}
          />
        )
      })}
    </div>
  )
}
