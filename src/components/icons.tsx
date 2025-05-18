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
      viewBox="0 0 24 24" // Adjusted viewBox slightly if needed for larger heart
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
            fill: #28a745; /* Green color for heart */
            stroke: #28a745; /* Green stroke for heart */
            stroke-width: 0.5; /* Thinner stroke for heart to make fill more prominent */
          }
          @keyframes heart-pulse-animation {
            0% { transform: scale(1.0); } /* Base size slightly larger */
            50% { transform: scale(1.2); } /* Pulsating size increased */
            100% { transform: scale(1.0); }
          }
          .icon-animated-menu .ecg-mountain-path {
            stroke: currentColor; /* Or a specific color like var(--foreground) */
            stroke-width: 1.2; /* Thinner line for ECG */
            fill: none;
            stroke-dasharray: 100; /* Total length of the path (approximate, adjust if needed) */
            stroke-dashoffset: 100;
            animation: draw-ecg-mountain 3s ease-in-out infinite alternate;
            opacity: 0.7;
          }
          @keyframes draw-ecg-mountain {
            0% {
              stroke-dashoffset: 100;
              opacity: 0.3;
            }
            70% {
              stroke-dashoffset: 0;
              opacity: 0.7;
            }
            100% {
              stroke-dashoffset: 0;
              opacity: 0.7;
            }
          }
        `}
      </style>
      {/* Animated ECG Mountain Path */}
      <path
        className="ecg-mountain-path"
        d="M2 18 Q3 18 4 16 L6 20 L8 12 L10 18 L12 10 L14 18 L16 14 L18 18 L20 15 Q21 16 22 16" // Example ECG-like mountain path
      />
      {/* Heart - in front, pulsating, green, and slightly larger */}
      <path
        className="heart-path"
        transform="translate(0 1)" // Shift heart slightly down if needed
        d="M12 20.35l-1.45-1.32C5.4 14.36 2 11.28 2 7.5 2 4.42 4.42 2 7.5 2c1.74 0 3.41.81 4.5 2.09C13.09 2.81 14.76 2 16.5 2 19.58 2 22 4.42 22 7.5c0 3.78-3.4 6.86-8.55 11.54L12 20.35z" // Slightly adjusted heart path for size if needed
      />
    </svg>
  )
};

// Add other custom icons here if needed
// Example:
// CartIcon: (props: LucideProps) => ( <ShoppingCart {...props} /> ),
    
