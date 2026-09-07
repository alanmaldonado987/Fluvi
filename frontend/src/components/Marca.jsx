import { cn } from '@/lib/utils' // libs

export function Marca({ className }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('size-6 shrink-0', className)} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#2e7d55" />
      <path d="M7 22c3.5 0 4.5-7 8-7s4.5 5 7 5 3-6 4-9" fill="none" stroke="#eef6f0" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="26" cy="11" r="2.4" fill="#e9b949" />
    </svg>
  )
}
