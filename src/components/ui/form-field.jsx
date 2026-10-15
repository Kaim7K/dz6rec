import React, { useId } from "react";
import { Label } from "@/components/ui/label";
import { FieldContext } from "@/components/ui/field-context";
import { cn } from "@/lib/utils";

export default function FormField({ label, hint = undefined, error = undefined, children, className = undefined }) {
  const id = useId();
  const descriptionId = hint || error ? `${id}-description` : undefined;
  return (
    <FieldContext.Provider value={{ id, descriptionId, error }}>
      <div className={cn("dz-form-field", className)}>
        <Label htmlFor={id}>{label}</Label>
        {children}
        {(hint || error) && <p id={descriptionId} role={error ? "alert" : undefined} className={cn("text-xs leading-5", error ? "text-red-300" : "text-muted-foreground")}>{error || hint}</p>}
      </div>
    </FieldContext.Provider>
  );
}
