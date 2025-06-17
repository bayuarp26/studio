"use client";
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface NavLink {
  id: string;
  label: string;
  href: string;
}

interface NavigationProps {
  activeSection: string;
  navLinks: NavLink[];
}

export default function Navigation({ activeSection, navLinks }: NavigationProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-md shadow-md z-50 h-16 flex items-center">
      <div className="container mx-auto flex justify-center items-center space-x-4 sm:space-x-6 px-4">
        {navLinks.map((link) => (
          <Link
            key={link.id}
            href={link.href}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById(link.id)?.scrollIntoView({ behavior: 'smooth' });
            }}
            className={cn(
              'py-2 text-sm sm:text-base transition-all duration-300 ease-in-out relative group',
              activeSection === link.id
                ? 'font-semibold text-primary'
                : 'text-muted-foreground hover:text-primary'
            )}
            aria-current={activeSection === link.id ? 'page' : undefined}
          >
            {link.label}
            <span
              className={cn(
                'absolute bottom-0 left-0 w-full h-0.5 bg-primary transform scale-x-0 transition-transform duration-300 ease-in-out group-hover:scale-x-100',
                activeSection === link.id ? 'scale-x-100' : 'scale-x-0'
              )}
            />
          </Link>
        ))}
      </div>
    </nav>
  );
}
