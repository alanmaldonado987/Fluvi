import { LoaderCircle, ShieldAlert } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Campo } from '@/components/Campo'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useFinance } from '@/store/context'

const PALABRA = 'BORRAR'

export function BorrarDatosDialog({ open, onOpenChange }) {
  const { actions } = useFinance()
  const navigate = useNavigate()
  const [texto, setTexto] = useState('')
  const [borrando, setBorrando] = useState(false)

  const cerrar = (abierto) => {
    if (borrando) return
    setTexto('')
    onOpenChange(abierto)
  }
  const confirmar = async () => {
    setBorrando(true)
    try {
      await actions.borrarTodo()
      toast.success('Tus datos se borraron. Empiezas de cero.')
      setTexto('')
      onOpenChange(false)
      navigate('/')
    } catch {
      toast.error('No se pudieron borrar los datos. Inténtalo de nuevo.')
    } finally {
      setBorrando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={cerrar}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <span className="mb-1 grid size-11 place-items-center rounded-full bg-negative-soft text-negative" aria-hidden="true">
            <ShieldAlert className="size-5" />
          </span>
          <DialogTitle>¿Borrar todos tus datos?</DialogTitle>
          <DialogDescription>Se eliminan categorías, billeteras, movimientos, presupuestos, metas, recurrentes y notas. Tu cuenta sigue activa. Esta acción no se puede deshacer.</DialogDescription>
        </DialogHeader>
        <Campo label={`Escribe ${PALABRA} para confirmar`}>
          <Input autoComplete="off" autoFocus className={cn('text-center font-semibold tracking-[0.3em] uppercase transition-colors', texto === PALABRA && 'border-destructive text-destructive focus-visible:border-destructive focus-visible:ring-destructive/20')} value={texto} onChange={(e) => setTexto(e.target.value.toUpperCase())} />
        </Campo>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
          <Button className="bg-destructive text-on-forest hover:bg-destructive/90" disabled={texto !== PALABRA || borrando} onClick={confirmar}>
            {borrando ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
            Borrar todo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
