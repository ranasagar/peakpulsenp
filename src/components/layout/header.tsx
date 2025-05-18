
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Icons } from '@/components/icons';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/types';
import { ShoppingCart, Search, Menu, LogOut, UserCircle, LayoutDashboard, Settings, Star, ShoppingBag, Briefcase } from 'lucide-react';
import { ModeToggle } from './mode-toggle'; // Assuming ModeToggle exists for dark mode

const mainNavItems: NavItem[] = [
  { title: 'Home', href: '/' },
  { title: 'Shop', href: '/products' },
  { title: 'Our Story', href: '/our-story' },
  { title: 'Contact', href: '/contact' },
];

const userNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/account/dashboard', icon: LayoutDashboard },
  { title: 'Orders', href: '/account/orders', icon: ShoppingBag },
  { title: 'Profile', href: '/account/profile', icon: Settings },
  { title: 'Wishlist', href: '/account/wishlist', icon: Star },
];

export function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);


  const navLinks = mainNavItems.map((item) => {
    const isVipLink = item.href === '/vip-collection';
    if (isVipLink && !isAuthenticated) return null; // Hide VIP if not logged in
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === item.href ? "text-primary" : "text-foreground/80"
        )}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        {item.title}
      </Link>
    );
  });

  const userDropdownItems = (
    <>
      {userNavItems.map(item => (
        <DropdownMenuItem key={item.href} asChild>
          <Link href={item.href} className="flex items-center">
            {item.icon && <item.icon className="mr-2 h-4 w-4" />}
            {item.title}
          </Link>
        </DropdownMenuItem>
      ))}
       {user?.roles?.includes('affiliate') && (
        <DropdownMenuItem asChild>
          <Link href="/affiliate-portal" className="flex items-center">
            <Briefcase className="mr-2 h-4 w-4" />
            Affiliate Portal
          </Link>
        </DropdownMenuItem>
      )}
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={logout}>
        <LogOut className="mr-2 h-4 w-4" />
        Log out
      </DropdownMenuItem>
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container-wide flex h-20 items-center">
        {/* Mobile Menu Trigger */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden mr-4">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-full max-w-xs sm:max-w-sm bg-background p-6">
            <SheetHeader>
              <SheetTitle className="sr-only">Main Menu</SheetTitle>
            </SheetHeader>
            <Link href="/" className="mb-8 flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
              <Icons.Logo className="h-7 w-7 text-primary" />
              <span className="font-bold text-lg text-foreground">Peak Pulse</span>
            </Link>
            <nav className="flex flex-col space-y-5">
              {navLinks}
              {isAuthenticated && (
                <div className="pt-4 border-t border-border/60">
                  <p className="text-sm font-medium text-muted-foreground mb-2">My Account</p>
                  {userNavItems.map(item => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center py-2 text-sm font-medium text-foreground/80 hover:text-primary"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                      {item.title}
                    </Link>
                  ))}
                  {user?.roles?.includes('affiliate') && (
                    <Link
                      href="/affiliate-portal"
                      className="flex items-center py-2 text-sm font-medium text-foreground/80 hover:text-primary"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                       <Briefcase className="mr-2 h-4 w-4" />
                       Affiliate Portal
                    </Link>
                  )}
                  <Button variant="ghost" onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="w-full justify-start mt-2 px-0">
                    <LogOut className="mr-2 h-4 w-4" /> Log out
                  </Button>
                </div>
              )}
              {!isAuthenticated && (
                <Button asChild className="mt-6 w-full" onClick={() => setIsMobileMenuOpen(false)}>
                  <Link href="/login">Sign In</Link>
                </Button>
              )}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Desktop Logo */}
        <Link href="/" className="mr-8 flex items-center space-x-2">
          <Icons.Logo className="h-8 w-8 text-primary" />
          <span className="hidden lg:inline-block font-semibold text-xl text-foreground">
            Peak Pulse
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {navLinks}
        </nav>

        <div className="flex flex-1 items-center justify-end space-x-3">
          <Button variant="ghost" size="icon" className="hidden md:inline-flex">
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>
          
          {mounted && <ModeToggle />}

          <Button variant="ghost" size="icon" asChild>
            <Link href="/cart">
              <ShoppingCart className="h-5 w-5" />
              <span className="sr-only">Cart</span>
              {/* TODO: Add cart item count badge */}
            </Link>
          </Button>

          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.avatarUrl || `https://placehold.co/100x100.png?text=${user.name ? user.name.charAt(0) : 'P'}`} alt={user.name ?? 'User'} data-ai-hint="user avatar"/>
                    <AvatarFallback>{user.name ? user.name.charAt(0).toUpperCase() : <UserCircle />}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {userDropdownItems}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="outline" size="sm" className="hidden md:inline-flex">
              <Link href="/login">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
