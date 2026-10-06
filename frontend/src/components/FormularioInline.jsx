import { LoaderCircle } from 'lucide-react'
import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

// Fila editable: etiqueta a la izquierda (arriba en móvil) y el botón Guardar se despliega solo cuando hay un cambio.
export function FormularioInline({ label, tipo = 'text', valorInicial = '', placeholder, minLength, maxLength = 120, autoComplete, onGuardar }) {
  const id = useId()
  const [valor, setValor] = useState(valorInicial)
  const [enviando, setEnviando] = useState(false)
  const limpio = valor.trim()
  const cambio = limpio && limpio !== valorInicial && (!minLength || limpio.length >= minLength)

  return (
    <form
      className="grid w-full gap-1.5 sm:grid-cols-[8rem_minmax(0,1fr)] sm:items-center sm:gap-4"
      onSubmit={async (e) => {
        e.preventDefault()
        setEnviando(true)
        try {
          await onGuardar(limpio)
          if (tipo === 'password') setValor('')
        } finally {
          setEnviando(false)
        }
      }}
    >
      <Label htmlFor={id} className="font-normal text-muted-foreground">
        {label}
      </Label>
      <div className="flex items-center">
        <Input
          id={id}
          type={tipo}
          placeholder={placeholder}
          minLength={minLength}
          maxLength={maxLength}
          autoComplete={autoComplete}
          className="border-transparent bg-muted/50 transition-colors hover:border-input focus-visible:bg-card dark:bg-input/30"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />
        <span className={cn('grid shrink-0 transition-[grid-template-columns,opacity] duration-300 ease-out', cambio || enviando ? 'grid-cols-[1fr] opacity-100' : 'grid-cols-[0fr] opacity-0')}>
          <span className="min-w-0 overflow-hidden">
            <span className="block pl-2">
              <Button type="submit" disabled={!cambio || enviando}>
                {enviando ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
                Guardar
              </Button>
            </span>
          </span>
        </span>
      </div>
    </form>
  )
}
