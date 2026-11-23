import React from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UploadError({ message, disabled = false }) {
  if (!message) return null;
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/[0.07] p-3">
      <p role="alert" className="min-w-0 flex-1 basis-40 break-words text-xs leading-5 text-red-200">{message}</p>
      <Button type="submit" variant="outline" size="sm" disabled={disabled}><RotateCcw size={14} />Tentar novamente</Button>
    </div>
  );
}
