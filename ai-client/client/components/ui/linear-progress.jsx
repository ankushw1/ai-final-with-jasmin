"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const LinearProgress = React.forwardRef(({ className, value, indeterminate = false, ...props }, ref) => {
  return (
    <div
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-primary/20", className)}
      ref={ref}
      {...props}
    >
      <div
        className={cn(
          "h-full bg-primary transition-all",
          indeterminate ? "animate-indeterminate-progress w-[50%]" : "transition-[width]",
        )}
        style={
          !indeterminate && typeof value === "number" ? { width: `${Math.max(0, Math.min(100, value))}%` } : undefined
        }
      />
    </div>
  )
})
LinearProgress.displayName = "LinearProgress"

export { LinearProgress }
