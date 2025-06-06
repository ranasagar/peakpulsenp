
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
import type { NavItem, SiteSettings } from '@/types';
import { ShoppingCart, Search, LogOut, UserCircle, LayoutDashboard, Settings, Star, ShoppingBag as ShoppingBagIcon, Briefcase, LayoutGrid, Home as HomeIcon, BookOpenText, Mail, Handshake, Users, Image as ImageIconLucide, Loader2, Timer, TimerOff } from 'lucide-react'; // Added Timer, TimerOff
import { ModeToggle } from './mode-toggle';
import { FullscreenToggleButton } from '@/components/ui/fullscreen-toggle-button';
import { useCart } from '@/context/cart-context';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAutoHideMenu } from '@/hooks/use-auto-hide-menu'; // Added
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; // Added for new button

// These are used for the mobile Sheet menu and User Dropdown
const mainNavItems: NavItem[] = [
  { title: 'Home', href: '/', icon: HomeIcon },
  { title: 'Shop', href: '/products', icon: ShoppingBagIcon },
  { title: 'Categories', href: '/categories', icon: LayoutGrid },
  { title: 'Collaborations', href: '/collaborations', icon: Handshake },
  { title: 'Community', href: '/community', icon: Users },
  { title: 'Our Story', href: '/our-story', icon: BookOpenText },
  { title: 'Contact', href: '/contact', icon: Mail },
];

const userNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Orders', href: '/orders', icon: ShoppingBagIcon },
  { title: 'Profile', href: '/profile', icon: Settings },
  { title: 'Wishlist', href: '/wishlist', icon: Star },
];

export function Header() { // Still named Header, but acts as TopBar
  const { user, logout, isAuthenticated } = useAuth();
  const { cartItemCount } = useCart();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const { isAutoHideEnabled, toggleAutoHideEnabled, areMenusHiddenActually } = useAutoHideMenu(); // Consuming the hook

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const fetchSiteSettings = async () => {
      setIsLoadingSettings(true);
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          setSiteSettings(data);
        } else {
          console.warn("Header: Failed to fetch site settings.");
          setSiteSettings(null); // Or set to default settings
        }
      } catch (error) {
        console.error("Header: Error fetching site settings:", error);
        setSiteSettings(null);
      } finally {
        setIsLoadingSettings(false);
      }
    };
    fetchSiteSettings();
  }, []);

  const displaySiteTitle = siteSettings?.headerSiteTitle || siteSettings?.siteTitle || "Peak Pulse";
  const headerLogoUrl = siteSettings?.headerLogoUrl;

  const mobileNavLinks = mainNavItems.map((item) => {
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex items-center text-base py-2 font-medium transition-colors hover:text-primary header-link-pulse",
          pathname === item.href ? "text-primary" : "text-foreground/80"
        )}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        {item.icon && <item.icon className="mr-3 h-5 w-5" />}
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
    <header className={cn(
        "sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        isAutoHideEnabled && areMenusHiddenActually && 'menu-auto-hidden-top' // Apply auto-hide class
      )}>
      <div className="container-wide flex h-20 items-center justify-between">
        <div className="flex items-center">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden mr-2 h-16 w-16">
                <Icons.AnimatedMenuIcon className="h-8 w-8" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full max-w-xs sm:max-w-sm bg-background p-0 flex flex-col">
              <SheetHeader className="p-6 pb-2 border-b mb-2 flex-shrink-0">
                  <SheetTitle className="sr-only">Main Navigation Menu</SheetTitle>
                  <Link href="/" className="mb-4 flex items-center gap-2 self-start" onClick={() => setIsMobileMenuOpen(false)}>
                    {isLoadingSettings ? <Loader2 className="h-7 w-7 animate-spin text-primary"/> : headerLogoUrl ? (
                        <Image src={headerLogoUrl} alt={`${displaySiteTitle} Logo`} width={28} height={28} className="object-contain h-7 w-auto"/>
                    ) : (
                        <Icons.Logo className="h-7 w-7 text-primary" />
                    )}
                    {displaySiteTitle && (
                      <span 
                        className="font-bold text-lg text-foreground" 
                        dangerouslySetInnerHTML={{ __html: displaySiteTitle }}
                      />
                    )}
                  </Link>
              </SheetHeader>
              <ScrollArea className="flex-grow overflow-y-auto">
                <div className="p-6">
                  <nav className="flex flex-col space-y-4">
                    {mobileNavLinks}
                    {isAuthenticated && (
                      <div className="pt-4 border-t border-border/60">
                        <p className="text-sm font-medium text-muted-foreground mb-2">My Account</p>
                        {userNavItems.map(item => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center py-2 text-base font-medium text-foreground/80 hover:text-primary header-link-pulse"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            {item.icon && <item.icon className="mr-3 h-5 w-5" />}
                            {item.title}
                          </Link>
                        ))}
                        {user?.roles?.includes('affiliate') && (
                          <Link
                            href="/affiliate-portal"
                            className="flex items-center py-2 text-base font-medium text-foreground/80 hover:text-primary header-link-pulse"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <Briefcase className="mr-3 h-5 w-5" />
                            Affiliate Portal
                          </Link>
                        )}
                        {user?.roles?.includes('admin') && (
                          <Link
                            href="/admin"
                            className="flex items-center py-2 text-base font-medium text-primary hover:text-primary/80 header-link-pulse font-semibold"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <LayoutDashboard className="mr-3 h-5 w-5" />
                            Admin Panel
                          </Link>
                        )}
                        <Button variant="ghost" onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="w-full justify-start mt-3 px-0 text-base text-foreground/80 hover:text-primary">
                          <LogOut className="mr-3 h-5 w-5" /> Log out
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
              </ScrollArea>
            </SheetContent>
          </Sheet>

          <Link href="/" className="flex items-center space-x-2">
            {isLoadingSettings ? <Loader2 className="h-8 w-8 animate-spin text-primary"/> : headerLogoUrl ? (
                <Image src={headerLogoUrl} alt={`${displaySiteTitle} Logo`} width={32} height={32} className="object-contain h-8 w-auto"/>
            ) : (
                <Icons.Logo className="h-8 w-8 text-primary" />
            )}
            {displaySiteTitle && (
              <span 
                className="hidden lg:inline-block font-semibold text-xl text-foreground"
                dangerouslySetInnerHTML={{ __html: displaySiteTitle }}
              />
            )}
          </Link>
        </div>

        <div className="flex items-center space-x-1 md:space-x-2">
          <Button variant="ghost" size="icon" className="hidden md:inline-flex" asChild>
            <Link href="/search" aria-label="Search Page">
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Link>
          </Button>
          
          {mounted && (
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={toggleAutoHideEnabled} aria-label={isAutoHideEnabled ? 'Disable Auto-hide Menus' : 'Enable Auto-hide Menus'}>
                    {isAutoHideEnabled ? <TimerOff className="h-5 w-5" /> : <Timer className="h-5 w-5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{isAutoHideEnabled ? 'Disable Auto-hide Menus' : 'Enable Auto-hide Menus'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {mounted && <FullscreenToggleButton />}
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
