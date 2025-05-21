
"use client";

import Link from 'next/link';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Facebook, Instagram, Twitter, Youtube, Send, Shield, ListChecks, Loader2 } from 'lucide-react';
import { NewsletterSignupForm } from '@/components/forms/newsletter-signup-form';
import { useAuth } from '@/hooks/use-auth';
import { InteractiveExternalLink } from '@/components/interactive-external-link';
import { useState, useEffect } from 'react';
import type { SiteSettings, SocialLink as SocialLinkType, FooterContentData } from '@/types';


const defaultSocialLinks: SocialLinkType[] = [
  { platform: 'Facebook', url: 'https://facebook.com/peakpulse' },
  { platform: 'Instagram', url: 'https://instagram.com/peakpulsenp' },
  { platform: 'Twitter', url: 'https://twitter.com/peakpulse' },
  // { platform: 'YouTube', url: 'https://youtube.com/peakpulse' }, // Removed to match existing JSON
];

const socialIcons: { [key: string]: React.ElementType } = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  youtube: Youtube,
};


export function Footer() {
  const { user } = useAuth(); 
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [footerContent, setFooterContent] = useState<FooterContentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [settingsRes, footerRes] = await Promise.all([
          fetch('/api/settings'),
          fetch('/api/content/footer')
        ]);

        if (settingsRes.ok) {
          const settingsData: SiteSettings = await settingsRes.json();
          setSiteSettings(settingsData);
        } else {
          console.warn("Footer: Failed to fetch site settings, using default social links.");
          setSiteSettings({ socialLinks: defaultSocialLinks } as SiteSettings);
        }

        if (footerRes.ok) {
          const footerData: FooterContentData = await footerRes.json();
          setFooterContent(footerData);
        } else {
          console.warn("Footer: Failed to fetch footer content, using defaults.");
          // Set a default structure for footerContent if fetch fails
          setFooterContent({
            copyrightText: "© {currentYear} Peak Pulse. All rights reserved.",
            navigationSections: [
              { id: "company-fallback", label: "Company", items: [{ id: "os-fb", name: "Our Story", href: "/our-story" }] },
            ]
          });
        }
      } catch (error) {
        console.error("Footer: Error fetching data:", error);
        setSiteSettings({ socialLinks: defaultSocialLinks } as SiteSettings);
        setFooterContent({
            copyrightText: "© {currentYear} Peak Pulse. All rights reserved.",
            navigationSections: []
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);
  
  const displayedSocialLinks = siteSettings?.socialLinks && siteSettings.socialLinks.length > 0 
    ? siteSettings.socialLinks 
    : defaultSocialLinks;

  const currentYear = new Date().getFullYear();
  const copyrightText = footerContent?.copyrightText?.replace('{currentYear}', currentYear.toString()) || `© ${currentYear} Peak Pulse. All rights reserved.`;

  return (
    <footer className="bg-card text-card-foreground border-t border-border/60">
      <div className="container-wide section-padding pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          <div className="md:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-block mb-6">
              <div className="flex items-center space-x-2">
                <Icons.Logo className="h-8 w-8 text-primary" />
                <span className="font-semibold text-xl">Peak Pulse</span>
              </div>
            </Link>
            <p className="text-sm text-muted-foreground mb-6">
              Blending traditional Nepali craftsmanship with contemporary streetwear aesthetics.
            </p>
            <h3 className="text-md font-semibold mb-3">Stay Connected</h3>
            <NewsletterSignupForm className="flex-col sm:flex-col !items-start !max-w-none !mx-0 sm:gap-2" />
          </div>

          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={`skel-nav-${i}`}>
                <div className="h-6 w-1/2 bg-muted rounded mb-4"></div>
                <ul className="space-y-3">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <li key={`skel-item-${j}`} className="h-4 w-3/4 bg-muted rounded"></li>
                  ))}
                </ul>
              </div>
            ))
          ) : (footerContent?.navigationSections || []).map((navSection) => (
            <div key={navSection.id}>
              <h3 className="text-md font-semibold mb-4">{navSection.label}</h3>
              <ul className="space-y-3">
                {(navSection.items || []).map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-border/60 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-xs text-muted-foreground text-center md:text-left">
            <p>{copyrightText}</p>
            {user?.roles?.includes('admin') && ( 
               <Link href="/admin" className="mt-1 text-primary hover:underline flex items-center justify-center md:justify-start">
                <Shield className="mr-1 h-3 w-3" /> Admin Panel
              </Link>
            )}
            {user?.roles?.includes('admin') && ( 
                <Link href="/admin/content/footer" className="mt-1 text-accent hover:underline flex items-center justify-center md:justify-start">
                    <ListChecks className="mr-1 h-3 w-3" /> Edit Footer
                </Link>
            )}
          </div>
          <div className="flex space-x-4">
            {(siteSettings?.socialLinks || defaultSocialLinks).map((social) => {
              const IconComponent = socialIcons[social.platform.toLowerCase()] || Send;
              return (
                <InteractiveExternalLink
                  key={social.platform}
                  href={social.url}
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label={social.platform}
                  showDialog={true}
                >
                  <IconComponent className="h-5 w-5" />
                </InteractiveExternalLink>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
