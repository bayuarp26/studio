
"use client";
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Menu } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';


interface NavLink {
  id: string;
  label: string;
  href: string;
}

interface NavigationProps {
  activeSection: string;
  navLinks: NavLink[];
  profileName: string;
}

export default function Navigation({ activeSection, navLinks, profileName }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const initials = profileName.split(' ').map(n => n[0]).join('').toUpperCase();

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false); // Close mobile menu on link click
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-md shadow-md z-50 h-16 md:h-20 flex items-center">
      <div className="container mx-auto flex justify-between items-center px-4 sm:px-6 lg:px-8">
        <Link href="#hero" onClick={(e) => handleLinkClick(e, "hero")} className="text-xl font-bold text-primary hover:text-primary/80 transition-colors">
          {initials}
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-4 sm:space-x-6">
          {navLinks.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              onClick={(e) => handleLinkClick(e, link.id)}
              className={cn(
                'py-2 text-sm sm:text-base transition-colors duration-200 ease-in-out',
                activeSection === link.id
                  ? 'font-semibold text-primary'
                  : 'text-muted-foreground hover:text-primary'
              )}
              aria-current={activeSection === link.id ? 'page' : undefined}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Mobile Navigation Trigger */}
        <div className="md:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Buka menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px] bg-background p-6">
              <div className="flex flex-col space-y-6 mt-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.id}
                    href={link.href}
                    onClick={(e) => handleLinkClick(e, link.id)}
                    className={cn(
                      'py-2 text-lg transition-colors duration-200 ease-in-out',
                      activeSection === link.id
                        ? 'font-semibold text-primary'
                        : 'text-foreground hover:text-primary'
                    )}
                    aria-current={activeSection === link.id ? 'page' : undefined}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
