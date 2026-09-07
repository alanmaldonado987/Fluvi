import { cloneElement, useId } from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export function Campo({ label, className, children }) {
  const id = useId()
  return (
    <div className={cn('grid gap-1.5', className)}>
      <Label htmlFor={id}>{label}</Label>
      {cloneElement(children, { id })}
    </div>
  )
}
