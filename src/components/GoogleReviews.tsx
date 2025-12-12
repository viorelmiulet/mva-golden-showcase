import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Star } from "lucide-react";

interface Review {
  author_name: string;
  author_photo: string;
  rating: number;
  text: string;
  time: number;
  relative_time: string;
}

interface ReviewsData {
  name: string;
  rating: number;
  total_reviews: number;
  reviews: Review[];
}

const GoogleReviews = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['google-reviews'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('google-reviews');
      if (error) throw error;
      return data as ReviewsData;
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-pulse flex space-x-4">
          <div className="h-4 bg-gold/20 rounded w-32"></div>
        </div>
      </div>
    );
  }

  if (error || !data || !data.reviews?.length) {
    return null;
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "fill-muted text-muted"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="py-8 border-t border-gold/10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-sm font-medium text-foreground">Recenzii Google</span>
          </div>
          
          <div className="flex items-center gap-2">
            {renderStars(Math.round(data.rating))}
            <span className="text-lg font-semibold text-gold">{data.rating.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">
              ({data.total_reviews} recenzii)
            </span>
          </div>
          
          <a
            href="https://maps.app.goo.gl/PiQ2ePXHjWRpWSvc7"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gold hover:text-gold-light transition-colors underline"
          >
            Vezi toate recenziile
          </a>
        </div>

        {/* Reviews Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.reviews.slice(0, 3).map((review, index) => (
            <div
              key={index}
              className="bg-card/50 border border-gold/10 rounded-xl p-4 hover:border-gold/20 transition-colors"
            >
              <div className="flex items-start gap-3 mb-3">
                {review.author_photo ? (
                  <img
                    src={review.author_photo}
                    alt={review.author_name}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center text-gold font-semibold">
                    {review.author_name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">
                    {review.author_name}
                  </p>
                  <div className="flex items-center gap-2">
                    {renderStars(review.rating)}
                    <span className="text-xs text-muted-foreground">
                      {review.relative_time}
                    </span>
                  </div>
                </div>
              </div>
              
              {review.text && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  "{review.text}"
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GoogleReviews;
