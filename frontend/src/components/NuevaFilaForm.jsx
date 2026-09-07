import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function NuevaFilaForm({ placeholder, onAgregar, className }) {
  const [nombre, setNombre] = useState('')
  const limpio = nombre.trim()
  return (
    <form
      className={cn('flex gap-2', className)}
      onSubmit={(e) => {
        e.preventDefault()
        onAgregar(limpio)
        setNombre('')
      }}
    >
      <Input aria-label={placeholder} placeholder={placeholder} className="max-w-xs bg-card" value={nombre} onChange={(e) => setNombre(e.target.value)} />
      <Button type="submit" variant="secondary" disabled={!limpio}>
        <Plus /> Agregar
      </Button>
    </form>
  )
}
