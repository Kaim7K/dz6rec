import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    (<textarea
      className={cn(
        "flex min-h-[68px] min-w-0 w-full rounded-md border border-white/[0.08] bg-white/[0.026] px-3 py-2 text-sm leading-5 text-white shadow-sm placeholder:text-white/34 focus-visible:border-primary/45 focus-visible:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props} />)
  );
})
Textarea.displayName = "Textarea"

export { Textarea }
