import { Link } from 'react-router-dom'
import { Campo } from '@/components/Campo'
import { SelectField } from '@/components/SelectField'
import { principales } from '@/lib/calc'
import { useFinance } from '@/store/context'

const SIN_SUB = 'ninguna'

export function SelectorCategoria({ tipo, categoriaId, subcategoriaId, onChange, claseSub }) {
  const { state } = useFinance()
  const categorias = principales(state.categorias)
    .filter((c) => c.tipo === tipo)
    .map((c) => ({ value: c.id, label: c.nombre }))
  const subcategorias = state.categorias.filter((c) => c.padreId === categoriaId).map((c) => ({ value: c.id, label: c.nombre }))
  return (
    <>
      <Campo label="Categoría">
        <SelectField placeholder="Elige una" value={categoriaId} onChange={(id) => onChange({ categoriaId: id, subcategoriaId: null })} items={categorias} />
      </Campo>
      {subcategorias.length ? (
        <Campo label="Subcategoría" className={claseSub}>
          <SelectField
            value={subcategoriaId ?? SIN_SUB}
            onChange={(id) => onChange({ categoriaId, subcategoriaId: id === SIN_SUB ? null : id })}
            items={[{ value: SIN_SUB, label: 'Sin subcategoría' }, ...subcategorias]}
          />
        </Campo>
      ) : null}
      {categorias.length === 0 ? (
        <p className={claseSub ? `${claseSub} text-sm text-muted-foreground` : 'text-sm text-muted-foreground'}>
          No hay categorías de {tipo.toLowerCase()}.{' '}
          <Link to="/presupuesto" className="font-semibold text-forest underline underline-offset-4">
            Créalas en Presupuesto
          </Link>
          .
        </p>
      ) : null}
    </>
  )
}
