import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number
  className?: string
}

export function Loader({ size = 24, className, ...props }: LoaderProps) {
  return (
    <div 
      className={cn("flex items-center justify-center", className)}
      {...props}
    >
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  )
}
