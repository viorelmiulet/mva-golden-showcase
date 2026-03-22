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
  Camera,
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
      <header className="sticky top-0 z-50 flex h-16 items-center gap-3 border-b border-border/20 bg-background px-4">
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />

        <div className="flex shrink-0 items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="h-10 w-10 rounded-xl border border-transparent hover:border-border/30 hover:bg-muted">
                <Menu className="h-[18px] w-[18px]" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Meniu</TooltipContent>
          </Tooltip>

          <div className="flex items-center gap-3 pl-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <span className="text-sm font-bold">M</span>
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-semibold text-foreground">Inbox</p>
              <p className="text-xs text-muted-foreground">Vizualizare tip Outlook</p>
            </div>
          </div>
        </div>

        <div className="mx-2 flex-1">
          <div className={cn(
            "relative flex h-11 items-center rounded-2xl border px-1 transition-all duration-200",
            searchFocused
              ? "border-border/40 bg-background shadow-sm"
              : "border-border/20 bg-muted/35 hover:bg-muted/50",
          )}>
            <Search className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Caută în inbox"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="h-10 border-0 bg-transparent text-sm placeholder:text-muted-foreground/70 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            {searchQuery && (
              <Button variant="ghost" size="icon" onClick={() => setSearchQuery("")} className="mr-1 h-8 w-8 rounded-xl hover:bg-muted">
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="mr-1 h-9 w-9 shrink-0 rounded-xl hover:bg-muted">
                  <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Filtre</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-2xl border border-border/20 bg-muted/20 px-2 py-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onRefresh} disabled={isRefreshing} className="hidden h-9 w-9 rounded-xl hover:bg-muted sm:flex">
                <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reîmprospătează</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => toast.info("Ajutor va fi disponibil în curând")} className="hidden h-9 w-9 rounded-xl hover:bg-muted sm:flex">
                <HelpCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Ajutor</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => navigate("/admin/setari")} className="hidden h-9 w-9 rounded-xl hover:bg-muted sm:flex">
                <Settings className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Setări</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => navigate("/admin")} className="hidden h-9 w-9 rounded-xl hover:bg-muted sm:flex">
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Admin</TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-1 h-10 w-10 overflow-hidden rounded-xl border border-border/30 p-0 hover:bg-muted" disabled={isUploading}>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={avatarUrl || undefined} alt="Profil" className="object-cover" />
                  <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                    {isUploading ? "..." : userInitial}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-xl border-border/50 bg-popover">
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="cursor-pointer text-sm">
                <Camera className="mr-2 h-4 w-4" />
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
