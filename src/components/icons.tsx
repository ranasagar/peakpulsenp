import type { LucideProps } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Icons = {
  Logo: (props: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 20L12 4L21 20Z" />
      <path d="M8.5 14.5L12 10L15.5 14.5" />
      <path d="M12 10V4" />
    </svg>
  ),
  AnimatedMenuIcon: ({ className, ...props }: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("icon-animated-menu", className)}
      {...props}
    >
      <style>
        {`
          .icon-animated-menu .heart-path {
            animation: heart-pulse-animation 1.5s infinite ease-in-out;
            transform-origin: center;
            fill: currentColor; 
          }
          @keyframes heart-pulse-animation {
            0% { transform: scale(0.95); }
            50% { transform: scale(1.1); }
            100% { transform: scale(0.95); }
          }
        `}
      </style>
      {/* Mountain silhouette (static) - behind the heart */}
      <path
        d="M3 20L8 12L13 20L18 10L21 20Z" // Simplified mountain range
        strokeWidth="1.5"
        fill="none" 
        opacity="0.6" 
      />
      {/* Heart - in front, pulsating */}
      <path
        className="heart-path"
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        strokeWidth="1" 
      />
    </svg>
  )
};

// Add other custom icons here if needed
// Example:
// CartIcon: (props: LucideProps) => ( <ShoppingCart {...props} /> ),
    