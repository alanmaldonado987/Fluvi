import { ArrowLeftRight, ChartPie, Eye, EyeOff, House, PanelLeftClose, PanelLeftOpen, Wallet, Waves } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Logo } from '@/components/Logo'
import { Tutorial } from '@/components/Tutorial'
import { Button } from '@/components/ui/button'
import { UsuarioMenu } from '@/components/UsuarioMenu'
import { entradaPagina } from '@/lib/motion'
import { alternarPrivado, usePrivado } from '@/lib/privado'
import { cn } from '@/lib/utils'
import { useAuth } from '@/store/auth'

const rutas = [
  { to: '/', label: 'Inicio', icon: House, tour: 'inicio' },
  { to: '/movimientos', label: 'Movimientos', icon: ArrowLeftRight, tour: 'movimientos' },
  { to: '/presupuesto', label: 'Presupuesto', icon: ChartPie, tour: 'presupuesto' },
  { to: '/billeteras', label: 'Billeteras', icon: Wallet, tour: 'billeteras' },
  { to: '/flujo', label: 'Flujo', icon: Waves, tour: 'flujo' },
]

const CLAVE = 'fluvi:sidebar'
const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

const leerColapsado = () => {
  try {
    return localStorage.getItem(CLAVE) === '1'
  } catch {
    return false
  }
}

export function AppShell() {
  const { pathname } = useLocation()
  const { usuario, actualizar } = useAuth()
  const [colapsado, setColapsado] = useState(leerColapsado)
  const [tutorial, setTutorial] = useState(() => !usuario.tutorialVisto)
  const privado = usePrivado()

  const cerrarTutorial = () => {
    setTutorial(false)
    if (!usuario.tutorialVisto) actualizar({ data: { tutorialVisto: true } }).catch(() => {})
  }
  const botonPrivado = (
    <Button data-tour="privado" variant="ghost" size="icon" className="size-9 text-muted-foreground" aria-label={privado ? 'Mostrar cifras' : 'Ocultar cifras'} aria-pressed={privado} onClick={alternarPrivado}>
      {privado ? <EyeOff /> : <Eye />}
    </Button>
  )

  const alternar = () => {
    const siguiente = !colapsado
    setColapsado(siguiente)
    try {
      localStorage.setItem(CLAVE, siguiente ? '1' : '0')
    } catch {
      /* sin almacenamiento: no se recuerda */
    }
  }

  return (
    <div className="min-h-svh md:grid md:grid-cols-[var(--sidebar)_minmax(0,1fr)] md:transition-[grid-template-columns] md:duration-200 md:ease-out" style={{ '--sidebar': colapsado ? '4.5rem' : '16rem' }}>
      <aside className={cn('sticky top-0 hidden h-svh flex-col gap-5 overflow-hidden border-r bg-card md:flex', colapsado ? 'items-center px-2 py-4' : 'p-4')}>
        <div className={cn('flex items-center', colapsado ? 'flex-col gap-2' : 'justify-between pl-2')}>
          <Logo compacto={colapsado} />
          <span className={cn('flex', colapsado ? 'flex-col gap-2' : 'items-center')}>
            {botonPrivado}
            <Button variant="ghost" size="icon" className="size-9 text-muted-foreground" aria-label={colapsado ? 'Expandir menú' : 'Contraer menú'} aria-expanded={!colapsado} onClick={alternar}>
              {colapsado ? <PanelLeftOpen /> : <PanelLeftClose />}
            </Button>
          </span>
        </div>
        <nav aria-label="Principal" className="grid gap-1">
          {rutas.map(({ to, label, icon: Icon, tour }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              data-tour={tour}
              title={colapsado ? label : undefined}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-full text-sm font-semibold transition-colors',
                  colapsado ? 'size-11 justify-center' : 'px-4 py-2.5',
                  foco,
                  isActive ? 'bg-mint text-forest' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )
              }
            >
              <Icon className="size-5 shrink-0" aria-hidden="true" />
              <span className={cn(colapsado && 'sr-only')}>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className={cn('mt-auto w-full border-t pt-3', colapsado && 'flex justify-center')}>
          <UsuarioMenu compacto={colapsado} side={colapsado ? 'right' : 'top'} onTutorial={() => setTutorial(true)} />
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 bg-background/85 px-4 py-2.5 backdrop-blur-md md:hidden">
        <Logo />
        <span className="flex items-center gap-1">
          {botonPrivado}
          <UsuarioMenu compacto onTutorial={() => setTutorial(true)} />
        </span>
      </header>

      <main className="mx-auto w-full min-w-0 max-w-[1800px] px-4 pt-3 pb-28 md:px-6 md:py-6 xl:px-10">
        <div key={pathname} className={entradaPagina}>
          <Outlet />
        </div>
      </main>

      <nav aria-label="Principal" className="fixed inset-x-0 bottom-0 z-20 border-t bg-card/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
        <ul className="grid grid-cols-5">
          {rutas.map(({ to, label, icon: Icon, tour }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/'}
                data-tour={tour}
                className={({ isActive }) =>
                  cn('flex flex-col items-center gap-1 py-2 text-[11px] font-semibold', foco, isActive ? 'text-forest' : 'text-muted-foreground')
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={cn('grid h-8 w-14 place-items-center rounded-full transition-colors', isActive && 'bg-mint')}>
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    {label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      {tutorial ? <Tutorial onCerrar={cerrarTutorial} /> : null}
    </div>
  )
}
