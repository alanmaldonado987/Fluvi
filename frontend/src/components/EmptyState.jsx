export function EmptyState({ icon: Icon, title, description, children }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed px-6 py-10 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-mint text-forest">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <h2 className="text-lg">{title}</h2>
      {description ? <p className="max-w-sm text-sm text-muted-foreground">{description}</p> : null}
      {children}
    </div>
  )
}
