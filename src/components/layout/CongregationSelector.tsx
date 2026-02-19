import { Check, Building2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Congregation {
  id: string;
  name: string;
  is_main: boolean;
}

interface CongregationSelectorProps {
  congregations: Congregation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  className?: string;
}

export function CongregationSelector({
  congregations,
  selectedId,
  onSelect,
  className,
}: CongregationSelectorProps) {
  const selected = congregations.find((c) => c.id === selectedId);

  if (congregations.length <= 1) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("gap-2 min-w-[160px] justify-between", className)}
        >
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <span className="truncate">{selected?.name || "Selecionar"}</span>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        {congregations.map((congregation) => (
          <DropdownMenuItem
            key={congregation.id}
            onClick={() => onSelect(congregation.id)}
            className="flex items-center justify-between"
          >
            <span className="truncate">
              {congregation.name}
              {congregation.is_main && (
                <span className="text-xs text-muted-foreground ml-1">(Sede)</span>
              )}
            </span>
            {congregation.id === selectedId && (
              <Check className="w-4 h-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
