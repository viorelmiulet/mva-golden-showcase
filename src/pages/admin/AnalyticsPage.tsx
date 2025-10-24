import AdminAnalytics from "@/components/AdminAnalytics";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const AnalyticsPage = () => {
  const { data, loading, error } = useAnalytics();

  if (loading) {
    return (
      <Card className="glass border-gold/20">
        <CardContent className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-gold mb-4" />
          <p className="text-muted-foreground">Se încarcă datele analytics...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="glass border-gold/20">
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">
            {error ? "Eroare la încărcarea datelor" : "Nu sunt disponibile date"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return <AdminAnalytics data={data} />;
};

export default AnalyticsPage;
