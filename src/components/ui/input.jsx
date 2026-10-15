import * as React from "react"

import { useField } from "@/components/ui/field-context"

import { cn } from "@/lib/utils"

const Input = React.forwardRef(
/**
 * @param {React.ComponentPropsWithoutRef<"input">} props
 * @param {React.ForwardedRef<HTMLInputElement>} ref
 */
({ className, type, ...props }, ref) => {
  const field = useField();
  return (
    (<input
      id={props.id || field.id}
      aria-describedby={props["aria-describedby"] || field.descriptionId}
      aria-invalid={props["aria-invalid"] || !!field.error}
      type={type}
      className={cn(
        "flex h-11 sm:h-10 min-w-0 w-full rounded-md border border-white/[0.12] bg-white/[0.03] px-3 py-1 text-sm text-white  transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-white/50 focus-visible:border-white/35 focus-visible:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 aria-[invalid=true]:border-red-400/60 aria-[invalid=true]:ring-red-400/20 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props} />)
  );
})
Input.displayName = "Input"

export { Input }
