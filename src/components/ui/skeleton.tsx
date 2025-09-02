import { cn } from "@/lib/utils"
import { useRTLLayout } from "@/hooks/useRTLLayout"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { isRTL } = useRTLLayout()
  
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted rtl-skeleton", 
        isRTL && "animate-rtl-pulse",
        className
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
      {...props}
    />
  )
}

export { Skeleton }
