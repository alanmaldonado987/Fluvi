import { Switch as SwitchPrimitive } from "@base-ui/react/switch"
import { cn } from "cn"

function Switch({ className, ...props }) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "inline-flex h-6 w-10 shrink-0 items-center rounded-full bg-input p-0.5 transition-colors duration-200 ease-out outline-none focus-visible:ring-3 focus-visible:ring-ring/50 data-checked:bg-leaf data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="block size-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out data-checked:translate-x-4"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
