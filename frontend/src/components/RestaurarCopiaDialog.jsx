import { ArchiveRestore, LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Progreso } from '@/components/Progreso'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { restaurarCopia, totalRestaurable } from '@/lib/copia'
import { fechaHora } from '@/lib/format'
import { useAuth } from '@/store/auth'
import { useFinance } from '@/store/context'

export function RestaurarCopiaDialog({ copia, resumen, onClose }) {
  const { actions } = useFinance()
  const { actualizar } = useAuth()
  const [avance, setAvance] = useState(0)
  const [restaurando, setRestaurando] = useState(false)
  const [error, setError] = useState('')
  const total = copia ? totalRestaurable(copia) : 0

  const cerrar = () => {
    if (restaurando) return
    setError('')
    setAvance(0)
    onClose()
  }

  const confirmar = async () => {
    setRestaurando(true)
    setError('')
    try {
      await restaurarCopia(copia, (hechas) => setAvance(hechas))
      if (copia.preferencias && typeof copia.preferencias === 'object') await actualizar({ data: { preferencias: copia.preferencias } }).catch(() => {})
      await actions.recargar()
      toast.success('Copia restaurada. Tus datos ya están de vuelta.')
      setRestaurando(false)
      cerrar()
    } catch (err) {
      setRestaurando(false)
      setError(err.message ?? 'No se pudo restaurar la copia.')
      actions.recargar().catch(() => {})
    }
  }

  return (
    <Dialog open={Boolean(copia)} onOpenChange={(abierto) => !abierto && cerrar()}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <span className="mb-1 grid size-11 place-items-center rounded-full bg-mint text-forest" aria-hidden="true">
            <ArchiveRestore className="size-5" />
          </span>
          <DialogTitle>¿Restaurar esta copia?</DialogTitle>
          <DialogDescription>
            {copia?.exportadoEn ? `Copia del ${fechaHora(copia.exportadoEn).replace(/\.?$/, '.')} ` : ''}
            Se agregan los datos que falten y se actualizan los que ya existan. No se borra nada de lo que tienes ahora.
          </DialogDescription>
        </DialogHeader>
        <ul className="grid gap-1.5 rounded-xl bg-muted/50 p-3 text-sm">
          {resumen.map((r) => (
            <li key={r.tabla} className="flex justify-between gap-3">
              <span className="text-muted-foreground">{r.etiqueta}</span>
              <span className="font-semibold tabular-nums">{r.cantidad}</span>
            </li>
          ))}
        </ul>
        {restaurando ? (
          <div className="grid gap-1.5" role="status" aria-live="polite">
            <Progreso valor={total ? avance / total : 0} />
            <p className="text-xs text-muted-foreground">
              Restaurando… {avance} de {total}
            </p>
          </div>
        ) : null}
        {error ? (
          <p role="alert" className="rounded-xl bg-negative-soft px-3 py-2 text-sm text-negative">
            {error}
          </p>
        ) : null}
        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={restaurando} />}>Cancelar</DialogClose>
          <Button disabled={restaurando} onClick={confirmar}>
            {restaurando ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
            {error ? 'Reintentar' : 'Restaurar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
