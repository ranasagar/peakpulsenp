
"use client";

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: number;
  className?: string;
  starClassName?: string;
}

export function RatingStars({
  rating,
  maxRating = 5,
  size = 20, // Default size in pixels
  className,
  starClassName,
}: RatingStarsProps) {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5; // Not used for fill, but for logic if needed
  const emptyStars = maxRating - fullStars - (halfStar ? 1 : 0); // Not directly used if only filling

  return (
    <div className={cn("flex items-center", className)} aria-label={`Rating: ${rating} out of ${maxRating} stars`}>
      {[...Array(maxRating)].map((_, index) => {
        const starNumber = index + 1;
        let fillClass = "text-muted-foreground/30"; // Default empty
        if (starNumber <= rating) {
          fillClass = "text-yellow-400 fill-yellow-400"; // Full star
        } else if (starNumber - 0.5 <= rating) {
          fillClass = "text-yellow-400 fill-yellow-400/50"; // Half-filled appearance (using opacity or a half icon if available)
                                                           // For simplicity, we'll make it partially filled (like full but could be different for true half star)
                                                           // A common approach is to use a gradient or a half-icon SVG.
                                                           // Here, we'll color it like a full star if rating is >= starNumber - 0.5
        }

        return (
          <Star
            key={index}
            className={cn("shrink-0", fillClass, starClassName)}
            style={{ width: size, height: size }}
          />
        );
      })}
    </div>
  );
}

  