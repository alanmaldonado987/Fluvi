import { BellRing, ChartPie, Eye, EyeOff, LoaderCircle, Wallet } from 'lucide-react'
import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { entrada, escalonado } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { useAuth } from '@/store/auth'

const ventajas = [
  { icon: ChartPie, texto: 'Presupuesto por categoría, mes a mes' },
  { icon: BellRing, texto: 'Alertas cuando un gasto se pasa' },
  { icon: Wallet, texto: 'Saldo real de cada billetera' },
]

const mensajes = {
  invalid_credentials: 'Correo o contraseña incorrectos.',
  email_not_confirmed: 'Confirma tu correo antes de entrar. Revisa tu bandeja de entrada.',
  user_already_exists: 'Ya existe una cuenta con ese correo. Entra con tu contraseña.',
  weak_password: 'La contraseña debe tener al menos 6 caracteres.',
  over_email_send_rate_limit: 'Demasiados intentos. Espera un minuto y vuelve a probar.',
}

const textos = {
  entrar: { titulo: 'Bienvenida de vuelta', detalle: 'Entra con tu correo para ver tu mes.', boton: 'Entrar', enviando: 'Entrando' },
  registrar: { titulo: 'Crea tu cuenta', detalle: 'Solo necesitas un correo y una contraseña.', boton: 'Crear cuenta', enviando: 'Creando cuenta' },
  recuperar: { titulo: 'Recupera tu contraseña', detalle: 'Te enviamos un enlace para crear una nueva.', boton: 'Enviar enlace', enviando: 'Enviando' },
}

const enlace = 'font-semibold text-forest underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring'

export default function Login() {
  const { usuario, entrar, registrar, recuperar } = useAuth()
  const [modo, setModo] = useState('entrar')
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [clave, setClave] = useState('')
  const [verClave, setVerClave] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [aviso, setAviso] = useState(null)

  if (usuario) return <Navigate to="/" replace />
  const t = textos[modo]

  const cambiarModo = (nuevo) => {
    setModo(nuevo)
    setAviso(null)
  }

  const enviar = async (e) => {
    e.preventDefault()
    setEnviando(true)
    setAviso(null)
    try {
      if (modo === 'registrar') {
        const { session } = await registrar(nombre.trim(), email.trim(), clave)
        if (!session) setAviso({ tipo: 'ok', texto: 'Cuenta creada. Te enviamos un correo para confirmarla; después podrás entrar.' })
      } else if (modo === 'recuperar') {
        await recuperar(email.trim())
        setAviso({ tipo: 'ok', texto: 'Si el correo existe, recibirás un enlace para crear una contraseña nueva.' })
      } else {
        await entrar(email.trim(), clave)
      }
    } catch (error) {
      setAviso({ tipo: 'error', texto: mensajes[error.code] ?? 'No se pudo completar. Inténtalo de nuevo.' })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="grid min-h-svh lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden bg-mint p-12 lg:flex lg:flex-col lg:justify-between">
        <span aria-hidden="true" className="absolute -top-24 -right-24 size-80 rounded-full bg-gold/40" />
        <span aria-hidden="true" className="absolute -bottom-40 -left-24 size-96 rounded-full bg-leaf/15" />
        <Logo className="relative" />
        <div className="relative max-w-md">
          <p className="font-heading text-5xl leading-[1.05] font-bold tracking-tight text-forest">Tus finanzas, en flujo.</p>
          <p className="mt-4 text-lg text-forest/80">Registra lo que entra y lo que sale, compáralo con tu presupuesto y mira tu saldo real cada mes. Sin fórmulas que se rompan.</p>
          <ul className="mt-8 grid gap-3">
            {ventajas.map(({ icon: Icon, texto }, i) => (
              <li key={texto} className={cn('flex items-center gap-3 rounded-2xl bg-card px-4 py-3 font-semibold text-forest shadow-[0_8px_24px_-12px_rgba(36,77,53,0.35)]', entrada)} style={escalonado(i + 1)}>
                <Icon className="size-5 text-leaf" aria-hidden="true" />
                {texto}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-forest/70">Reemplaza tu Excel, no tu forma de pensar.</p>
      </section>

      <section className="flex items-center justify-center p-6">
        <form onSubmit={enviar} className={cn('w-full max-w-sm', entrada)}>
          <Logo className="mb-8 lg:hidden" />
          <h1 className="text-2xl">{t.titulo}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t.detalle}</p>
          <div className="mt-8 grid gap-4">
            {modo === 'registrar' ? (
              <div className="grid gap-1.5">
                <Label htmlFor="nombre">Nombre</Label>
                <Input id="nombre" autoComplete="name" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
              </div>
            ) : null}
            <div className="grid gap-1.5">
              <Label htmlFor="email">Correo</Label>
              <Input id="email" type="email" autoComplete="email" required placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            {modo === 'recuperar' ? null : (
              <div className="grid gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="clave">Contraseña</Label>
                  {modo === 'entrar' ? (
                    <button type="button" onClick={() => cambiarModo('recuperar')} className="text-xs font-semibold text-forest underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring">
                      ¿La olvidaste?
                    </button>
                  ) : null}
                </div>
                <div className="relative">
                  <Input id="clave" type={verClave ? 'text' : 'password'} autoComplete={modo === 'registrar' ? 'new-password' : 'current-password'} required minLength={6} className="pr-11" value={clave} onChange={(e) => setClave(e.target.value)} />
                  <button
                    type="button"
                    aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    aria-pressed={verClave}
                    onClick={() => setVerClave((v) => !v)}
                    className="absolute top-1/2 right-1 grid size-8 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    {verClave ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
            )}
            {aviso ? (
              <p role="alert" className={cn('rounded-xl px-3 py-2 text-sm', aviso.tipo === 'error' ? 'bg-negative-soft text-negative' : 'bg-positive-soft text-positive')}>
                {aviso.texto}
              </p>
            ) : null}
            <Button type="submit" size="lg" className="mt-2" disabled={enviando}>
              {enviando ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
              {enviando ? t.enviando : t.boton}
            </Button>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            {modo === 'entrar' ? (
              <>
                ¿Primera vez aquí?{' '}
                <button type="button" onClick={() => cambiarModo('registrar')} className={enlace}>
                  Crear cuenta
                </button>
              </>
            ) : (
              <>
                ¿Ya tienes cuenta?{' '}
                <button type="button" onClick={() => cambiarModo('entrar')} className={enlace}>
                  Entrar
                </button>
              </>
            )}
          </p>
        </form>
      </section>
    </main>
  )
}
