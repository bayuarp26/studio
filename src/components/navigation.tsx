
"use client";
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Menu } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
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
  const [isHeroNameVisible, setIsHeroNameVisible] = useState(true);
  const navElementRef = useRef<HTMLElement>(null); // Ref for the nav element
  const [currentNavHeight, setCurrentNavHeight] = useState(0); // Store dynamic nav height

  const initials = profileName.split(' ').map(n => n[0]).join('').toUpperCase();

  // Get actual navbar height after mount
  useEffect(() => {
    if (navElementRef.current) {
      setCurrentNavHeight(navElementRef.current.offsetHeight);
    }
  }, []);

  // IntersectionObserver logic
  useEffect(() => {
    // Only run if currentNavHeight has been set
    if (currentNavHeight === 0) return;

    const heroNameElement = document.getElementById('hero-main-name');
    if (!heroNameElement) {
      console.warn("Hero name element 'hero-main-name' not found for IntersectionObserver.");
      return;
    }

    // Correct offset for rootMargin: trigger when hero name is 1px from being fully covered
    const observerOffset = currentNavHeight - 1;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsHeroNameVisible(entry.isIntersecting);
      },
      {
        rootMargin: `-${observerOffset}px 0px 0px 0px`,
        threshold: 0, // Trigger as soon as the element is even 1px past the margin
      }
    );

    observer.observe(heroNameElement);

    return () => {
      if (heroNameElement) {
        observer.unobserve(heroNameElement);
      }
    };
  }, [currentNavHeight, profileName]); // Rerun observer logic if nav height changes

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      // Use dynamic nav height for scroll offset, fallback if not ready
      const yOffset = -(currentNavHeight > 0 ? currentNavHeight : 80) + 1; 
      const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <nav 
      ref={navElementRef} // Assign ref here
      className="fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-md shadow-md z-50 h-16 md:h-20 flex items-center border-b border-border"
    >
      <div className="container mx-auto flex justify-between items-center px-4 sm:px-6 lg:px-8">
        <Link
          href="#hero"
          onClick={(e) => handleLinkClick(e, "hero")}
          className="text-xl font-bold text-primary hover:text-primary/80 transition-colors flex items-center"
          aria-label="Kembali ke atas"
        >
          {/* Container for animated text. w-auto allows it to size to content */}
          <div className="relative h-7 w-auto flex items-center overflow-hidden">
            {/* Span for Initials "WP" - Shown when hero name IS visible */}
            <span
              aria-hidden={!isHeroNameVisible}
              className={cn(
                "absolute inset-x-0 flex items-center justify-start transition-all duration-300 ease-in-out whitespace-nowrap",
                isHeroNameVisible
                  ? "opacity-100 translate-y-0" // Visible, in place
                  : "opacity-0 -translate-y-full" // Hidden, slides UP and out
              )}
            >
              {initials}
            </span>
            {/* Span for Full Name "Wahyu Pratomo" - Shown when hero name IS NOT visible */}
            <span
              aria-hidden={isHeroNameVisible}
              className={cn(
                "absolute inset-x-0 flex items-center justify-start transition-all duration-300 ease-in-out whitespace-nowrap",
                !isHeroNameVisible
                  ? "opacity-100 translate-y-0" // Visible, in place
                  : "opacity-0 translate-y-full" // Hidden, slides IN from bottom
              )}
            >
              {profileName}
            </span>
          </div>
        </Link>

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

        <div className="md:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-foreground hover:text-primary">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Buka menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px] bg-background p-6 border-l border-border">
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
