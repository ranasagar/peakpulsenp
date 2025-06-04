
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/types';
import { Home as HomeIcon, ShoppingBag, LayoutGrid, Handshake, BookOpenText, Mail, Users } from 'lucide-react'; // Added Users icon
import { useAutoHideMenu } from '@/hooks/use-auto-hide-menu'; // Added

// Define mainNavItems here as well, or centralize them in a shared file later
const mainNavItems: NavItem[] = [
  { title: 'Home', href: '/', icon: HomeIcon },
  { title: 'Shop', href: '/products', icon: ShoppingBag },
  { title: 'Categories', href: '/categories', icon: LayoutGrid },
  { title: 'Collaborations', href: '/collaborations', icon: Handshake },
  { title: 'Community', href: '/community', icon: Users }, // Added Community link
  { title: 'Our Story', href: '/our-story', icon: BookOpenText },
  { title: 'Contact', href: '/contact', icon: Mail },
];

export function BottomNavigation() {
  const pathname = usePathname();
  const { isAutoHideEnabled, areMenusHiddenActually } = useAutoHideMenu(); // Consuming the hook

  return (
    <nav className={cn(
        "hidden md:flex bg-card border-t border-border/80 sticky bottom-0 z-40 shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.08)] dark:shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.20)]",
        isAutoHideEnabled && areMenusHiddenActually && 'menu-auto-hidden-bottom' // Apply auto-hide class
      )}>
      <div className="container-wide flex h-16 items-center justify-center space-x-6 lg:space-x-8">
        {mainNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center text-sm font-medium transition-colors hover:text-primary header-link-pulse",
              pathname === item.href ? "text-primary" : "text-foreground/80"
            )}
          >
            {item.icon && <item.icon className="mr-2 h-4 w-4" />}
            {item.title}
          </Link>
        ))}
      </div>
    </nav>
  );
}
