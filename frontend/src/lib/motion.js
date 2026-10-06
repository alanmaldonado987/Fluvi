export const entradaPagina = 'animate-in fade-in-0 fill-mode-both duration-200 ease-out'
export const entrada = 'animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-both duration-300 ease-out'
export const escalonado = (i) => ({ animationDelay: `${Math.min(i, 8) * 40}ms` })
// Los gráficos animan su entrada salvo que el sistema pida movimiento reducido.
export const animarGraficos = typeof window === 'undefined' || !window.matchMedia('(prefers-reduced-motion: reduce)').matches
export const animacionGrafico = { isAnimationActive: animarGraficos, animationDuration: 600, animationEasing: 'ease-out' }
