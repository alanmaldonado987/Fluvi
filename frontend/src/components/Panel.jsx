import { cn } from '@/lib/utils'

export function Panel({ title, action, className, children }) {
  return (
    <section className={cn('superficie min-w-0 p-4 md:p-5', className)}>
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
