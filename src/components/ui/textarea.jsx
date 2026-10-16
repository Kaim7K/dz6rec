import * as React from "react"

import { cn } from "@/lib/utils"
import { useField } from "./field-context"

const Textarea = React.forwardRef(/** @param {React.ComponentPropsWithoutRef<'textarea'>} props @param {React.ForwardedRef<HTMLTextAreaElement>} ref */
({ className, ...props }, ref) => {
  const field = useField();
  return (
    (<textarea
      id={props.id || field?.id}
      className={cn(
        "flex min-h-[88px] min-w-0 w-full resize-y rounded-md border border-white/[0.12] bg-white/[0.035] px-3 py-2.5 text-sm leading-6 text-white placeholder:text-white/50 hover:border-white/20 focus-visible:border-white/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props} />)
  );
})
Textarea.displayName = "Textarea"

export { Textarea }
