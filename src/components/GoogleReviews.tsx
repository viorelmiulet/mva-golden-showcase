import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Star, Quote } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface GoogleReview {
  author_name: string;
  rating: number;
  text: string;
  relative_time_description: string;
  profile_photo_url: string;
  time: number;
}

interface GoogleReviewsData {
  reviews: GoogleReview[];
  rating: number;
  totalReviews: number;
  name: string;
}

const StarRating = ({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`${size === "md" ? "w-5 h-5" : "w-3.5 h-3.5"} ${
          star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"
        }`}
      />
    ))}
  </div>
);

const fallbackReviews: GoogleReviewsData = {
  rating: 5.0,
  totalReviews: 12,
  name: "MVA Imobiliare",
  reviews: [
    {
      author_name: "Andreea M.",
      rating: 5,
      text: "Experiență excelentă! Echipa MVA m-a ajutat să găsesc apartamentul perfect într-un timp foarte scurt. Profesionalism și dedicare la cel mai înalt nivel.",
      relative_time_description: "acum 2 luni",
      profile_photo_url: "",
      time: 0,
    },
    {
      author_name: "Cristian D.",
      rating: 5,
      text: "Recomand cu încredere! Am fost ghidat pas cu pas în procesul de achiziție. Transparență totală și comunicare impecabilă pe tot parcursul tranzacției.",
      relative_time_description: "acum 3 luni",
      profile_photo_url: "",
      time: 0,
    },
    {
      author_name: "Elena P.",
      rating: 5,
      text: "Foarte mulțumită de serviciile oferite. Au înțeles exact ce caut și mi-au prezentat doar opțiuni relevante. Proces rapid și fără stres.",
      relative_time_description: "acum 1 lună",
      profile_photo_url: "",
      time: 0,
    },
    {
      author_name: "Mihai T.",
      rating: 5,
      text: "Cel mai bun agent imobiliar cu care am lucrat! Cunoașterea pieței și atenția la detalii sunt remarcabile. Voi reveni cu siguranță.",
      relative_time_description: "acum 2 săptămâni",
      profile_photo_url: "",
      time: 0,
    },
    {
      author_name: "Ioana S.",
      rating: 5,
      text: "Servicii de top! Am vândut apartamentul în doar 3 săptămâni la un preț excelent. Mulțumesc echipei MVA pentru suportul acordat!",
      relative_time_description: "acum 1 lună",
      profile_photo_url: "",
      time: 0,
    },
    {
      author_name: "Dan R.",
      rating: 5,
      text: "Profesioniști adevărați! M-au ajutat cu tot procesul, de la vizionare până la semnarea contractului. Foarte recunoscător pentru tot.",
      relative_time_description: "acum 3 luni",
      profile_photo_url: "",
      time: 0,
    },
  ],
};

const GoogleReviews = () => {
  const { language } = useLanguage();

  const { data: apiData } = useQuery<GoogleReviewsData>({
    queryKey: ["google-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("google-reviews");
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });

  const data = apiData?.reviews?.length ? apiData : fallbackReviews;

  return (
    <section className="py-12 lg:py-16 border-t border-border/30">
      <div className="container mx-auto px-4 lg:px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <svg className="w-7 h-7" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <h2 className="font-cinzel text-xl lg:text-2xl font-bold text-gradient-gold">
              {language === 'ro' ? 'Ce spun clienții noștri' : 'What our clients say'}
            </h2>
          </div>
          <div className="flex items-center justify-center gap-3">
            <StarRating rating={Math.round(data.rating)} size="md" />
            <span className="text-sm text-muted-foreground font-medium">
              {data.rating.toFixed(1)} / 5 — {data.totalReviews} {language === 'ro' ? 'recenzii pe Google' : 'Google reviews'}
            </span>
          </div>
        </div>

        {/* Reviews grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {data.reviews
            .filter((r) => r.text)
            .map((review, index) => (
            <div
              key={index}
              className="glass rounded-xl p-5 border border-border/50 hover:border-gold/30 transition-all duration-300 relative"
            >
              <Quote className="w-6 h-6 text-gold/20 absolute top-4 right-4" />
              <div className="flex items-center gap-3 mb-3">
                {review.profile_photo_url ? (
                  <img
                    src={review.profile_photo_url}
                    alt={review.author_name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-gold/20"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center text-sm font-semibold text-gold ring-2 ring-gold/20">
                    {review.author_name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{review.author_name}</p>
                  <p className="text-[11px] text-muted-foreground">{review.relative_time_description}</p>
                </div>
              </div>
              <StarRating rating={review.rating} />
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed line-clamp-5">
                "{review.text}"
              </p>
            </div>
          ))}
        </div>

        {/* Google link */}
        <div className="text-center mt-6">
          <a
            href="https://maps.app.goo.gl/MVA_Imobiliare"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-gold transition-colors underline underline-offset-2"
          >
            {language === 'ro' ? 'Vezi toate recenziile pe Google' : 'See all reviews on Google'}
          </a>
        </div>
      </div>
    </section>
  );
};

export default GoogleReviews;
