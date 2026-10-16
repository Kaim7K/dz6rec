"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef(/** @param {React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>} props @param {React.ForwardedRef<React.ElementRef<typeof DialogPrimitive.Overlay>>} ref */
({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/75 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props} />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef(/** @param {React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>} props @param {React.ForwardedRef<React.ElementRef<typeof DialogPrimitive.Content>>} ref */
({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "dz-dialog fixed left-1/2 top-1/2 z-50 flex min-w-0 max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border border-white/[0.12] bg-[var(--surface-3)] shadow-elev outline-none duration-150 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        className
      )}
      {...props}>
      <div className="dz-dialog-scroll grid min-h-0 min-w-0 grid-cols-[minmax(0,1fr)] gap-5 overflow-y-auto overscroll-contain p-5 sm:p-6">{children}</div>
      <DialogPrimitive.Close
        className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-md text-white/50 transition-colors hover:bg-white/[0.055] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none">
        <X className="h-4 w-4" />
        <span className="sr-only">Fechar</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

/** @param {React.HTMLAttributes<HTMLDivElement>} props */
const DialogHeader = ({
  className,
  ...props
}) => (
  <div
    className={cn("dz-dialog-header flex min-w-0 flex-col gap-1.5 pb-1 text-left", className)}
    {...props} />
)
DialogHeader.displayName = "DialogHeader"

/** @param {React.HTMLAttributes<HTMLDivElement>} props */
const DialogFooter = ({
  className,
  ...props
}) => (
  <div
    className={cn("dz-dialog-footer flex flex-wrap items-center justify-end gap-2 border-t border-white/[0.08] pt-5", className)}
    {...props} />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef(/** @param {React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>} props @param {React.ForwardedRef<React.ElementRef<typeof DialogPrimitive.Title>>} ref */
({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("break-words pr-8 font-display text-base font-semibold leading-6 tracking-tight text-white", className)}
    {...props} />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef(/** @param {React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>} props @param {React.ForwardedRef<React.ElementRef<typeof DialogPrimitive.Description>>} ref */
({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("max-w-prose pr-3 text-xs leading-5 text-white/55", className)}
    {...props} />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
