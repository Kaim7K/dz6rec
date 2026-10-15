import * as React from "react"

import { useField } from "@/components/ui/field-context"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef(
/**
 * @param {React.ComponentPropsWithoutRef<"textarea">} props
 * @param {React.ForwardedRef<HTMLTextAreaElement>} ref
 */
({ className, ...props }, ref) => {
  const field = useField();
  return (
    (<textarea
      id={props.id || field.id}
      aria-describedby={props["aria-describedby"] || field.descriptionId}
      aria-invalid={props["aria-invalid"] || !!field.error}
      className={cn(
        "flex min-h-[96px] resize-y min-w-0 w-full rounded-md border border-white/[0.12] bg-white/[0.03] px-3 py-2 text-sm leading-5 text-white  placeholder:text-white/50 focus-visible:border-white/35 focus-visible:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 aria-[invalid=true]:border-red-400/60 aria-[invalid=true]:ring-red-400/20 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props} />)
  );
})
Textarea.displayName = "Textarea"

export { Textarea }
