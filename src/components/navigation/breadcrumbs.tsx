
"use client";

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';
import { cn } from '@/lib/utils';

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn("text-sm text-muted-foreground", className)}>
      <ol className="flex items-center space-x-1.5">
        {items.map((item, index) => (
          <li key={item.name} className="flex items-center">
            {item.href ? (
              <Link
                href={item.href}
                className="hover:text-primary transition-colors"
              >
                {item.name}
              </Link>
            ) : (
              <span className="font-medium text-foreground">{item.name}</span>
            )}
            {index < items.length - 1 && (
              <ChevronRight className="h-4 w-4 mx-1.5 shrink-0" />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
