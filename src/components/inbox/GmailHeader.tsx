import { useState, useEffect, useRef } from "react";
import { 
  Search, 
  Menu,
  Settings,
  Grid3X3,
  HelpCircle,
  RefreshCw,
  SlidersHorizontal,
  X,
  Camera
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userInitial, setUserInitial] = useState("M");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserInitial(user.email?.charAt(0).toUpperCase() || "M");
      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url, full_name")
        .eq("user_id", user.id)
        .single();
      if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);
      if (profile?.full_name) setUserInitial(profile.full_name.charAt(0).toUpperCase());
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Te rog să selectezi o imagine"); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("Imaginea trebuie să fie mai mică de 2MB"); return; }
    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Trebuie să fii autentificat"); return; }
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(fileName);
      const { error: updateError } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("user_id", user.id);
      if (updateError) throw updateError;
      setAvatarUrl(publicUrl + "?t=" + Date.now());
      toast.success("Poza de profil a fost actualizată!");
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      toast.error("Eroare la încărcarea pozei: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <header className="h-14 border-b border-border/10 flex items-center gap-2 px-3 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />

        {/* Left */}
        <div className="flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="h-9 w-9 rounded-lg hover:bg-muted/50 transition-colors">
                <Menu className="h-[18px] w-[18px]" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Meniu</TooltipContent>
          </Tooltip>
          
          <div className="flex items-center gap-2 pl-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shadow-sm">
              <span className="text-primary-foreground font-bold text-xs">M</span>
            </div>
            <span className="text-sm font-semibold text-foreground/90 hidden md:block tracking-tight">Mail</span>
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-xl mx-4">
          <div className={cn(
            "relative flex items-center transition-all duration-200 rounded-lg h-10",
            searchFocused 
              ? "bg-background shadow-md border border-border/40" 
              : "bg-muted/40 hover:bg-muted/60 border border-transparent"
          )}>
            <Search className="h-4 w-4 text-muted-foreground ml-3 shrink-0" />
            <Input
              type="text"
              placeholder="Caută în mail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-10 text-sm placeholder:text-muted-foreground/50"
            />
            {searchQuery && (
              <Button variant="ghost" size="icon" onClick={() => setSearchQuery("")} className="h-7 w-7 mr-1 rounded-md hover:bg-destructive/10 hover:text-destructive">
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md shrink-0 mr-1 hover:bg-muted/80">
                  <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Filtre</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onRefresh} disabled={isRefreshing} className="h-9 w-9 rounded-lg hover:bg-muted/50 hidden sm:flex">
                <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reîmprospătează</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => toast.info("Ajutor va fi disponibil în curând")} className="h-9 w-9 rounded-lg hover:bg-muted/50 hidden sm:flex">
                <HelpCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Ajutor</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => navigate("/admin/setari")} className="h-9 w-9 rounded-lg hover:bg-muted/50 hidden sm:flex">
                <Settings className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Setări</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => navigate("/admin")} className="h-9 w-9 rounded-lg hover:bg-muted/50 hidden sm:flex">
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Admin</TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg ml-1 p-0 overflow-hidden hover:ring-2 hover:ring-gold/30 transition-all" disabled={isUploading}>
                <Avatar className="h-7 w-7">
                  <AvatarImage src={avatarUrl || undefined} alt="Profil" className="object-cover" />
                  <AvatarFallback className="bg-gradient-to-br from-gold/30 to-gold-dark/30 text-gold text-xs font-semibold">
                    {isUploading ? "..." : userInitial}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 bg-popover border-border/50 rounded-lg">
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="cursor-pointer text-sm">
                <Camera className="h-4 w-4 mr-2" />
                Schimbă poza de profil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/admin")} className="text-sm">Dashboard</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/admin/setari")} className="text-sm">Setări</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/")} className="text-sm">Înapoi la Site</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </TooltipProvider>
  );
};
