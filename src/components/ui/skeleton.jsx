import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}) {
  return (
    (<div
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-white/[0.06]", className)}
      {...props} />)
  );
}

export { Skeleton }
