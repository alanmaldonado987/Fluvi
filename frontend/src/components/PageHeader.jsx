import { BotonPrivado } from '@/components/BotonPrivado'
import { Campana } from '@/components/Campana'

export function PageHeader({ title, description, cifras = true, extra, children }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl md:text-3xl">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        {extra ? <div className="mt-2.5">{extra}</div> : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {/* En móvil la campana vive en la barra superior. */}
        <Campana variant="outline" className="hidden bg-card md:inline-flex" />
        {/* En escritorio el ojo de cifras vive junto a los filtros de cada página; en móvil está en la barra superior. */}
        {cifras ? <BotonPrivado variant="outline" className="hidden bg-card md:inline-flex" /> : null}
        {children}
      </div>
    </header>
  )
}
