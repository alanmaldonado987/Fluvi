import { Check, ListChecks, LoaderCircle, Plus, Users, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { EmptyState } from '@/components/EmptyState'
import { ListaDialog } from '@/components/ListaDialog'
import { Money } from '@/components/Money'
import { PageHeader } from '@/components/PageHeader'
import { Panel } from '@/components/Panel'
import { Progreso } from '@/components/Progreso'
import { Button } from '@/components/ui/button'
import { invitacionesPendientes, listasVisibles, resumenItems } from '@/lib/listas'
import { entrada, escalonado } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { useAuth } from '@/store/auth'
import { useListas } from '@/store/listasContext'

const nombreDe = (nombre, email) => nombre || email.split('@')[0]

function Invitacion({ invitacion, onResponder }) {
  const [respondiendo, setRespondiendo] = useState(null)
  const { lista } = invitacion
  const responder = async (aceptar) => {
    setRespondiendo(aceptar ? 'si' : 'no')
    try {
      await onResponder(lista.id, aceptar)
      toast.success(aceptar ? `Ya participas en «${lista.nombre}».` : 'Invitación rechazada.')
    } catch (err) {
      toast.error(err?.message || 'No se pudo responder la invitación.')
      setRespondiendo(null)
    }
  }
  return (
    <li className="flex flex-wrap items-center gap-3 rounded-xl bg-gold/15 px-4 py-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gold/30 text-forest" aria-hidden="true">
        <Users className="size-4" />
      </span>
      <p className="min-w-0 flex-1 basis-56 text-sm">
        <strong>{nombreDe(lista.propietarioNombre, lista.propietarioEmail)}</strong> te invitó a la lista <strong>«{lista.nombre}»</strong>.
      </p>
      <span className="flex gap-2">
        <Button size="sm" disabled={respondiendo !== null} onClick={() => responder(true)}>
          {respondiendo === 'si' ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Check />} Aceptar
        </Button>
        <Button size="sm" variant="outline" disabled={respondiendo !== null} onClick={() => responder(false)}>
          {respondiendo === 'no' ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <X />} Rechazar
        </Button>
      </span>
    </li>
  )
}

export default function Listas() {
  const { state, actions } = useListas()
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [creando, setCreando] = useState(false)

  const listas = listasVisibles(state.listas, state.miembros, usuario.id)
  const invitaciones = invitacionesPendientes(state.listas, state.miembros, usuario.id)

  return (
    <div className="grid gap-5">
      <PageHeader title="Listas" description="Arma listas de lo que quieres comprar, con sus precios. No afectan tus saldos.">
        <Button onClick={() => setCreando(true)}>
          <Plus /> Nueva lista
        </Button>
      </PageHeader>

      {invitaciones.length ? (
        <Panel title="Invitaciones" className={entrada}>
          <ul className="grid gap-2">
            {invitaciones.map((i) => (
              <Invitacion key={i.lista.id} invitacion={i} onResponder={actions.responderInvitacion} />
            ))}
          </ul>
        </Panel>
      ) : null}

      {listas.length ? (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {listas.map((l, i) => {
            const items = state.items.filter((x) => x.listaId === l.id)
            const r = resumenItems(items)
            const propia = l.propietarioId === usuario.id
            const participantes = state.miembros.filter((m) => m.listaId === l.id && m.estado === 'aceptada').length
            return (
              <li key={l.id} className={entrada} style={escalonado(i)}>
                <Link to={`/listas/${l.id}`} className={cn('superficie grid grid-cols-1 gap-3 p-4 transition-shadow hover:shadow-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring')}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="truncate text-base">{l.nombre}</h2>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        {l.compartida ? <Users className="size-3.5 shrink-0" aria-hidden="true" /> : null}
                        {propia ? (l.compartida ? (participantes ? `Compartida con ${participantes} ${participantes === 1 ? 'persona' : 'personas'}` : 'Compartida') : 'Solo tuya') : `De ${nombreDe(l.propietarioNombre, l.propietarioEmail)}`}
                      </p>
                    </div>
                    <Money value={r.total} className="shrink-0 text-base font-bold" />
                  </div>
                  <div>
                    <Progreso valor={r.cantidad ? r.cuantosComprados / r.cantidad : 0} className="h-1.5" />
                    <p className="mt-1.5 flex justify-between gap-2 text-xs text-muted-foreground">
                      <span>{r.cantidad ? `${r.cuantosComprados} de ${r.cantidad} ${r.cantidad === 1 ? 'comprado' : 'comprados'}` : 'Sin ítems todavía'}</span>
                      {r.cantidad ? (
                        <span>
                          Por comprar <Money value={r.pendiente} className="font-semibold text-foreground" />
                        </span>
                      ) : null}
                    </p>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      ) : (
        <EmptyState icon={ListChecks} title="Aún no tienes listas" description="Crea una lista con lo que quieres comprar y marca cada cosa cuando ya la tengas. También puedes compartirla con otras personas.">
          <Button onClick={() => setCreando(true)}>
            <Plus /> Crear mi primera lista
          </Button>
        </EmptyState>
      )}

      <ListaDialog open={creando} onOpenChange={setCreando} onGuardar={(datos) => navigate(`/listas/${actions.crearLista(datos)}`)} />
    </div>
  )
}
