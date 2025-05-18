import type { LucideProps } from 'lucide-react';

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
  // Add other custom icons here if needed
  // Example:
  // CartIcon: (props: LucideProps) => ( <ShoppingCart {...props} /> ),
};
