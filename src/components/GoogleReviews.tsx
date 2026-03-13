import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Star } from "lucide-react";
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

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`w-3.5 h-3.5 ${
          star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"
        }`}
      />
    ))}
  </div>
);

const GoogleReviews = () => {
  const { language } = useLanguage();

  const { data, isLoading } = useQuery<GoogleReviewsData>({
    queryKey: ["google-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("google-reviews");
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    retry: 1,
  });

  if (isLoading || !data?.reviews?.length) return null;

  return (
    <div className="py-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        <div>
          <span className="text-sm font-semibold text-foreground">Google Reviews</span>
          <div className="flex items-center gap-2">
            <StarRating rating={Math.round(data.rating)} />
            <span className="text-xs text-muted-foreground">
              {data.rating.toFixed(1)} ({data.totalReviews} {language === 'ro' ? 'recenzii' : 'reviews'})
            </span>
          </div>
        </div>
      </div>

      {/* Reviews carousel */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
        {data.reviews.map((review, index) => (
          <div
            key={index}
            className="flex-shrink-0 w-72 snap-start glass rounded-xl p-4 border border-border/50"
          >
            <div className="flex items-center gap-2.5 mb-2.5">
              {review.profile_photo_url ? (
                <img
                  src={review.profile_photo_url}
                  alt={review.author_name}
                  className="w-8 h-8 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-xs font-semibold text-gold">
                  {review.author_name.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{review.author_name}</p>
                <p className="text-[10px] text-muted-foreground">{review.relative_time_description}</p>
              </div>
            </div>
            <StarRating rating={review.rating} />
            {review.text && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-4 leading-relaxed">
                "{review.text}"
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GoogleReviews;
