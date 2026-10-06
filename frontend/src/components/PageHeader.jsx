import { BotonPrivado } from '@/components/BotonPrivado'

export function PageHeader({ title, description, cifras = true, children }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl md:text-3xl">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {/* En escritorio el ojo de cifras vive junto a los filtros de cada página; en móvil está en la barra superior. */}
        {cifras ? <BotonPrivado variant="outline" className="hidden bg-card md:inline-flex" /> : null}
        {children}
      </div>
    </header>
  )
}
