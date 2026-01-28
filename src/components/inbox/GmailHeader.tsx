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
  Upload
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
      // Set initial from email
      setUserInitial(user.email?.charAt(0).toUpperCase() || "M");
      
      // Get profile with avatar
      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url, full_name")
        .eq("user_id", user.id)
        .single();
      
      if (profile?.avatar_url) {
        setAvatarUrl(profile.avatar_url);
      }
      if (profile?.full_name) {
        setUserInitial(profile.full_name.charAt(0).toUpperCase());
      }
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Te rog să selectezi o imagine");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Imaginea trebuie să fie mai mică de 2MB");
      return;
    }

    setIsUploading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Trebuie să fii autentificat");
        return;
      }

      // Create unique file path
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl + "?t=" + Date.now()); // Cache bust
      toast.success("Poza de profil a fost actualizată!");
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      toast.error("Eroare la încărcarea pozei: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleHelp = () => {
    toast.info("Secțiunea de ajutor va fi disponibilă în curând");
  };

  const handleSettings = () => {
    navigate("/admin/setari");
  };

  const handleApps = () => {
    navigate("/admin");
  };

  return (
    <TooltipProvider delayDuration={300}>
      <header className="h-16 border-b border-border/30 flex items-center gap-2 px-4 bg-background">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarUpload}
        />

        {/* Left section */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleSidebar}
                className="h-10 w-10 rounded-full hover:bg-muted/50"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Meniu principal</TooltipContent>
          </Tooltip>
          
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
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full shrink-0 mr-1"
                >
                  <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Opțiuni de căutare</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="h-10 w-10 rounded-full hover:bg-muted/50 hidden sm:flex"
              >
                <RefreshCw className={cn("h-5 w-5", isRefreshing && "animate-spin")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reîmprospătează</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleHelp}
                className="h-10 w-10 rounded-full hover:bg-muted/50 hidden sm:flex"
              >
                <HelpCircle className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Ajutor</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSettings}
                className="h-10 w-10 rounded-full hover:bg-muted/50 hidden sm:flex"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Setări</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleApps}
                className="h-10 w-10 rounded-full hover:bg-muted/50 hidden sm:flex"
              >
                <Grid3X3 className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Aplicații Admin</TooltipContent>
          </Tooltip>

          {/* User Avatar with upload */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full ml-2 p-0 overflow-hidden"
                disabled={isUploading}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={avatarUrl || undefined} alt="Profil" />
                  <AvatarFallback className="bg-gold/20 text-gold font-semibold">
                    {isUploading ? "..." : userInitial}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem 
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer"
              >
                <Camera className="h-4 w-4 mr-2" />
                Schimbă poza de profil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/admin")}>
                Dashboard Admin
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSettings}>
                Setări
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/")}>
                Înapoi la Site
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </TooltipProvider>
  );
};
