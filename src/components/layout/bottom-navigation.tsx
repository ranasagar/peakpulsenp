
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/types';
import { Home as HomeIcon, ShoppingBag, LayoutGrid, Handshake, BookOpenText, Mail } from 'lucide-react';

// Define mainNavItems here as well, or centralize them in a shared file later
const mainNavItems: NavItem[] = [
  { title: 'Home', href: '/', icon: HomeIcon },
  { title: 'Shop', href: '/products', icon: ShoppingBag },
  { title: 'Categories', href: '/categories', icon: LayoutGrid },
  { title: 'Collaborations', href: '/collaborations', icon: Handshake },
  { title: 'Our Story', href: '/our-story', icon: BookOpenText },
  { title: 'Contact', href: '/contact', icon: Mail },
];

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex bg-card border-t border-border sticky bottom-0 z-40 shadow-top">
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
