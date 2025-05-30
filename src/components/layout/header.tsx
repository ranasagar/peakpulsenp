
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
import { ShoppingCart, Search, LogOut, UserCircle, LayoutDashboard, Settings, Star, ShoppingBag, Briefcase, LayoutGrid, Home as HomeIcon, BookOpenText, Mail, Handshake, Users, Palette as PaletteIcon, Printer, FileText as PageIcon, MessageSquare, Landmark, FileSpreadsheet, DollarSign, ListChecks } from 'lucide-react';
import { ModeToggle } from './mode-toggle';
import { useCart } from '@/context/cart-context';

const mainNavItems: NavItem[] = [
  { title: 'Home', href: '/', icon: HomeIcon },
  { title: 'Shop', href: '/products', icon: ShoppingBag },
  { title: 'Categories', href: '/categories', icon: LayoutGrid },
  { title: 'Collaborations', href: '/collaborations', icon: Handshake },
  { title: 'Our Story', href: '/our-story', icon: BookOpenText },
  { title: 'Contact', href: '/contact', icon: Mail },
];

const userNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/account/dashboard', icon: LayoutDashboard },
  { title: 'Orders', href: '/account/orders', icon: ShoppingBag },
  { title: 'Profile', href: '/account/profile', icon: Settings },
  { title: 'Wishlist', href: '/account/wishlist', icon: Star },
];

export function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const { cartItemCount } = useCart();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);


  const navLinks = mainNavItems.map((item) => {
    const isVipLink = item.href === '/vip-collection';
    if (isVipLink && !isAuthenticated) return null;
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex items-center text-sm font-medium transition-colors hover:text-primary header-link-pulse",
          pathname === item.href ? "text-primary" : "text-foreground/80"
        )}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        {item.icon && <item.icon className="mr-2 h-4 w-4 md:hidden lg:inline-block" />}
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
          <Link href="/account/affiliate-portal" className="flex items-center">
            <Briefcase className="mr-2 h-4 w-4" />
            Affiliate Portal
          </Link>
        </DropdownMenuItem>
      )}
      {user?.roles?.includes('admin') && (
        <DropdownMenuItem asChild>
          <Link href="/admin" className="flex items-center font-semibold text-primary">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Admin Panel
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
      <div className="container-wide flex h-20 items-center justify-between"> {/* Changed to justify-between */}
        {/* Left Group: Mobile Menu Trigger & Desktop Logo */}
        <div className="flex items-center">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden mr-2 h-16 w-16">
                <Icons.AnimatedMenuIcon className="h-8 w-8" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full max-w-xs sm:max-w-sm bg-background p-0">
              <SheetHeader className="p-6 pb-2 border-b mb-2">
                  <SheetTitle className="sr-only">Main Navigation Menu</SheetTitle>
                  <Link href="/" className="mb-4 flex items-center gap-2 self-start" onClick={() => setIsMobileMenuOpen(false)}>
                      <Icons.Logo className="h-7 w-7 text-primary" />
                      <span className="font-bold text-lg text-foreground">Peak Pulse</span>
                  </Link>
              </SheetHeader>
              <div className="p-6">
                <nav className="flex flex-col space-y-5">
                  {navLinks}
                  {isAuthenticated && (
                    <div className="pt-4 border-t border-border/60">
                      <p className="text-sm font-medium text-muted-foreground mb-2">My Account</p>
                      {userNavItems.map(item => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="flex items-center py-2 text-sm font-medium text-foreground/80 hover:text-primary header-link-pulse"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                          {item.title}
                        </Link>
                      ))}
                      {user?.roles?.includes('affiliate') && (
                        <Link
                          href="/account/affiliate-portal"
                          className="flex items-center py-2 text-sm font-medium text-foreground/80 hover:text-primary header-link-pulse"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                           <Briefcase className="mr-2 h-4 w-4" />
                           Affiliate Portal
                        </Link>
                      )}
                       {user?.roles?.includes('admin') && (
                        <Link
                          href="/admin"
                          className="flex items-center py-2 text-sm font-medium text-primary hover:text-primary/80 header-link-pulse font-semibold"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Admin Panel
                        </Link>
                      )}
                      <Button variant="ghost" onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="w-full justify-start mt-2 px-0 text-foreground/80 hover:text-primary">
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
              </div>
            </SheetContent>
          </Sheet>

          <Link href="/" className="flex items-center space-x-2"> {/* Removed mr-6 lg:mr-8 for better balance with justify-between */}
            <Icons.Logo className="h-8 w-8 text-primary" />
            <span className="hidden lg:inline-block font-semibold text-xl text-foreground">
              Peak Pulse
            </span>
          </Link>
        </div>

        {/* Center Group: Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-4 lg:space-x-6 text-sm font-medium">
          {navLinks}
        </nav>

        {/* Right Group: Actions */}
        <div className="flex items-center space-x-2 md:space-x-3"> {/* Removed flex-1 */}
          <Button variant="ghost" size="icon" className="hidden md:inline-flex"> {/* Kept hidden md:inline-flex for search */}
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>
          
          {mounted && <ModeToggle />}

          <Button variant="ghost" size="icon" asChild>
            <Link href="/cart" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {mounted && cartItemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[0.6rem] font-bold text-destructive-foreground ring-2 ring-background">
                  {cartItemCount > 9 ? '9+' : cartItemCount}
                </span>
              )}
              <span className="sr-only">Cart</span>
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

    