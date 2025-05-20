
"use client";

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: number;
  className?: string;
  starClassName?: string;
  onRatingChange?: (rating: number) => void; // For interactive rating
  isInteractive?: boolean;
}

export function RatingStars({
  rating,
  maxRating = 5,
  size = 20,
  className,
  starClassName,
  onRatingChange,
  isInteractive = false,
}: RatingStarsProps) {
  const [hoverRating, setHoverRating] = useState(0);
  const currentRating = isInteractive && hoverRating > 0 ? hoverRating : rating;

  const handleStarClick = (starValue: number) => {
    if (isInteractive && onRatingChange) {
      onRatingChange(starValue);
    }
  };

  const handleStarHover = (starValue: number) => {
    if (isInteractive) {
      setHoverRating(starValue);
    }
  };

  return (
    <div 
      className={cn("flex items-center", className)} 
      aria-label={`Rating: ${rating} out of ${maxRating} stars`}
      onMouseLeave={isInteractive ? () => setHoverRating(0) : undefined}
    >
      {[...Array(maxRating)].map((_, index) => {
        const starValue = index + 1;
        let fillClass = "text-muted-foreground/30"; // Default empty

        if (starValue <= currentRating) {
          fillClass = "text-yellow-400 fill-yellow-400"; 
        }
        // For half-star or more complex logic, you might need different icons or more sophisticated fill calculation.
        // For now, full fill if currentRating >= starValue.
        
        return (
          <button
            key={index}
            type="button"
            disabled={!isInteractive}
            onClick={() => handleStarClick(starValue)}
            onMouseEnter={() => handleStarHover(starValue)}
            className={cn(
              "p-0 bg-transparent border-none shrink-0", 
              isInteractive ? "cursor-pointer" : "cursor-default",
              starClassName
            )}
            aria-label={isInteractive ? `Rate ${starValue} stars` : undefined}
          >
            <Star
              className={cn("shrink-0", fillClass)}
              style={{ width: size, height: size }}
            />
          </button>
        );
      })}
    </div>
  );
}

// Need to import useState for hoverRating if it's used for interactive stars.
// For now, I'll assume it's not used for the display-only scenario.
// If it were, we'd add: import { useState } from 'react';
// Corrected: For the interactive part (write review), we DO need useState.
import { useState } from 'react';
