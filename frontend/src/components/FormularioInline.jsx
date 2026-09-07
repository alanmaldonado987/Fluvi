import { LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { Campo } from '@/components/Campo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function FormularioInline({ label, tipo = 'text', valorInicial = '', placeholder, minLength, autoComplete, onGuardar }) {
  const [valor, setValor] = useState(valorInicial)
  const [enviando, setEnviando] = useState(false)
  const limpio = valor.trim()
  const cambio = limpio && limpio !== valorInicial && (!minLength || limpio.length >= minLength)

  return (
    <form
      className="flex items-end gap-2"
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
      <Campo label={label} className="flex-1">
        <Input type={tipo} placeholder={placeholder} minLength={minLength} autoComplete={autoComplete} className="bg-card" value={valor} onChange={(e) => setValor(e.target.value)} />
      </Campo>
      <Button type="submit" variant="secondary" disabled={!cambio || enviando}>
        {enviando ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
        Guardar
      </Button>
    </form>
  )
}
