import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

const AlertDialog = AlertDialogPrimitive.Root

const AlertDialogTrigger = AlertDialogPrimitive.Trigger

const AlertDialogPortal = AlertDialogPrimitive.Portal

const AlertDialogOverlay = React.forwardRef(/** @param {React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>} props @param {React.ForwardedRef<React.ElementRef<typeof AlertDialogPrimitive.Overlay>>} ref */
({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref} />
))
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName

const AlertDialogContent = React.forwardRef(/** @param {React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>} props @param {React.ForwardedRef<React.ElementRef<typeof AlertDialogPrimitive.Content>>} ref */
({ className, ...props }, ref) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(
        "dz-dialog fixed left-1/2 top-1/2 z-50 grid min-w-0 max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 gap-5 overflow-y-auto rounded-lg border border-white/[0.12] bg-[var(--surface-3)] p-5 shadow-elev duration-150 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:p-6",
        className
      )}
      {...props} />
  </AlertDialogPortal>
))
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName

/** @param {React.HTMLAttributes<HTMLDivElement>} props */
const AlertDialogHeader = ({
  className,
  ...props
}) => (
  <div
    className={cn("flex min-w-0 flex-col space-y-2 text-left", className)}
    {...props} />
)
AlertDialogHeader.displayName = "AlertDialogHeader"

/** @param {React.HTMLAttributes<HTMLDivElement>} props */
const AlertDialogFooter = ({
  className,
  ...props
}) => (
  <div
    className={cn("flex flex-wrap justify-end gap-2 border-t border-white/[0.08] pt-5", className)}
    {...props} />
)
AlertDialogFooter.displayName = "AlertDialogFooter"

const AlertDialogTitle = React.forwardRef(/** @param {React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>} props @param {React.ForwardedRef<React.ElementRef<typeof AlertDialogPrimitive.Title>>} ref */
({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title ref={ref} className={cn("text-base font-semibold", className)} {...props} />
))
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName

const AlertDialogDescription = React.forwardRef(/** @param {React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>} props @param {React.ForwardedRef<React.ElementRef<typeof AlertDialogPrimitive.Description>>} ref */
({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn("text-sm leading-6 text-white/60", className)}
    {...props} />
))
AlertDialogDescription.displayName =
  AlertDialogPrimitive.Description.displayName

const AlertDialogAction = React.forwardRef(/** @param {React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>} props @param {React.ForwardedRef<React.ElementRef<typeof AlertDialogPrimitive.Action>>} ref */
({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Action ref={ref} className={cn(buttonVariants(), className)} {...props} />
))
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName

const AlertDialogCancel = React.forwardRef(/** @param {React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>} props @param {React.ForwardedRef<React.ElementRef<typeof AlertDialogPrimitive.Cancel>>} ref */
({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={cn(buttonVariants({ variant: "outline" }), className)}
    {...props} />
))
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
