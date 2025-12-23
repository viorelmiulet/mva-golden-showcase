import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Filter, ArrowUpDown, X, Check } from "lucide-react";

export interface FilterOption {
  key: string;
  label: string;
  type: "select" | "number" | "text";
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface SortOption {
  key: string;
  label: string;
  direction?: "asc" | "desc";
}

interface MobileFilterSortProps {
  filters: FilterOption[];
  filterValues: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  sortOptions?: SortOption[];
  currentSort?: { key: string; direction: "asc" | "desc" };
  onSortChange?: (key: string, direction: "asc" | "desc") => void;
  onReset?: () => void;
  activeFiltersCount?: number;
}

export function MobileFilterSort({
  filters,
  filterValues,
  onFilterChange,
  sortOptions,
  currentSort,
  onSortChange,
  onReset,
  activeFiltersCount = 0,
}: MobileFilterSortProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempValues, setTempValues] = useState<Record<string, string>>(filterValues);
  const [tempSort, setTempSort] = useState(currentSort);

  const handleOpen = (open: boolean) => {
    if (open) {
      setTempValues(filterValues);
      setTempSort(currentSort);
    }
    setIsOpen(open);
  };

  const handleApply = () => {
    Object.entries(tempValues).forEach(([key, value]) => {
      if (value !== filterValues[key]) {
        onFilterChange(key, value);
      }
    });
    if (tempSort && onSortChange && tempSort !== currentSort) {
      onSortChange(tempSort.key, tempSort.direction);
    }
    setIsOpen(false);
  };

  const handleReset = () => {
    const resetValues: Record<string, string> = {};
    filters.forEach((f) => {
      resetValues[f.key] = f.type === "select" ? "all" : "";
    });
    setTempValues(resetValues);
    setTempSort(undefined);
    onReset?.();
    setIsOpen(false);
  };

  const handleTempChange = (key: string, value: string) => {
    setTempValues((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          Filtre
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtrare & Sortare
            </SheetTitle>
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleReset} className="text-destructive">
                <X className="h-4 w-4 mr-1" />
                Resetează
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {/* Sort Options */}
          {sortOptions && sortOptions.length > 0 && (
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-base font-semibold">
                <ArrowUpDown className="h-4 w-4" />
                Sortare
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {sortOptions.map((option) => (
                  <div key={option.key} className="space-y-1">
                    <Button
                      variant={tempSort?.key === option.key && tempSort?.direction === "asc" ? "default" : "outline"}
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={() => setTempSort({ key: option.key, direction: "asc" })}
                    >
                      {option.label} ↑
                    </Button>
                    <Button
                      variant={tempSort?.key === option.key && tempSort?.direction === "desc" ? "default" : "outline"}
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={() => setTempSort({ key: option.key, direction: "desc" })}
                    >
                      {option.label} ↓
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filter Options */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2 text-base font-semibold">
              <Filter className="h-4 w-4" />
              Filtre
            </Label>
            {filters.map((filter) => (
              <div key={filter.key} className="space-y-2">
                <Label htmlFor={filter.key} className="text-sm text-muted-foreground">
                  {filter.label}
                </Label>
                {filter.type === "select" && filter.options ? (
                  <Select
                    value={tempValues[filter.key] || "all"}
                    onValueChange={(value) => handleTempChange(filter.key, value)}
                  >
                    <SelectTrigger id={filter.key}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {filter.options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : filter.type === "number" ? (
                  <Input
                    id={filter.key}
                    type="number"
                    value={tempValues[filter.key] || ""}
                    onChange={(e) => handleTempChange(filter.key, e.target.value)}
                    placeholder={filter.placeholder}
                  />
                ) : (
                  <Input
                    id={filter.key}
                    type="text"
                    value={tempValues[filter.key] || ""}
                    onChange={(e) => handleTempChange(filter.key, e.target.value)}
                    placeholder={filter.placeholder}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <SheetFooter className="pt-4 border-t gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
            Anulează
          </Button>
          <Button onClick={handleApply} className="flex-1 gap-2">
            <Check className="h-4 w-4" />
            Aplică
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// Simple inline sort toggle for desktop/tablet
interface SortButtonProps {
  label: string;
  isActive: boolean;
  direction?: "asc" | "desc";
  onClick: () => void;
}

export function SortButton({ label, isActive, direction, onClick }: SortButtonProps) {
  return (
    <Button
      variant={isActive ? "secondary" : "ghost"}
      size="sm"
      onClick={onClick}
      className="gap-1 text-xs"
    >
      {label}
      {isActive && direction === "asc" && "↑"}
      {isActive && direction === "desc" && "↓"}
    </Button>
  );
}
