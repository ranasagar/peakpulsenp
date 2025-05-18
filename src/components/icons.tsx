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
      stroke="currentColor" // Default stroke for SVG container
      strokeWidth="1.5"    // Default stroke-width for SVG container
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("icon-animated-menu", className)}
      {...props}
    >
      <style>
        {`
          .icon-animated-menu .heart-path {
            fill: #28a745; /* Green color for heart */
            stroke: #1c7430; /* Darker green stroke for definition */
            stroke-width: 0.75; /* Stroke for the heart itself */
            animation: heart-pulse-animation 1.5s infinite ease-in-out;
            transform-origin: center; /* Animation scales from center of the path's bounding box */
          }
          @keyframes heart-pulse-animation {
            0% { transform: scale(1.0); }
            50% { transform: scale(1.15); } /* Pulsating size for the heart */
            100% { transform: scale(1.0); }
          }
          .icon-animated-menu .ecg-path {
            stroke: currentColor; /* Uses the SVG's currentColor (can be overridden by className) */
            stroke-width: 1; /* Subtle stroke for ECG */
            fill: none;
            stroke-dasharray: 60; /* Adjusted to path length */
            stroke-dashoffset: 60; /* Start with path "undrawn" */
            animation: draw-ecg 3s ease-in-out infinite alternate;
            opacity: 0; /* Start invisible, fade in with animation */
          }
          @keyframes draw-ecg {
            0% {
              stroke-dashoffset: 60; /* Start fully offset */
              opacity: 0;
            }
            20% { /* Start drawing and fading in */
              opacity: 0.8;
            }
            70% {
              stroke-dashoffset: 0; /* Fully drawn */
              opacity: 0.8;
            }
            100% {
              stroke-dashoffset: 0; /* Hold drawn state */
              opacity: 0; /* Fade out */
            }
          }
        `}
      </style>
      {/* Green Heart - Scaled up and centered. Rendered first to be in the background. */}
      <path
        className="heart-path"
        transform="scale(1.2) translate(-1.2, -2.2)" // Scale factor & translation to make heart larger and centered
        d="M12 20.35l-1.45-1.32C5.4 14.36 2 11.28 2 7.5 2 4.42 4.42 2 7.5 2c1.74 0 3.41.81 4.5 2.09C13.09 2.81 14.76 2 16.5 2 19.58 2 22 4.42 22 7.5c0 3.78-3.4 6.86-8.55 11.54L12 20.35z"
      />
      {/* Animated ECG Path - Renders ON TOP of heart */}
      <path
        className="ecg-path"
        // Adjusted path to go across the center (y=12) with some peaks, extending off-screen
        d="M-2 12 Q2 12 3 10 L5 14 L7 8 L9 15 L11 9 L13 14 L15 10 L17 12 Q20 12 26 12"
      />
    </svg>
  )
};

// Add other custom icons here if needed
// Example:
// CartIcon: (props: LucideProps) => ( <ShoppingCart {...props} /> ),
    
