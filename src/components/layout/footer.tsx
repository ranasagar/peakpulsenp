
"use client";

import Link from 'next/link';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Facebook, Instagram, Twitter, Youtube, Send, Shield } from 'lucide-react';
import { NewsletterSignupForm } from '@/components/forms/newsletter-signup-form';
import { useAuth } from '@/hooks/use-auth';
import { InteractiveExternalLink } from '@/components/interactive-external-link';


const footerNavs = [
  {
    label: 'Company',
    items: [
      { href: '/our-story', name: 'Our Story' },
      { href: '/sustainability', name: 'Sustainability' },
      { href: '/careers', name: 'Careers' },
    ],
  },
  {
    label: 'Support',
    items: [
      { href: '/contact', name: 'Contact Us' },
      { href: '/faq', name: 'FAQs' },
      { href: '/shipping-returns', name: 'Shipping & Returns' },
    ],
  },
  {
    label: 'Legal',
    items: [
      { href: '/privacy-policy', name: 'Privacy Policy' },
      { href: '/terms-of-service', name: 'Terms of Service' },
      { href: '/accessibility', name: 'Accessibility' },
    ],
  },
];

const socialLinks = [
  { href: 'https://facebook.com/peakpulse', label: 'Facebook', icon: Facebook },
  { href: 'https://instagram.com/peakpulsenp', label: 'Instagram', icon: Instagram },
  { href: 'https://twitter.com/peakpulse', label: 'Twitter', icon: Twitter },
  { href: 'https://youtube.com/peakpulse', label: 'YouTube', icon: Youtube },
];

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { user } = useAuth(); 

  return (
    <footer className="bg-card text-card-foreground border-t border-border/60">
      <div className="container-wide section-padding pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand Info and Newsletter */}
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

          {/* Footer Navigation Links */}
          {footerNavs.map((nav) => (
            <div key={nav.label}>
              <h3 className="text-md font-semibold mb-4">{nav.label}</h3>
              <ul className="space-y-3">
                {nav.items.map((item) => (
                  <li key={item.name}>
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

        {/* Bottom Bar: Copyright and Social Links */}
        <div className="mt-16 pt-8 border-t border-border/60 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-xs text-muted-foreground text-center md:text-left">
            <p>&copy; {currentYear} Peak Pulse. All rights reserved. Based in Kathmandu, Nepal.</p>
            {user && user.roles && user.roles.includes('admin') && ( 
               <Link href="/admin" className="mt-1 text-primary hover:underline flex items-center justify-center md:justify-start">
                <Shield className="mr-1 h-3 w-3" /> Admin Panel
              </Link>
            )}
          </div>
          <div className="flex space-x-4">
            {socialLinks.map((social) => (
              <InteractiveExternalLink
                key={social.label}
                href={social.href}
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label={social.label}
                showDialog={true} // Enable dialog for social links
              >
                <social.icon className="h-5 w-5" />
              </InteractiveExternalLink>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
