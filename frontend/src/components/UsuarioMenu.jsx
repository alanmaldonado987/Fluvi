import { CircleHelp, LogOut, Settings } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '@/components/Avatar'
import { CerrarSesionDialog } from '@/components/CerrarSesionDialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { VERSION } from '@/lib/version'
import { useAuth } from '@/store/auth'

export function UsuarioMenu({ compacto = false, side = compacto ? 'bottom' : 'top', onTutorial }) {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [confirmando, setConfirmando] = useState(false)
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          data-tour="usuario"
          aria-label={compacto ? 'Cuenta' : undefined}
          className={cn(
            'flex items-center gap-3 rounded-full text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
            compacto ? 'p-0.5' : 'w-full p-1.5 pr-3',
          )}
        >
          <Avatar nombre={usuario.nombre} url={usuario.avatar} className="size-9 text-sm" />
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
          <DropdownMenuItem onClick={onTutorial}>
            <CircleHelp /> Ver el tutorial
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setConfirmando(true)}>
            <LogOut /> Cerrar sesión
          </DropdownMenuItem>
          {VERSION ? (
            <>
              <DropdownMenuSeparator />
              <p className="px-2 py-1 text-xs text-muted-foreground">Fluvi v{VERSION}</p>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      <CerrarSesionDialog open={confirmando} onOpenChange={setConfirmando} />
    </>
  )
}
