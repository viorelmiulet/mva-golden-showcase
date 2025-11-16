import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Heart,
  ArrowLeft,
  Euro,
  Home,
  Trash2,
  Building2
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { useFavorites } from "@/hooks/useFavorites";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

const Favorites = () => {
  const { favorites, removeFavorite, clearFavorites } = useFavorites();

  const getStatusBadge = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "available":
        return <Badge variant="default" className="bg-success text-success-foreground">Disponibil</Badge>;
      case "reserved":
        return <Badge variant="secondary">Rezervat</Badge>;
      case "sold":
        return <Badge variant="destructive">Vândut</Badge>;
      default:
        return <Badge variant="outline">Status necunoscut</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Apartamente Favorite - MVA Real Estate</title>
        <meta name="description" content="Apartamentele tale favorite salvate pentru comparare și vizualizare ulterioară" />
      </Helmet>
      
      <Header />
      
      <main className="container mx-auto px-4 py-24">
        <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Înapoi
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
                <Heart className="h-8 w-8 text-primary fill-primary" />
                Apartamente Favorite
              </h1>
              <p className="text-muted-foreground mt-2">
                {favorites.length} {favorites.length === 1 ? 'apartament salvat' : 'apartamente salvate'}
              </p>
            </div>
          </div>
          
          {favorites.length > 0 && (
            <Button
              variant="destructive"
              onClick={() => {
                if (confirm('Sigur doriți să ștergeți toate favoritele?')) {
                  clearFavorites();
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Șterge toate
            </Button>
          )}
        </div>

        {favorites.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                Nu ai apartamente favorite
              </h2>
              <p className="text-muted-foreground mb-6">
                Salvează apartamentele preferate pentru a le compara și vizualiza ulterior
              </p>
              <Link to="/complexe">
                <Button>
                  <Building2 className="h-4 w-4 mr-2" />
                  Explorează Complexe
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {favorites.map((apartment) => (
              <Card key={apartment.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {apartment.images && apartment.images.length > 0 && (
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={apartment.images[0]}
                      alt={apartment.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-semibold text-foreground">
                      {apartment.title}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFavorite(apartment.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {apartment.project_name && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {apartment.project_name}
                    </p>
                  )}

                  <div className="space-y-2 mb-4">
                    {(apartment.price_min || apartment.price_max) && (
                      <div className="flex items-center gap-2 text-sm">
                        <Euro className="h-4 w-4 text-primary" />
                        <span className="text-foreground font-medium">
                          {apartment.price_min && apartment.price_max
                            ? `${apartment.price_min.toLocaleString()} - ${apartment.price_max.toLocaleString()} €`
                            : apartment.price_min
                            ? `${apartment.price_min.toLocaleString()} €`
                            : `${apartment.price_max?.toLocaleString()} €`}
                        </span>
                      </div>
                    )}

                    {(apartment.surface_min || apartment.surface_max) && (
                      <div className="flex items-center gap-2 text-sm">
                        <Home className="h-4 w-4 text-primary" />
                        <span className="text-muted-foreground">
                          {apartment.surface_min && apartment.surface_max
                            ? `${apartment.surface_min} - ${apartment.surface_max} mp`
                            : apartment.surface_min
                            ? `${apartment.surface_min} mp`
                            : `${apartment.surface_max} mp`}
                        </span>
                        {apartment.rooms && (
                          <span className="text-muted-foreground">
                            • {apartment.rooms} {apartment.rooms === 1 ? 'cameră' : 'camere'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    {getStatusBadge(apartment.availability_status)}
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(apartment.savedAt), 'dd MMM yyyy', { locale: ro })}
                    </span>
                  </div>

                  {apartment.project_id && (
                    <Link to={`/complexe/${apartment.project_id}`} className="block mt-4">
                      <Button variant="outline" className="w-full">
                        Vezi Detalii
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default Favorites;
