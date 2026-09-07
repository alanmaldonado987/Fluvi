import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function BotonFlotante({ label, onClick }) {
  return (
    <Button aria-label={label} onClick={onClick} className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] z-30 size-14 rounded-full shadow-lg shadow-forest/25 md:hidden">
      <Plus className="size-6" />
    </Button>
  )
}
