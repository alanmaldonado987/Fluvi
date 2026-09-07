import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { describirCategoria, nombreBilletera } from '@/lib/calc'
import { fechaCorta, fechaHora } from '@/lib/format'
import { useFormatoMoneda } from '@/lib/privado'
import { historialDe } from '@/lib/repo'
import { cn } from '@/lib/utils'
import { useFinance } from '@/store/context'

const campos = { valor: 'Valor', fecha: 'Fecha', tipo: 'Tipo', categoria_id: 'Categoría', billetera_id: 'Billetera', billetera_destino_id: 'Destino', concepto: 'Concepto', observacion: 'Observación' }
const acciones = { creado: 'Creado', editado: 'Editado', eliminado: 'Eliminado' }

export function HistorialMovimiento({ movimientoId }) {
  const { state } = useFinance()
  const formatear = useFormatoMoneda()
  const [abierto, setAbierto] = useState(false)
  const [items, setItems] = useState(null)
  const mapa = new Map(state.categorias.map((c) => [c.id, c]))

  const alternar = () => {
    setAbierto((a) => !a)
    if (items === null) historialDe(movimientoId).then(setItems).catch(() => setItems([]))
  }
  const mostrar = (campo, valor) => {
    if (valor == null || valor === '') return 'vacío'
    if (campo === 'valor') return formatear(Number(valor))
    if (campo === 'categoria_id') return describirCategoria(mapa, valor).etiqueta
    if (campo === 'billetera_id' || campo === 'billetera_destino_id') return nombreBilletera(state.billeteras, valor)
    if (campo === 'fecha') return fechaCorta(valor)
    return String(valor)
  }
  const cambios = (h) => Object.keys(campos).filter((k) => JSON.stringify(h.antes?.[k]) !== JSON.stringify(h.despues?.[k]))

  return (
    <div>
      <button type="button" onClick={alternar} aria-expanded={abierto} className="inline-flex items-center gap-1 rounded-md text-xs font-semibold text-forest focus-visible:outline-2 focus-visible:outline-ring">
        <ChevronDown className={cn('size-4 transition-transform duration-200 ease-out', abierto && 'rotate-180')} aria-hidden="true" />
        Historial de cambios
      </button>
      {abierto ? (
        items === null ? (
          <p className="mt-2 text-xs text-muted-foreground">Cargando historial</p>
        ) : items.length ? (
          <ol className="mt-2 grid gap-2 border-l-2 border-mint pl-3 text-xs">
            {items.map((h) => (
              <li key={h.id}>
                <span className="font-semibold">{acciones[h.accion]}</span> <span className="text-muted-foreground">{fechaHora(h.creado_en)}</span>
                {h.accion === 'editado' ? (
                  <ul className="mt-0.5 grid gap-0.5 text-muted-foreground">
                    {cambios(h).map((k) => (
                      <li key={k}>
                        {campos[k]}: {mostrar(k, h.antes[k])} → {mostrar(k, h.despues[k])}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">Sin cambios registrados para este movimiento.</p>
        )
      ) : null}
    </div>
  )
}
