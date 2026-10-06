import { Bell, Check, ChevronRight, CircleCheck, Clock, Database, Download, Eye, EyeOff, LoaderCircle, LogOut, Monitor, MonitorSmartphone, Moon, Palette, Shield, Sun, Trash2, TriangleAlert, User } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Navigate, NavLink, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { BorrarDatosDialog } from '@/components/BorrarDatosDialog'
import { Campo } from '@/components/Campo'
import { CerrarSesionDialog } from '@/components/CerrarSesionDialog'
import { FormularioInline } from '@/components/FormularioInline'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { exportarExcel } from '@/lib/excel'
import { fechaLarga } from '@/lib/format'
import { entrada } from '@/lib/motion'
import { guardarTema, useTema } from '@/lib/tema'
import { cn } from '@/lib/utils'
import { useAuth } from '@/store/auth'
import { useFinance } from '@/store/context'

const secciones = [
  { id: 'perfil', label: 'Perfil', icon: User, detalle: 'Tu nombre y el correo con el que entras.' },
  { id: 'seguridad', label: 'Seguridad', icon: Shield, detalle: 'Contraseña y sesiones abiertas.' },
  { id: 'notificaciones', label: 'Notificaciones', icon: Bell, detalle: 'Qué avisos quieres ver y cuándo.' },
  { id: 'apariencia', label: 'Apariencia', icon: Palette, detalle: 'Cómo se ve Fluvi en este dispositivo.' },
  { id: 'datos', label: 'Datos', icon: Database, detalle: 'Copias de seguridad y borrado de tu información.' },
]

const mensajesCuenta = {
  same_password: 'La contraseña nueva debe ser distinta a la anterior.',
  weak_password: 'La contraseña debe tener al menos 6 caracteres.',
  email_exists: 'Ya existe una cuenta con ese correo.',
  over_email_send_rate_limit: 'Demasiados intentos. Espera un minuto y vuelve a probar.',
}

const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
const MINIMO_CLAVE = 6

const iniciales = (nombre) =>
  nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()

// Grupo de ajustes: título fuera de la tarjeta, filas separadas por líneas y una nota al pie opcional.
function Grupo({ titulo, nota, peligro = false, children }) {
  return (
    <section className="grid gap-2">
      {titulo ? <h3 className={cn('px-1 text-sm font-semibold', peligro ? 'text-destructive' : 'text-muted-foreground')}>{titulo}</h3> : null}
      <div className={cn('superficie divide-y overflow-hidden', peligro && '[--borde-suave:color-mix(in_oklch,var(--destructive)_35%,transparent)]')}>{children}</div>
      {nota ? <div className="px-1 text-xs leading-relaxed text-muted-foreground">{nota}</div> : null}
    </section>
  )
}

function Fila({ className, children }) {
  return <div className={cn('flex items-center gap-4 px-4 py-3.5 sm:px-5', className)}>{children}</div>
}

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
  const confirmado = usuario.correoConfirmado
  const Estado = confirmado ? CircleCheck : Clock
  return (
    <>
      <div className="superficie flex items-center gap-4 p-4 sm:p-5">
        <span className="grid size-14 shrink-0 place-items-center rounded-full bg-forest text-lg font-bold text-on-forest" aria-hidden="true">
          {iniciales(usuario.nombre)}
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold">{usuario.nombre}</p>
          <p className="truncate text-sm text-muted-foreground">{usuario.email}</p>
        </div>
      </div>
      <Grupo
        titulo="Datos personales"
        nota={
          <p className="flex items-start gap-1.5">
            <Estado className={cn('mt-px size-3.5 shrink-0', confirmado ? 'text-positive' : 'text-gold')} aria-hidden="true" />
            <span>
              {confirmado ? 'Correo confirmado.' : 'Correo pendiente de confirmar.'} Al cambiarlo, el nuevo debe confirmarse desde el enlace que te llega.
            </span>
          </p>
        }
      >
        <Fila>
          <FormularioInline label="Nombre" valorInicial={usuario.nombre} autoComplete="name" onGuardar={guardar((nombre) => ({ data: { nombre } }), 'Nombre actualizado.')} />
        </Fila>
        <Fila>
          <FormularioInline label="Correo" tipo="email" valorInicial={usuario.email} autoComplete="email" onGuardar={guardar((email) => ({ email }), 'Te enviamos un enlace al correo nuevo para confirmar el cambio.')} />
        </Fila>
      </Grupo>
      <Grupo titulo="Cuenta">
        <dl className="contents">
          <Fila className="justify-between">
            <dt className="text-sm text-muted-foreground">Miembro desde</dt>
            <dd className="text-sm font-medium">{usuario.creadoEn ? fechaLarga(usuario.creadoEn.slice(0, 10)) : 'Sin dato'}</dd>
          </Fila>
          <Fila className="justify-between">
            <dt className="text-sm text-muted-foreground">Último acceso</dt>
            <dd className="text-sm font-medium">{usuario.ultimoAcceso ? fechaLarga(usuario.ultimoAcceso.slice(0, 10)) : 'Sin dato'}</dd>
          </Fila>
        </dl>
      </Grupo>
    </>
  )
}

function CampoClave({ label, valor, onChange, placeholder, valido }) {
  const [ver, setVer] = useState(false)
  return (
    <Campo label={label}>
      <ClaveInput ver={ver} setVer={setVer} valor={valor} onChange={onChange} placeholder={placeholder} valido={valido} />
    </Campo>
  )
}

// Campo pasa el id por cloneElement; aquí llega al input real.
function ClaveInput({ id, ver, setVer, valor, onChange, placeholder, valido }) {
  return (
    <div className="relative">
      <Input id={id} type={ver ? 'text' : 'password'} autoComplete="new-password" minLength={MINIMO_CLAVE} maxLength={72} placeholder={placeholder} className="bg-card pr-18" value={valor} onChange={(e) => onChange(e.target.value)} />
      <span className="absolute top-1/2 right-1.5 flex -translate-y-1/2 items-center gap-1">
        {valido ? <Check className={cn('size-4 text-positive', entrada)} aria-hidden="true" /> : null}
        <button
          type="button"
          aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={ver}
          onClick={() => setVer((v) => !v)}
          className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          {ver ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </span>
    </div>
  )
}

function FilaAccion({ icon: Icon, peligro = false, onClick, children }) {
  return (
    <button type="button" onClick={onClick} className={cn('flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm font-medium transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none sm:px-5', peligro && 'text-destructive')}>
      <Icon className={cn('size-4 shrink-0', !peligro && 'text-muted-foreground')} aria-hidden="true" />
      <span className="min-w-0 flex-1">{children}</span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </button>
  )
}

function Seguridad() {
  const { actualizar } = useAuth()
  const [cerrando, setCerrando] = useState(null)
  const [clave, setClave] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [enviando, setEnviando] = useState(false)
  const coincide = clave.length >= MINIMO_CLAVE && clave === confirmacion

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
      <Grupo titulo="Contraseña">
        <form onSubmit={cambiar}>
          <div className="grid gap-4 p-4 sm:p-5">
            <CampoClave label="Contraseña nueva" placeholder="Mínimo 6 caracteres" valor={clave} onChange={setClave} valido={clave.length >= MINIMO_CLAVE} />
            <CampoClave label="Repite la contraseña" valor={confirmacion} onChange={setConfirmacion} valido={coincide} />
            {confirmacion && !coincide ? (
              <p className={cn('flex items-center gap-1.5 text-xs text-negative', entrada)}>
                <TriangleAlert className="size-3.5 shrink-0" aria-hidden="true" />
                Las contraseñas no coinciden o tienen menos de 6 caracteres.
              </p>
            ) : null}
          </div>
          <div className="flex justify-end border-t bg-muted/40 px-4 py-3 sm:px-5">
            <Button type="submit" disabled={!coincide || enviando}>
              {enviando ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
              Cambiar contraseña
            </Button>
          </div>
        </form>
      </Grupo>
      <Grupo titulo="Sesiones" nota="Si entraste desde un computador ajeno o perdiste el celular, cierra todas las sesiones. Tendrás que volver a entrar en cada dispositivo.">
        <FilaAccion icon={LogOut} onClick={() => setCerrando(false)}>
          Cerrar sesión aquí
        </FilaAccion>
        <FilaAccion icon={MonitorSmartphone} peligro onClick={() => setCerrando(true)}>
          Cerrar sesión en todos los dispositivos
        </FilaAccion>
      </Grupo>
      <CerrarSesionDialog open={cerrando !== null} todos={cerrando === true} onOpenChange={(abierto) => !abierto && setCerrando(null)} />
    </>
  )
}

function Interruptor({ label, detalle, checked, onChange }) {
  return (
    <label className="flex items-center gap-4 px-4 py-3.5 sm:px-5">
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{label}</span>
        {detalle ? <span className="mt-0.5 block text-xs text-muted-foreground">{detalle}</span> : null}
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  )
}

function Umbral({ label, children }) {
  return (
    <Fila>
      <Campo label={label} className="flex w-full items-center justify-between gap-4 [&>label]:font-normal">
        {children}
      </Campo>
    </Fila>
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

  const numero = 'h-9 w-20 shrink-0 bg-card text-right tabular-nums'
  return (
    <>
      <Grupo titulo="Avisos en Inicio">
        <Interruptor label="Alertas de presupuesto" detalle="Cuando una categoría supera lo proyectado en el mes." checked={prefs.alertasPresupuesto} onChange={set('alertasPresupuesto')} />
        <Interruptor label="Recurrentes por confirmar" detalle="Los movimientos que se repiten cada mes y aún no has registrado." checked={prefs.pendientesInicio} onChange={set('pendientesInicio')} />
        <Interruptor label="Recordatorios" detalle="Días sin registrar, categorías cerca del límite y saldos de billeteras pendientes." checked={prefs.recordatorios} onChange={set('recordatorios')} />
      </Grupo>
      <div className={cn('transition-opacity duration-200', !prefs.recordatorios && 'opacity-55')}>
        <Grupo titulo="Umbrales de los recordatorios">
          <Umbral label="Avisar tras días sin registrar">
            <Input type="number" inputMode="numeric" min={1} max={30} step={1} className={numero} disabled={!prefs.recordatorios} value={prefs.diasSinRegistrar} onChange={(e) => { const n = Math.round(Number(e.target.value)); if (n >= 1 && n <= 30) set('diasSinRegistrar')(n) }} />
          </Umbral>
          <Umbral label="Avisar al superar este % del presupuesto">
            <Input type="number" inputMode="numeric" min={50} max={100} step={1} className={numero} disabled={!prefs.recordatorios} value={prefs.umbralPresupuesto} onChange={(e) => { const n = Math.round(Number(e.target.value)); if (n >= 50 && n <= 100) set('umbralPresupuesto')(n) }} />
          </Umbral>
        </Grupo>
      </div>
      <div className="z-10 flex justify-end md:sticky md:bottom-6">
        <Button className={cn('transition-shadow', cambio && 'shadow-elevated')} disabled={!cambio || guardando} onClick={guardar}>
          {guardando ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
          Guardar cambios
        </Button>
      </div>
    </>
  )
}

const claro = { fondo: '#f4f7f2', barra: '#ffffff', tarjeta: '#ffffff', borde: '#dde6e0', acento: '#2e7d55', texto: '#244d35' }
const oscuro = { fondo: '#111614', barra: '#182019', tarjeta: '#182019', borde: '#2a3630', acento: '#6fc492', texto: '#c6e6d3' }

const temas = [
  { id: 'claro', label: 'Claro', icon: Sun, paletas: [claro] },
  { id: 'oscuro', label: 'Oscuro', icon: Moon, paletas: [oscuro] },
  { id: 'sistema', label: 'Sistema', icon: Monitor, paletas: [claro, oscuro] },
]

// Miniatura de la app con la paleta del tema: barra lateral, una tarjeta destacada y dos tarjetas.
function Miniatura({ p }) {
  return (
    <span className="flex h-full min-w-0 flex-1 gap-1.5 p-2" style={{ background: p.fondo }}>
      <span className="w-1/4 rounded-md" style={{ background: p.barra, boxShadow: `0 0 0 1px ${p.borde}` }}>
        <span className="mx-1.5 mt-2 block h-1.5 rounded-full" style={{ background: p.acento, opacity: 0.6 }} />
        <span className="mx-1.5 mt-1.5 block h-1 rounded-full" style={{ background: p.borde }} />
        <span className="mx-1.5 mt-1 block h-1 rounded-full" style={{ background: p.borde }} />
      </span>
      <span className="flex flex-1 flex-col gap-1.5">
        <span className="h-1/2 rounded-md" style={{ background: `linear-gradient(135deg, ${p.texto}, ${p.acento})` }} />
        <span className="flex flex-1 gap-1.5">
          <span className="flex-1 rounded-md" style={{ background: p.tarjeta, boxShadow: `0 0 0 1px ${p.borde}` }} />
          <span className="flex-1 rounded-md" style={{ background: p.tarjeta, boxShadow: `0 0 0 1px ${p.borde}` }} />
        </span>
      </span>
    </span>
  )
}

function Apariencia() {
  const tema = useTema()
  return (
    <Grupo titulo="Tema" nota={'Se guarda en este dispositivo. "Sistema" sigue la preferencia del teléfono o del computador.'}>
      <div role="radiogroup" aria-label="Tema" className="grid gap-4 p-4 sm:grid-cols-3 sm:p-5">
        {temas.map(({ id, label, icon: Icon, paletas }) => {
          const activo = tema === id
          return (
            <button key={id} type="button" role="radio" aria-checked={activo} onClick={() => guardarTema(id)} className={cn('group rounded-xl text-left', foco)}>
              <span className={cn('flex h-24 overflow-hidden rounded-xl ring-1 transition-[box-shadow] duration-200', activo ? 'ring-2 ring-leaf ring-offset-2 ring-offset-card' : 'ring-border group-hover:ring-input')} aria-hidden="true">
                {paletas.map((p, i) => (
                  <Miniatura key={i} p={p} />
                ))}
              </span>
              <span className={cn('mt-2.5 flex items-center gap-2 text-sm', activo ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground')}>
                <Icon className="size-4" aria-hidden="true" />
                {label}
                {activo ? <Check className={cn('ml-auto size-4 text-leaf', entrada)} strokeWidth={2.5} aria-hidden="true" /> : null}
              </span>
            </button>
          )
        })}
      </div>
    </Grupo>
  )
}

function Datos() {
  const { state } = useFinance()
  const [borrando, setBorrando] = useState(false)
  const [exportando, setExportando] = useState(false)
  const descargar = async () => {
    setExportando(true)
    try {
      await exportarExcel(state, state.anio)
    } catch {
      toast.error('No se pudo generar el archivo.')
    } finally {
      setExportando(false)
    }
  }
  const total = state.movimientos.length
  return (
    <>
      <Grupo titulo="Copia de seguridad">
        <Fila className="flex-col items-stretch sm:flex-row sm:items-center">
          <p className="flex-1 text-sm text-muted-foreground">
            Descarga tus datos del {state.anio} en un Excel con la misma estructura de tu archivo de finanzas (Ingresos, Egresos, Caja, Registros): {state.categorias.length} categorías, {state.billeteras.length} billeteras y {total} {total === 1 ? 'movimiento' : 'movimientos'}.
          </p>
          <Button variant="outline" className="shrink-0 self-start sm:self-center" onClick={descargar} disabled={exportando}>
            {exportando ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Download />} Descargar Excel {state.anio}
          </Button>
        </Fila>
      </Grupo>
      <Grupo titulo="Borrar todos mis datos" peligro>
        <Fila className="flex-col items-stretch sm:flex-row sm:items-center">
          <p className="flex-1 text-sm text-muted-foreground">
            Deja la cuenta vacía, como recién creada: se borran categorías, billeteras, movimientos, presupuestos, metas, recurrentes y notas. Tu usuario y tu contraseña se conservan. Descarga una copia antes si quieres guardarlos.
          </p>
          <Button variant="destructive" className="shrink-0 self-start sm:self-center" onClick={() => setBorrando(true)}>
            <Trash2 /> Borrar todos mis datos
          </Button>
        </Fila>
      </Grupo>
      <BorrarDatosDialog open={borrando} onOpenChange={setBorrando} />
    </>
  )
}

const contenido = { perfil: Perfil, seguridad: Seguridad, notificaciones: Notificaciones, apariencia: Apariencia, datos: Datos }

export default function Configuracion() {
  const { seccion = 'perfil' } = useParams()
  const navRef = useRef(null)
  const actual = secciones.find((s) => s.id === seccion)

  // En móvil las secciones van en una fila con scroll: se centra la activa para que siempre quede a la vista.
  useEffect(() => {
    navRef.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [seccion])

  if (!actual) return <Navigate to="/configuracion/perfil" replace />
  const Seccion = contenido[actual.id]

  return (
    <div className="grid gap-5">
      <PageHeader title="Configuración" description="Ajustes de tu cuenta y de la app." cifras={false} />
      <div className="grid items-start gap-6 lg:grid-cols-[13rem_minmax(0,1fr)] xl:grid-cols-[14rem_minmax(0,46rem)] xl:gap-10">
        <nav ref={navRef} aria-label="Secciones de configuración" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] lg:sticky lg:top-6 lg:mx-0 lg:overflow-visible lg:px-0">
          <ul className="flex w-max gap-1 lg:grid lg:w-auto lg:gap-0.5">
            {secciones.map(({ id, label, icon: Icon }) => (
              <li key={id}>
                <NavLink
                  to={`/configuracion/${id}`}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 rounded-full px-3.5 py-2 text-sm whitespace-nowrap transition-[background-color,color,box-shadow] duration-200 lg:rounded-xl lg:px-3',
                      foco,
                      isActive ? 'bg-card font-semibold text-foreground shadow-card ring-1 ring-border' : 'font-medium text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={cn('size-4 shrink-0 transition-colors', isActive && 'text-leaf')} aria-hidden="true" />
                      {label}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <section key={actual.id} className={cn('grid content-start gap-6', entrada)} aria-labelledby="seccion-titulo">
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
