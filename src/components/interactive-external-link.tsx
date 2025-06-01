
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ExternalLink, Loader2 } from 'lucide-react';
import type { SiteSettings } from '@/types';

interface InteractiveExternalLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
  showDialog?: boolean; // This is the prop passed by parent components
}

export function InteractiveExternalLink({
  href,
  children,
  className,
  showDialog, // Explicitly destructure `showDialog` here
  ...rest // All other props (like `aria-label`, `target`, etc.) go into `rest`
}: InteractiveExternalLinkProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [targetUrl, setTargetUrl] = useState('');
  const [globalShowWarning, setGlobalShowWarning] = useState<boolean | undefined>(undefined);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoadingSettings(true);
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const settings: SiteSettings = await response.json();
          setGlobalShowWarning(settings.showExternalLinkWarning);
        } else {
          console.warn("InteractiveExternalLink: Failed to fetch site settings, defaulting to show warning.");
          setGlobalShowWarning(true);
        }
      } catch (error) {
        console.error("InteractiveExternalLink: Error fetching site settings:", error);
        setGlobalShowWarning(true);
      } finally {
        setIsLoadingSettings(false);
      }
    };
    fetchSettings();
  }, []);

  const getHostname = (url: string): string => {
    try {
      return new URL(url).hostname;
    } catch (e) {
      return url;
    }
  };

  const hostname = getHostname(href);

  // Determine if dialog should be shown based on prop and global setting
  const determineDialogBehavior = (): boolean => {
    if (isLoadingSettings) return true; // Default to showing dialog while settings load (for safety)
    // `showDialog` prop takes precedence:
    if (showDialog === false) return false; // Prop explicitly disables dialog
    if (showDialog === true) return true;   // Prop explicitly enables dialog
    // If `showDialog` prop is undefined, use the global setting.
    // Default to true if global setting is also undefined (not yet fetched or error).
    return globalShowWarning === undefined ? true : globalShowWarning;
  };

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!determineDialogBehavior()) {
      // If dialog is not to be shown, let the default link behavior occur.
      // No event.preventDefault() means the link will navigate as usual.
      return;
    }
    // If dialog IS to be shown, prevent default navigation and open dialog.
    event.preventDefault();
    setTargetUrl(href);
    setIsDialogOpen(true);
  };

  const handleProceedNewTab = () => {
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
    setIsDialogOpen(false);
  };

  const handleProceedNewWindow = () => {
    window.open(targetUrl, '_blank', 'noopener,noreferrer,width=800,height=600,resizable,scrollbars');
    setIsDialogOpen(false);
  };

  return (
    <>
      {/* `showDialog` is destructured above, so it is NOT in `...rest` here */}
      <a href={href} onClick={handleClick} className={className} {...rest}>
        {children}
      </a>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <ExternalLink className="mr-2 h-5 w-5 text-primary" />
              Leaving Peak Pulse
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-2">
              {/* Show loading only if global settings are loading AND showDialog prop was not explicitly set */}
              {isLoadingSettings && showDialog === undefined ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Loading settings...</span>
                </div>
              ) : (
                <>
                  You are about to navigate to an external website:
                  <br />
                  <strong className="text-foreground break-all">{hostname}</strong>
                  <br /><br />
                  Peak Pulse is not responsible for the content of external sites. How would you like to proceed?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {/* Show tip and footer only if settings are not loading (or if showDialog prop overrides) */}
          {!(isLoadingSettings && showDialog === undefined) && (
            <>
              <div className="text-xs text-muted-foreground mt-2 p-3 bg-muted/50 rounded-md">
                <strong>Tip:</strong> To open this link in an incognito/private window, you can right-click the link (or one of the 'Open' buttons below after confirming) and choose that option from your browser's context menu.
              </div>
              <AlertDialogFooter className="gap-2 sm:gap-0">
                <AlertDialogCancel>Stay on Page</AlertDialogCancel>
                <Button variant="outline" onClick={handleProceedNewWindow}>
                  Open in New Window
                </Button>
                <AlertDialogAction onClick={handleProceedNewTab}>
                  Open in New Tab
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
