import * as React from "react"

import { cn } from "@/lib/utils"
import { useField } from "./field-context"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  const field = useField();
  return (
    (<input
      type={type}
      id={props.id || field?.id}
      className={cn(
        "flex h-10 min-w-0 w-full rounded-md border border-white/[0.12] bg-white/[0.035] px-3 py-2 text-sm text-white transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-white/50 hover:border-white/20 focus-visible:border-white/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props} />)
  );
})
Input.displayName = "Input"

export { Input }
