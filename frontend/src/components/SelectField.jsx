import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

export function SelectField({ value, onChange, items, placeholder, className, ...props }) {
  return (
    <Select value={value} onValueChange={onChange} items={items}>
      <SelectTrigger className={cn('w-full bg-card', className)} {...props}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
