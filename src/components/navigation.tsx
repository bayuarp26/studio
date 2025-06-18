
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

const NAV_VIEWPORT_OFFSET = 80; // Tinggi navbar dalam piksel (md:h-20 -> 80px)

export default function Navigation({ activeSection, navLinks, profileName }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isHeroNameVisible, setIsHeroNameVisible] = useState(true); // Default true, asumsi hero name terlihat saat awal
  const initials = profileName.split(' ').map(n => n[0]).join('').toUpperCase();

  useEffect(() => {
    const heroNameElement = document.getElementById('hero-main-name');
    if (!heroNameElement) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsHeroNameVisible(entry.isIntersecting);
      },
      {
        rootMargin: `-${NAV_VIEWPORT_OFFSET - 1}px 0px 0px 0px`, // Trigger tepat saat bagian atas hero name menyentuh bawah navbar
        threshold: 0, // Segera trigger saat persentuhan terjadi
      }
    );

    observer.observe(heroNameElement);

    return () => {
      if (heroNameElement) {
        observer.unobserve(heroNameElement);
      }
    };
  }, []);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
        // Offset sedikit kurang dari tinggi navbar agar bagian atas section terlihat pas di bawah navbar
        const yOffset = -NAV_VIEWPORT_OFFSET + 1; 
        const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-md shadow-md z-50 h-16 md:h-20 flex items-center border-b border-border">
      <div className="container mx-auto flex justify-between items-center px-4 sm:px-6 lg:px-8">
        <Link
          href="#hero"
          onClick={(e) => handleLinkClick(e, "hero")}
          className="text-xl font-bold text-primary hover:text-primary/80 transition-colors flex items-center"
        >
          <div className="relative h-7 flex items-center overflow-hidden"> {/* Sesuaikan tinggi jika font lebih besar */}
            {/* Tampilkan Inisial (WP) jika nama hero terlihat */}
            <span
              className={cn(
                "absolute inset-x-0 flex items-center justify-start transition-all duration-300 ease-in-out whitespace-nowrap",
                isHeroNameVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 -translate-y-full"
              )}
              aria-hidden={!isHeroNameVisible}
            >
              {initials}
            </span>
            {/* Tampilkan Nama Lengkap jika nama hero TIDAK terlihat (sudah di-scroll) */}
            <span
              className={cn(
                "absolute inset-x-0 flex items-center justify-start transition-all duration-300 ease-in-out whitespace-nowrap",
                !isHeroNameVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-full"
              )}
              aria-hidden={isHeroNameVisible}
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
