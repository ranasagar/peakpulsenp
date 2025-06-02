
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessagesSquare, X, Instagram, MessageCircle, Facebook, Loader2 } from 'lucide-react'; 
import { InteractiveExternalLink } from '@/components/interactive-external-link';
import type { SiteSettings } from '@/types'; 
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface MessagingPlatformConfig {
  platformKey: 'whatsapp' | 'instagram' | 'messenger';
  icon: React.ElementType;
  label: string;
  urlPattern: (id: string) => string;
  settingField: keyof Pick<SiteSettings, 'whatsappNumber' | 'instagramUsername' | 'facebookUsernameOrPageId'>;
  idTransform?: (id: string) => string; 
}

const messagingPlatforms: MessagingPlatformConfig[] = [
  {
    platformKey: 'whatsapp',
    icon: MessageCircle, 
    label: 'WhatsApp',
    urlPattern: (id) => `https://wa.me/${id}`,
    settingField: 'whatsappNumber',
    idTransform: (id) => id.replace(/\D/g, ''), 
  },
  {
    platformKey: 'instagram',
    icon: Instagram,
    label: 'Instagram DM',
    urlPattern: (id) => `https://ig.me/m/${id}`,
    settingField: 'instagramUsername',
  },
  {
    platformKey: 'messenger',
    icon: Facebook, // Using Facebook icon for Messenger for now, could be MessageSquare too
    label: 'Messenger',
    urlPattern: (id) => `https://m.me/${id}`,
    settingField: 'facebookUsernameOrPageId',
  },
];

export function SocialMessagingWidget() { 
  const [isOpen, setIsOpen] = useState(false);
  const [activeMessagingLinks, setActiveMessagingLinks] = useState<(MessagingPlatformConfig & { url: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/settings');
        if (!response.ok) {
          throw new Error('Failed to fetch site settings for messaging widget.');
        }
        const settings: SiteSettings = await response.json();
        
        const configuredPlatforms = messagingPlatforms.map(platform => {
          const contactId = settings[platform.settingField];
          if (contactId && contactId.trim() !== '') {
            const finalId = platform.idTransform ? platform.idTransform(contactId) : contactId;
            return { ...platform, url: platform.urlPattern(finalId) };
          }
          return null;
        }).filter(Boolean) as (MessagingPlatformConfig & { url: string })[];

        setActiveMessagingLinks(configuredPlatforms);

      } catch (error) {
        console.error("SocialMessagingWidget: Error fetching settings:", error);
        toast({
          title: "Error",
          description: "Could not load messaging contact links.",
          variant: "destructive",
        });
        setActiveMessagingLinks([]);
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
        aria-label="Loading messaging links"
        disabled
      >
        <Loader2 className="h-7 w-7 animate-spin" />
      </Button>
    );
  }

  if (!isLoading && activeMessagingLinks.length === 0) {
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
        aria-label={isOpen ? "Close messaging options" : "Open messaging options"}
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="h-7 w-7" /> : <MessagesSquare className="h-7 w-7" />}
      </Button>

      {isOpen && (
        <Card className="fixed bottom-24 left-6 w-full max-w-xs z-40 shadow-2xl rounded-xl border-border/80 bg-card animate-in fade-in-0 zoom-in-90 slide-in-from-bottom-5 duration-300">
          <CardHeader className="p-4 border-b">
            <CardTitle className="text-md font-semibold text-center">Message Us</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {activeMessagingLinks.map(link => {
              const IconComponent = link.icon;
              return (
                <InteractiveExternalLink
                  key={link.platformKey}
                  href={link.url!} 
                  className="flex items-center p-3 -m-1 rounded-lg hover:bg-muted transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                  showDialog={true} 
                >
                  <IconComponent className="h-6 w-6 mr-3 text-primary" />
                  <span className="text-sm font-medium text-foreground">{link.label}</span>
                </InteractiveExternalLink>
              );
            })}
            {activeMessagingLinks.length === 0 && !isLoading && (
                <p className="text-sm text-muted-foreground text-center py-2">
                    Messaging links not configured. Please add them in Admin &gt; Settings.
                </p>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
