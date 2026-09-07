import { useState } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useAuth } from '@/store/auth'

export function CerrarSesionDialog({ open, onOpenChange, todos = false }) {
  const { salir } = useAuth()
  const [saliendo, setSaliendo] = useState(false)

  const confirmar = async () => {
    setSaliendo(true)
    try {
      const resultado = await salir(todos)
      if (resultado?.error) throw resultado.error
    } catch {
      toast.error('No se pudo cerrar la sesión. Inténtalo de nuevo.')
      setSaliendo(false)
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={todos ? '¿Cerrar sesión en todos los dispositivos?' : '¿Cerrar sesión?'}
      description={todos ? 'Se cierran todas las sesiones abiertas, incluida esta. Tendrás que volver a entrar en cada dispositivo.' : 'Tendrás que volver a entrar con tu correo y contraseña.'}
      confirmLabel="Cerrar sesión"
      disabled={saliendo}
      onConfirm={confirmar}
    />
  )
}
