import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { 
  Clock, 
  MapPin, 
  Euro, 
  Home, 
  X, 
  Trash2 
} from "lucide-react";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { cn } from "@/lib/utils";

interface RecentlyViewedProps {
  className?: string;
  excludePropertyId?: string;
  maxItems?: number;
  variant?: 'horizontal' | 'grid';
}

export const RecentlyViewed = ({ 
  className, 
  excludePropertyId,
  maxItems = 6,
  variant = 'horizontal'
}: RecentlyViewedProps) => {
  const { recentlyViewed, removeFromRecentlyViewed, clearRecentlyViewed } = useRecentlyViewed();

  // Filter out current property and limit items
  const displayItems = recentlyViewed
    .filter(item => item.id !== excludePropertyId)
    .slice(0, maxItems);

  if (displayItems.length === 0) {
    return null;
  }

  const formatTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `acum ${minutes} min`;
    if (hours < 24) return `acum ${hours} ore`;
    return `acum ${days} zile`;
  };

  return (
    <section className={cn("py-6", className)} aria-label="Proprietăți vizualizate recent">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-gold" />
          <h2 className="text-lg sm:text-xl font-bold text-foreground">
            Vizualizate Recent
          </h2>
          <Badge variant="secondary" className="bg-gold/10 text-gold text-xs">
            {displayItems.length}
          </Badge>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={clearRecentlyViewed}
          className="text-muted-foreground hover:text-destructive text-xs"
        >
          <Trash2 className="w-3 h-3 mr-1" />
          Șterge tot
        </Button>
      </div>

      {variant === 'horizontal' ? (
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-3 pb-4">
            {displayItems.map((property) => (
              <div key={property.id} className="relative group flex-shrink-0 w-[200px] sm:w-[240px]">
                <Link to={`/proprietati/${property.id}`}>
                  <Card className="overflow-hidden border-gold/20 hover:border-gold/40 transition-all duration-300 hover:shadow-lg">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      {property.image ? (
                        <img
                          src={property.image}
                          alt={property.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Home className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm text-[10px] px-1.5 py-0.5 rounded text-muted-foreground">
                        {formatTimeAgo(property.viewedAt)}
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-semibold text-sm line-clamp-1 mb-1 group-hover:text-gold transition-colors">
                        {property.title}
                      </h3>
                      <div className="flex items-center text-muted-foreground text-xs mb-2">
                        <MapPin className="w-3 h-3 mr-1 text-gold flex-shrink-0" />
                        <span className="truncate">{property.location}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-gold flex items-center">
                          <Euro className="w-3 h-3 mr-0.5" />
                          {property.price?.toLocaleString('de-DE')}
                        </span>
                        <span className="text-muted-foreground">
                          {property.surface} mp • {property.rooms} cam
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                
                {/* Remove button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.preventDefault();
                    removeFromRecentlyViewed(property.id);
                  }}
                  className="absolute top-2 left-2 h-6 w-6 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {displayItems.map((property) => (
            <div key={property.id} className="relative group">
              <Link to={`/proprietati/${property.id}`}>
                <Card className="overflow-hidden border-gold/20 hover:border-gold/40 transition-all duration-300 hover:shadow-lg h-full">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {property.image ? (
                      <img
                        src={property.image}
                        alt={property.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Home className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-2">
                    <h3 className="font-semibold text-xs line-clamp-1 group-hover:text-gold transition-colors">
                      {property.title}
                    </h3>
                    <span className="font-bold text-gold text-xs">
                      €{property.price?.toLocaleString('de-DE')}
                    </span>
                  </CardContent>
                </Card>
              </Link>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.preventDefault();
                  removeFromRecentlyViewed(property.id);
                }}
                className="absolute top-1 left-1 h-5 w-5 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
              >
                <X className="w-2.5 h-2.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
