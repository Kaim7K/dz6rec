import React, { useId } from "react";
import { Label } from "./label";
import { FieldContext } from "./field-context";
import { cn } from "@/lib/utils";

export default function FormField({ label, children, className = "" }) {
  const id = useId();
  const field = { id: `field-${id}`, labelId: `label-${id}`, label };
  return (
    <FieldContext.Provider value={field}>
      <div className={cn("min-w-0 space-y-2", className)}>
        <Label id={field.labelId} htmlFor={field.id}>{label}</Label>
        {children}
      </div>
    </FieldContext.Provider>
  );
}
