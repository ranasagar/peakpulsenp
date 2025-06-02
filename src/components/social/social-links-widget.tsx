
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Share2, X, Facebook, Instagram, MessageSquare, Loader2 } from 'lucide-react';
import { InteractiveExternalLink } from '@/components/interactive-external-link';
import type { SiteSettings, SocialLink as SocialLinkType } from '@/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface SocialLinkConfig {
  platformName: string;
  icon: React.ElementType;
  url?: string;
  label: string;
}

export function SocialLinksWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [configuredLinks, setConfiguredLinks] = useState<SocialLinkConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/settings');
        if (!response.ok) {
          throw new Error('Failed to fetch site settings for social links.');
        }
        const settings: SiteSettings = await response.json();
        const socialLinksFromSettings = settings.socialLinks || [];

        const platformsToShow: SocialLinkConfig[] = [
          { platformName: 'facebook', icon: Facebook, label: 'Facebook' },
          { platformName: 'instagram', icon: Instagram, label: 'Instagram' },
          { platformName: 'messenger', icon: MessageSquare, label: 'Messenger' },
        ];

        const links = platformsToShow.map(p => {
          const foundLink = socialLinksFromSettings.find(
            sl => sl.platform.toLowerCase() === p.platformName.toLowerCase()
          );
          return { ...p, url: foundLink?.url };
        }).filter(p => p.url); // Only keep links that have a URL configured

        setConfiguredLinks(links);

      } catch (error) {
        console.error("SocialLinksWidget: Error fetching settings:", error);
        toast({
          title: "Error",
          description: "Could not load social media links.",
          variant: "destructive",
        });
        setConfiguredLinks([]); // Set to empty if error
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [toast]);

  if (isLoading) {
    return (
      <Button
        variant="secondary"
        size="lg"
        className="fixed bottom-6 left-6 rounded-full shadow-xl p-4 h-16 w-16 z-50"
        aria-label="Loading social links"
        disabled
      >
        <Loader2 className="h-7 w-7 animate-spin" />
      </Button>
    );
  }

  if (!isLoading && configuredLinks.length === 0) {
    // If no relevant links are configured, don't show the widget at all
    return null;
  }

  return (
    <>
      <Button
        variant={isOpen ? "outline" : "secondary"}
        size="lg"
        className={cn(
            "fixed bottom-6 left-6 rounded-full shadow-xl p-0 h-16 w-16 z-50 transition-all duration-300 ease-in-out",
            "hover:scale-110 active:scale-100",
            isOpen && "bg-card border-primary ring-2 ring-primary"
        )}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close social media links" : "Open social media links"}
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="h-7 w-7" /> : <Share2 className="h-7 w-7" />}
      </Button>

      {isOpen && (
        <Card className="fixed bottom-24 left-6 w-full max-w-xs z-40 shadow-2xl rounded-xl border-border/80 bg-card animate-in fade-in-0 zoom-in-90 slide-in-from-bottom-5 duration-300">
          <CardHeader className="p-4 border-b">
            <CardTitle className="text-md font-semibold text-center">Connect With Us</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {configuredLinks.map(link => {
              const IconComponent = link.icon;
              return (
                <InteractiveExternalLink
                  key={link.platformName}
                  href={link.url!} // url is guaranteed by filter
                  className="flex items-center p-3 -m-1 rounded-lg hover:bg-muted transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                  showDialog={true} // Use global setting for dialog
                >
                  <IconComponent className="h-6 w-6 mr-3 text-primary" />
                  <span className="text-sm font-medium text-foreground">{link.label}</span>
                </InteractiveExternalLink>
              );
            })}
            {configuredLinks.length === 0 && !isLoading && (
                <p className="text-sm text-muted-foreground text-center py-2">
                    Social media links not configured. Please add them in Admin &gt; Settings.
                </p>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
