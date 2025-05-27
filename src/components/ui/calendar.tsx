import * as React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { DayPicker, useNavigation } from "react-day-picker";
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

// Componente de cabeçalho personalizado para adicionar navegação por ano
function CustomCaption(props: any) {
  const { displayMonth } = props;
  const { goToMonth, nextMonth, previousMonth } = useNavigation();

  // Navegação por ano
  const handlePreviousYear = () => {
    const prevYear = new Date(displayMonth.getFullYear() - 1, displayMonth.getMonth(), displayMonth.getDate());
    goToMonth(prevYear);
  };

  const handleNextYear = () => {
    const nextYear = new Date(displayMonth.getFullYear() + 1, displayMonth.getMonth(), displayMonth.getDate());
    goToMonth(nextYear);
  };

  return (
    <div className="flex justify-center pt-1 relative items-center">
      {/* Botão Ano Anterior */}
      <button
        onClick={handlePreviousYear}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute left-8"
        )}
      >
        <ChevronsLeft className="h-4 w-4" />
      </button>
      {/* Botão Mês Anterior */}
       <button
        onClick={() => previousMonth && goToMonth(previousMonth)}
        disabled={!previousMonth}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute left-1"
        )}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* Rótulo do Mês/Ano (clicável para seleção) */}
      <span
         className="text-sm font-medium cursor-pointer"
         onClick={() => { /* Implementar lógica para abrir seletor de mês/ano se DayPicker suportar */ }}
         // Talvez adicionar onFocus/onBlur se necessário
      >
        {format(displayMonth, "MMMM yyyy", { locale: enUS })} 
      </span>

      {/* Botão Mês Próximo */}
      <button
        onClick={() => nextMonth && goToMonth(nextMonth)}
        disabled={!nextMonth}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute right-1"
        )}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
       {/* Botão Ano Próximo */}
       <button
        onClick={handleNextYear}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute right-8"
        )}
      >
        <ChevronsRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        caption: "flex justify-between pt-1 relative items-center",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        month: "space-y-4 pb-[calc(theme(spacing.9)+theme(spacing.2))]",
        ...classNames,
      }}
      components={{
        Caption: CustomCaption,
      }}
      captionLayout="buttons"
      fromYear={1900}
      toYear={2050}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
