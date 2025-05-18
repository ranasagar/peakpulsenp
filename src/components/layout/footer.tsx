
"use client";

import Link from 'next/link';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Facebook, Instagram, Twitter, Youtube, Send } from 'lucide-react';
import { NewsletterSignupForm } from '@/components/forms/newsletter-signup-form';


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
  { href: 'https://instagram.com/peakpulse', label: 'Instagram', icon: Instagram },
  { href: 'https://twitter.com/peakpulse', label: 'Twitter', icon: Twitter },
  { href: 'https://youtube.com/peakpulse', label: 'YouTube', icon: Youtube },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

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
          <p className="text-xs text-muted-foreground">
            &copy; {currentYear} Peak Pulse. All rights reserved. Based in Kathmandu, Nepal.
          </p>
          <div className="flex space-x-4">
            {socialLinks.map((social) => (
              <Link
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label={social.label}
              >
                <social.icon className="h-5 w-5" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

    