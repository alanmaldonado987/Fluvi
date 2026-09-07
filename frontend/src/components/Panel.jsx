import { cn } from '@/lib/utils'

export function Panel({ title, action, className, children }) {
  return (
    <section className={cn('min-w-0 rounded-2xl bg-card p-4 ring-1 ring-border md:p-5', className)}>
      {title ? (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base">{title}</h2>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  )
}
