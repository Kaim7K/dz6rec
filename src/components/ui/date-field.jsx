import React, { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useField } from "./field-context";

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export default function DateField({ value, onChange, placeholder = "Selecionar data", disabled }) {
  const field = useField();
  const [open, setOpen] = useState(false);
  const date = value ? new Date(`${value}T00:00:00`) : undefined;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button id={field?.id} aria-labelledby={field?.labelId} type="button" variant="outline" disabled={disabled} className={cn("h-10 w-full justify-start px-3 font-normal", !value && "text-muted-foreground")}>
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          {value ? cap(format(date, "dd 'de' MMM 'de' yyyy", { locale: ptBR })) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => { onChange(d ? format(d, "yyyy-MM-dd") : ""); setOpen(false); }}
          formatters={{
            formatCaption: (m) => cap(format(m, "MMMM 'de' yyyy", { locale: ptBR })),
            formatWeekdayName: (d) => format(d, "EEEEE", { locale: ptBR }),
          }}
        />
        {value && (
          <div className="flex justify-center border-t border-white/[0.07] p-2">
            <button type="button" onClick={() => { onChange(""); setOpen(false); }} className="text-xs font-medium text-muted-foreground transition-colors hover:text-white">Limpar data</button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
