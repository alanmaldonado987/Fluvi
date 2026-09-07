import { LogOut, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useAuth } from '@/store/auth'

const iniciales = (nombre) =>
  nombre
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()

export function UsuarioMenu({ compacto = false, side = compacto ? 'bottom' : 'top' }) {
  const { usuario, salir } = useAuth()
  const navigate = useNavigate()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={compacto ? 'Cuenta' : undefined}
        className={cn(
          'flex items-center gap-3 rounded-full text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          compacto ? 'p-0.5' : 'w-full p-1.5 pr-3',
        )}
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-forest text-sm font-bold text-on-forest">{iniciales(usuario.nombre)}</span>
        {compacto ? null : (
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{usuario.nombre}</span>
            <span className="block truncate text-xs text-muted-foreground">{usuario.email}</span>
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={side === 'bottom' ? 'end' : 'start'} side={side} className="w-52">
        <DropdownMenuItem onClick={() => navigate('/configuracion')}>
          <Settings /> Configuración
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={salir}>
          <LogOut /> Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
