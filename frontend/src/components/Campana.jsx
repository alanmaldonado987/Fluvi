import { Bell, BellOff, CheckCheck, ChevronRight, CircleCheck, Sparkles, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { actualizarAvisos, useAvisos } from '@/lib/avisos'
import { recordatorios } from '@/lib/calc'
import { useFormatoMoneda } from '@/lib/privado'
import { cn } from '@/lib/utils'
import { useAuth } from '@/store/auth'
import { useFinance } from '@/store/context'

const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
const enlace = cn('rounded-md text-xs font-semibold text-forest underline-offset-4 hover:underline', foco)

function Aviso({ aviso, onAbrir, onDescartar, nuevo = false, positivo = false }) {
  return (
    <li className="group flex items-center gap-1 rounded-lg transition-colors hover:bg-muted/60">
      <Link to={aviso.ruta} onClick={onAbrir} className={cn('flex min-w-0 flex-1 items-center gap-3 rounded-lg py-2.5 pr-1 pl-2.5 text-sm', foco, !nuevo && !positivo && 'text-muted-foreground')}>
        {positivo ? <Sparkles className="size-4 shrink-0 text-positive" aria-hidden="true" /> : <span className={cn('size-2 shrink-0 rounded-full', nuevo ? 'bg-gold' : 'bg-transparent')} aria-hidden="true" />}
        <span className="min-w-0 flex-1">
          {nuevo ? <span className="sr-only">Nuevo: </span> : null}
          {aviso.texto}
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </Link>
      <button
        type="button"
        onClick={onDescartar}
        aria-label={`Descartar aviso: ${aviso.texto}`}
        className={cn('mr-1 grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground', foco)}
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </li>
  )
}

// Los avisos se calculan siempre sobre el mes en curso, sin importar el período que se esté mirando en la página.
// Se derivan del estado, así que el contador se actualiza al instante cuando se registra o edita algo.
// El contador cuenta solo los avisos sin ver: cada aviso pasa a visto al tocarlo, o todos juntos con "Marcar todo como visto".
// Con la X se descarta un aviso (queda oculto hasta que se resuelva y vuelva a aparecer, o hasta restaurarlo).
// Las buenas noticias (rachas) se listan aparte y nunca suman.
export function Campana({ variant = 'ghost', className }) {
  const { usuario } = useAuth()
  const { state } = useFinance()
  const formatear = useFormatoMoneda()
  const { leidos, descartados } = useAvisos(usuario.id)
  const [abierto, setAbierto] = useState(false)
  const activos = usuario.preferencias.recordatorios
  const todos = recordatorios(state, usuario.preferencias, formatear)
  const vigentes = todos.map((r) => r.id)
  const visibles = todos.filter((r) => !descartados.includes(r.id))
  const pendientes = visibles.filter((r) => !r.positivo)
  const buenas = visibles.filter((r) => r.positivo)
  const sinVer = pendientes.filter((r) => !leidos.includes(r.id)).length
  const cantidad = pendientes.length
  const oculto = todos.length - visibles.length
  const claveAvisos = vigentes.join('|')

  // Olvida los avisos que ya se resolvieron, para que si vuelven a aparecer cuenten como nuevos.
  useEffect(() => {
    actualizarAvisos(usuario.id, claveAvisos ? claveAvisos.split('|') : [])
  }, [usuario.id, claveAvisos])

  const cerrar = () => setAbierto(false)
  const abrirAviso = (aviso) => () => {
    actualizarAvisos(usuario.id, vigentes, { leer: [aviso.id] })
    cerrar()
  }
  const descartar = (aviso) => () => actualizarAvisos(usuario.id, vigentes, { descartar: [aviso.id] })
  const marcarTodos = () => actualizarAvisos(usuario.id, vigentes, { leer: pendientes.map((r) => r.id) })
  const restaurar = () => actualizarAvisos(usuario.id, vigentes, { restaurar: true })
  const botonRestaurar = oculto ? (
    <button type="button" onClick={restaurar} className={enlace}>
      Mostrar {oculto === 1 ? '1 descartado' : `${oculto} descartados`}
    </button>
  ) : null

  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger
        render={<Button data-tour="campana" variant={variant} size="icon" className={cn('relative text-muted-foreground', abierto && 'text-forest', className)} aria-label={sinVer ? `Recordatorios, ${sinVer} sin ver` : 'Recordatorios'} />}
      >
        <Bell />
        {sinVer ? (
          <span aria-hidden="true" className="absolute -top-0.5 -right-0.5 grid min-w-4.5 place-items-center rounded-full bg-gold px-1 text-[10px] leading-4.5 font-bold text-[#14231b] tabular-nums ring-2 ring-background">
            {sinVer > 9 ? '9+' : sinVer}
          </span>
        ) : null}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
          <h2 className="text-sm font-bold">Recordatorios</h2>
          {cantidad ? (
            sinVer ? (
              <button type="button" onClick={marcarTodos} className={cn(enlace, 'inline-flex items-center gap-1')}>
                <CheckCheck className="size-3.5" aria-hidden="true" />
                Marcar todo como visto
              </button>
            ) : (
              <span className="text-xs text-muted-foreground">Todo visto</span>
            )
          ) : null}
        </div>
        {!activos ? (
          <div className="grid justify-items-center gap-2 px-4 py-8 text-center">
            <BellOff className="size-6 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">Los recordatorios están desactivados.</p>
            <Link to="/configuracion/notificaciones" onClick={cerrar} className="text-sm font-semibold text-forest underline-offset-4 hover:underline">
              Activarlos en Configuración
            </Link>
          </div>
        ) : (
          <>
            {cantidad ? (
              <ul className="grid gap-0.5 p-1.5">
                {pendientes.map((r) => (
                  <Aviso key={r.id} aviso={r} onAbrir={abrirAviso(r)} onDescartar={descartar(r)} nuevo={!leidos.includes(r.id)} />
                ))}
              </ul>
            ) : (
              <div className={cn('grid justify-items-center gap-2 px-4 text-center', buenas.length ? 'py-5' : 'py-8')}>
                <CircleCheck className="size-6 text-positive" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">Estás al día. No tienes recordatorios.</p>
              </div>
            )}
            {buenas.length ? (
              <ul className="grid gap-0.5 border-t p-1.5">
                {buenas.map((r) => (
                  <Aviso key={r.id} aviso={r} onAbrir={abrirAviso(r)} onDescartar={descartar(r)} positivo />
                ))}
              </ul>
            ) : null}
            {botonRestaurar ? <div className="flex justify-center border-t px-4 py-2.5">{botonRestaurar}</div> : null}
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
