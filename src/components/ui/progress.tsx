import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "@/lib/utils"
import { useRTLLayout } from "@/hooks/useRTLLayout"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => {
  const { isRTL } = useRTLLayout()
  
  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          "h-full w-full flex-1 bg-primary transition-all",
          isRTL ? "rtl-progress" : ""
        )}
        style={{ 
          transform: isRTL 
            ? `translateX(${100 - (value || 0)}%)` 
            : `translateX(-${100 - (value || 0)}%)`
        }}
      />
    </ProgressPrimitive.Root>
  )
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
