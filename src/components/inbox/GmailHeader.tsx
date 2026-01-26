import { useState } from "react";
import { 
  Search, 
  Menu,
  Settings,
  Grid3X3,
  HelpCircle,
  RefreshCw,
  MoreVertical,
  SlidersHorizontal,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface GmailHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onToggleSidebar: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const GmailHeader = ({
  searchQuery,
  setSearchQuery,
  onToggleSidebar,
  onRefresh,
  isRefreshing = false,
}: GmailHeaderProps) => {
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <header className="h-16 border-b border-border/30 flex items-center gap-2 px-4 bg-background">
      {/* Left section */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="h-10 w-10 rounded-full hover:bg-muted/50"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        {/* Logo */}
        <div className="flex items-center gap-2 pl-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold/80 to-gold flex items-center justify-center">
            <span className="text-black font-bold text-sm">M</span>
          </div>
          <span className="text-xl font-medium text-muted-foreground hidden md:block">Mail</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex-1 max-w-[720px] mx-4">
        <div className={cn(
          "relative flex items-center transition-all duration-200",
          searchFocused 
            ? "bg-background shadow-lg border border-border rounded-lg" 
            : "bg-muted/50 hover:bg-muted/70 rounded-full"
        )}>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full shrink-0"
          >
            <Search className="h-5 w-5 text-muted-foreground" />
          </Button>
          
          <Input
            type="text"
            placeholder="Caută în mail"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className={cn(
              "border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0",
              "h-12 text-base placeholder:text-muted-foreground"
            )}
          />
          
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchQuery("")}
              className="h-8 w-8 mr-1"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full shrink-0 mr-1"
          >
            <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="h-10 w-10 rounded-full hover:bg-muted/50 hidden sm:flex"
        >
          <RefreshCw className={cn("h-5 w-5", isRefreshing && "animate-spin")} />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full hover:bg-muted/50 hidden sm:flex"
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full hover:bg-muted/50 hidden sm:flex"
        >
          <Settings className="h-5 w-5" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full hover:bg-muted/50 hidden sm:flex"
        >
          <Grid3X3 className="h-5 w-5" />
        </Button>

        {/* User Avatar */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full ml-2 bg-gold/20 hover:bg-gold/30 text-gold font-semibold"
        >
          M
        </Button>
      </div>
    </header>
  );
};
