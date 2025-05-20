
"use client";

import React, { useState } from 'react';
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
import { ExternalLink } from 'lucide-react';

interface InteractiveExternalLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
  showDialog?: boolean; // Prop to control if dialog is shown, defaults to true
}

export function InteractiveExternalLink({
  href,
  children,
  className,
  showDialog = true,
  ...props
}: InteractiveExternalLinkProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [targetUrl, setTargetUrl] = useState('');

  const getHostname = (url: string): string => {
    try {
      return new URL(url).hostname;
    } catch (e) {
      return url; // Return original URL if parsing fails
    }
  };

  const hostname = getHostname(href);

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!showDialog) {
      // If dialog is disabled, behave like a normal external link
      // Ensure target="_blank" is handled by the <a> tag itself if passed via props
      return;
    }
    event.preventDefault();
    setTargetUrl(href);
    setIsDialogOpen(true);
  };

  const handleProceedNewTab = () => {
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
    setIsDialogOpen(false);
  };

  const handleProceedNewWindow = () => {
    // Note: Browsers might still open this as a new tab depending on settings.
    window.open(targetUrl, '_blank', 'noopener,noreferrer,width=800,height=600,resizable,scrollbars');
    setIsDialogOpen(false);
  };

  if (!showDialog) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} {...props}>
        {children}
      </a>
    );
  }

  return (
    <>
      <a href={href} onClick={handleClick} className={className} {...props}>
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
              You are about to navigate to an external website:
              <br />
              <strong className="text-foreground break-all">{hostname}</strong>
              <br /><br />
              Peak Pulse is not responsible for the content of external sites. How would you like to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
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
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
