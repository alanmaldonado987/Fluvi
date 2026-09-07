import { LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Logo } from '@/components/Logo'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { entrada } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { useAuth } from '@/store/auth'

export default function Restablecer() {
  const { usuario, actualizar } = useAuth()
  const navigate = useNavigate()
  const [clave, setClave] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)
  const coincide = clave.length >= 6 && clave === confirmacion

  const enviar = async (e) => {
    e.preventDefault()
    setEnviando(true)
    setError(null)
    try {
      await actualizar({ password: clave })
      toast.success('Contraseña actualizada.')
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.code === 'same_password' ? 'La contraseña nueva debe ser distinta a la anterior.' : 'No se pudo cambiar la contraseña. Pide un enlace nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="grid min-h-svh place-items-center p-6">
      <div className={cn('w-full max-w-sm', entrada)}>
        <Logo className="mb-8" />
        {usuario ? (
          <form onSubmit={enviar}>
            <h1 className="text-2xl">Crea una contraseña nueva</h1>
            <p className="mt-1 text-sm text-muted-foreground">Para {usuario.email}.</p>
            <div className="mt-8 grid gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="clave">Contraseña nueva</Label>
                <Input id="clave" type="password" autoComplete="new-password" required minLength={6} autoFocus value={clave} onChange={(e) => setClave(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="confirmacion">Repite la contraseña</Label>
                <Input id="confirmacion" type="password" autoComplete="new-password" required minLength={6} value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} />
              </div>
              {confirmacion && !coincide ? <p className="text-xs text-negative">Las contraseñas no coinciden o tienen menos de 6 caracteres.</p> : null}
              {error ? (
                <p role="alert" className="rounded-xl bg-negative-soft px-3 py-2 text-sm text-negative">
                  {error}
                </p>
              ) : null}
              <Button type="submit" size="lg" className="mt-2" disabled={enviando || !coincide}>
                {enviando ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
                {enviando ? 'Guardando' : 'Guardar contraseña'}
              </Button>
            </div>
          </form>
        ) : (
          <div>
            <h1 className="text-2xl">El enlace no es válido</h1>
            <p className="mt-2 text-sm text-muted-foreground">Puede haber vencido o ya se usó. Pide uno nuevo desde la pantalla de entrada.</p>
            <Link to="/login" className={cn(buttonVariants({ size: 'lg' }), 'mt-6')}>
              Ir a entrar
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
