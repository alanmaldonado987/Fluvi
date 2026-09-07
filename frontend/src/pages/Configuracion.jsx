import { Bell, Database, Download, LoaderCircle, LogOut, Monitor, Moon, Palette, Shield, Sun, User } from 'lucide-react'
import { useState } from 'react'
import { Navigate, NavLink, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Campo } from '@/components/Campo'
import { FormularioInline } from '@/components/FormularioInline'
import { PageHeader } from '@/components/PageHeader'
import { Panel } from '@/components/Panel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { fechaLarga, hoy } from '@/lib/format'
import { guardarTema, useTema } from '@/lib/tema'
import { cn } from '@/lib/utils'
import { useAuth } from '@/store/auth'
import { useFinance } from '@/store/context'

const secciones = [
  { id: 'perfil', label: 'Perfil', icon: User, detalle: 'Tu nombre y el correo con el que entras.' },
  { id: 'seguridad', label: 'Seguridad', icon: Shield, detalle: 'Contraseña y sesiones abiertas.' },
  { id: 'notificaciones', label: 'Notificaciones', icon: Bell, detalle: 'Qué avisos quieres ver y cuándo.' },
  { id: 'apariencia', label: 'Apariencia', icon: Palette, detalle: 'Cómo se ve Fluvi en este dispositivo.' },
  { id: 'datos', label: 'Datos', icon: Database, detalle: 'Copias de seguridad de tu información.' },
]

const mensajesCuenta = {
  same_password: 'La contraseña nueva debe ser distinta a la anterior.',
  weak_password: 'La contraseña debe tener al menos 6 caracteres.',
  email_exists: 'Ya existe una cuenta con ese correo.',
  over_email_send_rate_limit: 'Demasiados intentos. Espera un minuto y vuelve a probar.',
}

const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

function useGuardar() {
  const { actualizar } = useAuth()
  return (datos, mensaje) => async (valor) => {
    try {
      await actualizar(datos(valor))
      toast.success(mensaje)
    } catch (err) {
      toast.error(mensajesCuenta[err.code] ?? 'No se pudo guardar el cambio.')
    }
  }
}

function Perfil() {
  const { usuario } = useAuth()
  const guardar = useGuardar()
  return (
    <>
      <Panel title="Datos personales">
        <div className="grid gap-4">
          <FormularioInline label="Nombre" valorInicial={usuario.nombre} autoComplete="name" onGuardar={guardar((nombre) => ({ data: { nombre } }), 'Nombre actualizado.')} />
          <FormularioInline label="Correo" tipo="email" valorInicial={usuario.email} autoComplete="email" onGuardar={guardar((email) => ({ email }), 'Te enviamos un enlace al correo nuevo para confirmar el cambio.')} />
          <p className="text-xs text-muted-foreground">
            {usuario.correoConfirmado ? 'Correo confirmado.' : 'Correo pendiente de confirmar.'} Al cambiarlo, el nuevo debe confirmarse desde el enlace que te llega.
          </p>
        </div>
      </Panel>
      <Panel title="Cuenta">
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Miembro desde</dt>
            <dd className="font-semibold">{usuario.creadoEn ? fechaLarga(usuario.creadoEn.slice(0, 10)) : 'Sin dato'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Último acceso</dt>
            <dd className="font-semibold">{usuario.ultimoAcceso ? fechaLarga(usuario.ultimoAcceso.slice(0, 10)) : 'Sin dato'}</dd>
          </div>
        </dl>
      </Panel>
    </>
  )
}

function Seguridad() {
  const { actualizar, salir } = useAuth()
  const [clave, setClave] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [enviando, setEnviando] = useState(false)
  const coincide = clave.length >= 6 && clave === confirmacion

  const cambiar = async (e) => {
    e.preventDefault()
    setEnviando(true)
    try {
      await actualizar({ password: clave })
      toast.success('Contraseña actualizada.')
      setClave('')
      setConfirmacion('')
    } catch (err) {
      toast.error(mensajesCuenta[err.code] ?? 'No se pudo cambiar la contraseña.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <Panel title="Contraseña">
        <form onSubmit={cambiar} className="grid gap-4 sm:max-w-md">
          <Campo label="Contraseña nueva">
            <Input type="password" autoComplete="new-password" minLength={6} placeholder="Mínimo 6 caracteres" className="bg-card" value={clave} onChange={(e) => setClave(e.target.value)} />
          </Campo>
          <Campo label="Repite la contraseña">
            <Input type="password" autoComplete="new-password" minLength={6} className="bg-card" value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} />
          </Campo>
          {confirmacion && !coincide ? <p className="text-xs text-negative">Las contraseñas no coinciden o tienen menos de 6 caracteres.</p> : null}
          <Button type="submit" variant="secondary" className="justify-self-start" disabled={!coincide || enviando}>
            {enviando ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
            Cambiar contraseña
          </Button>
        </form>
      </Panel>
      <Panel title="Sesiones">
        <p className="text-sm text-muted-foreground">Si entraste desde un computador ajeno o perdiste el celular, cierra todas las sesiones. Tendrás que volver a entrar en cada dispositivo.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => salir()}>
            <LogOut /> Cerrar sesión aquí
          </Button>
          <Button variant="outline" className="text-destructive" onClick={() => salir(true)}>
            <LogOut /> Cerrar sesión en todos los dispositivos
          </Button>
        </div>
      </Panel>
    </>
  )
}

function Interruptor({ label, detalle, checked, onChange }) {
  return (
    <label className="flex items-start gap-3 py-3">
      <input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-leaf" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {detalle ? <span className="block text-xs text-muted-foreground">{detalle}</span> : null}
      </span>
    </label>
  )
}

function Notificaciones() {
  const { usuario, actualizar } = useAuth()
  const [prefs, setPrefs] = useState(usuario.preferencias)
  const [guardando, setGuardando] = useState(false)
  const cambio = JSON.stringify(prefs) !== JSON.stringify(usuario.preferencias)
  const set = (campo) => (valor) => setPrefs((p) => ({ ...p, [campo]: valor }))

  const guardar = async () => {
    setGuardando(true)
    try {
      await actualizar({ data: { preferencias: prefs } })
      toast.success('Notificaciones actualizadas.')
    } catch {
      toast.error('No se pudieron guardar las notificaciones.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <>
      <Panel title="Avisos en Inicio">
        <div className="divide-y">
          <Interruptor label="Alertas de presupuesto" detalle="Cuando una categoría supera lo proyectado en el mes." checked={prefs.alertasPresupuesto} onChange={set('alertasPresupuesto')} />
          <Interruptor label="Recurrentes por confirmar" detalle="Los movimientos que se repiten cada mes y aún no has registrado." checked={prefs.pendientesInicio} onChange={set('pendientesInicio')} />
          <Interruptor label="Recordatorios" detalle="Días sin registrar, categorías cerca del límite y saldos de billeteras pendientes." checked={prefs.recordatorios} onChange={set('recordatorios')} />
        </div>
      </Panel>
      <Panel title="Umbrales de los recordatorios">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Avisar tras días sin registrar">
            <Input type="number" inputMode="numeric" min={1} max={30} className="bg-card" disabled={!prefs.recordatorios} value={prefs.diasSinRegistrar} onChange={(e) => set('diasSinRegistrar')(Number(e.target.value))} />
          </Campo>
          <Campo label="Avisar al superar este % del presupuesto">
            <Input type="number" inputMode="numeric" min={50} max={100} className="bg-card" disabled={!prefs.recordatorios} value={prefs.umbralPresupuesto} onChange={(e) => set('umbralPresupuesto')(Number(e.target.value))} />
          </Campo>
        </div>
      </Panel>
      <Button className="justify-self-start" disabled={!cambio || guardando} onClick={guardar}>
        {guardando ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
        Guardar cambios
      </Button>
    </>
  )
}

const temas = [
  { id: 'claro', label: 'Claro', icon: Sun, fondo: '#f4f7f2', tarjeta: '#ffffff', texto: '#244d35' },
  { id: 'oscuro', label: 'Oscuro', icon: Moon, fondo: '#111614', tarjeta: '#182019', texto: '#c6e6d3' },
  { id: 'sistema', label: 'Sistema', icon: Monitor, fondo: 'linear-gradient(90deg, #f4f7f2 50%, #111614 50%)', tarjeta: '#7db891', texto: '#244d35' },
]

function Apariencia() {
  const tema = useTema()
  return (
    <Panel title="Tema">
      <p className="text-sm text-muted-foreground">Se guarda en este dispositivo. "Sistema" sigue la preferencia del teléfono o del computador.</p>
      <div role="radiogroup" aria-label="Tema" className="mt-4 grid gap-3 sm:grid-cols-3">
        {temas.map(({ id, label, icon: Icon, fondo, tarjeta, texto }) => {
          const activo = tema === id
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={activo}
              onClick={() => guardarTema(id)}
              className={cn('rounded-2xl border-2 p-3 text-left transition-colors', foco, activo ? 'border-leaf' : 'border-border hover:border-input')}
            >
              <span className="block h-20 rounded-xl p-3" style={{ background: fondo }} aria-hidden="true">
                <span className="block h-4 w-2/3 rounded-md" style={{ background: tarjeta }} />
                <span className="mt-2 block h-6 w-full rounded-md" style={{ background: tarjeta }} />
                <span className="mt-1 block h-1.5 w-1/2 rounded-full" style={{ background: texto }} />
              </span>
              <span className="mt-3 flex items-center gap-2 text-sm font-semibold">
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </Panel>
  )
}

function Datos() {
  const { state } = useFinance()
  const descargar = () => {
    const { categorias, billeteras, movimientos, presupuestos, saldos, recurrentes, metas } = state
    const contenido = JSON.stringify({ exportadoEn: hoy(), categorias, billeteras, movimientos, presupuestos, saldos, recurrentes, metas }, null, 2)
    const url = URL.createObjectURL(new Blob([contenido], { type: 'application/json' }))
    const enlace = Object.assign(document.createElement('a'), { href: url, download: `fluvi-copia-${hoy()}.json` })
    enlace.click()
    URL.revokeObjectURL(url)
  }
  const total = state.movimientos.length
  return (
    <Panel title="Copia de seguridad">
      <p className="text-sm text-muted-foreground">
        Descarga todos tus datos en un archivo JSON: {state.categorias.length} categorías, {state.billeteras.length} billeteras y {total} {total === 1 ? 'movimiento' : 'movimientos'}. Guárdalo donde quieras; tus datos siempre son tuyos.
      </p>
      <Button variant="secondary" className="mt-4" onClick={descargar}>
        <Download /> Descargar copia
      </Button>
    </Panel>
  )
}

const contenido = { perfil: Perfil, seguridad: Seguridad, notificaciones: Notificaciones, apariencia: Apariencia, datos: Datos }

export default function Configuracion() {
  const { seccion = 'perfil' } = useParams()
  const actual = secciones.find((s) => s.id === seccion)
  if (!actual) return <Navigate to="/configuracion/perfil" replace />
  const Seccion = contenido[actual.id]

  return (
    <div className="grid gap-5">
      <PageHeader title="Configuración" description="Ajustes de tu cuenta y de la app." />
      <div className="grid gap-5 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <nav aria-label="Secciones de configuración" className="-mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0">
          {secciones.map(({ id, label, icon: Icon }) => (
            <NavLink
              key={id}
              to={`/configuracion/${id}`}
              className={({ isActive }) =>
                cn('flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors lg:rounded-xl', foco, isActive ? 'bg-mint text-forest' : 'text-muted-foreground hover:bg-muted hover:text-foreground')
              }
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>
        <section className="grid content-start gap-5" aria-labelledby="seccion-titulo">
          <div>
            <h2 id="seccion-titulo" className="text-xl">
              {actual.label}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{actual.detalle}</p>
          </div>
          <Seccion />
        </section>
      </div>
    </div>
  )
}
