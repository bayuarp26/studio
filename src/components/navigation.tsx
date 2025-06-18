
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
  const navElementRef = useRef<HTMLElement>(null);
  const [currentNavHeight, setCurrentNavHeight] = useState(0);

  const initials = profileName.split(' ').map(n => n[0]).join('').toUpperCase();

  useEffect(() => {
    if (navElementRef.current) {
      setCurrentNavHeight(navElementRef.current.offsetHeight);
    }
  }, []);

  useEffect(() => {
    if (currentNavHeight === 0) return; // Jangan setup observer jika tinggi nav belum diketahui

    const heroNameElement = document.getElementById('hero-main-name');
    if (!heroNameElement) {
      console.warn("Elemen 'hero-main-name' tidak ditemukan untuk IntersectionObserver.");
      return;
    }

    const observerOffset = currentNavHeight -1; // Trigger saat 1px nama mulai tertutup nav

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsHeroNameVisible(entry.isIntersecting);
      },
      {
        rootMargin: `-${observerOffset}px 0px 0px 0px`,
        threshold: 0, // Trigger segera setelah elemen melewati batas
      }
    );

    observer.observe(heroNameElement);

    return () => {
      if (heroNameElement) {
        observer.unobserve(heroNameElement);
      }
    };
  }, [currentNavHeight]); // Hanya bergantung pada currentNavHeight

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = -(currentNavHeight > 0 ? currentNavHeight : 80) + 1;
      const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <nav
      ref={navElementRef}
      className="fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-md shadow-md z-50 h-16 md:h-20 flex items-center border-b border-border"
    >
      <div className="container mx-auto flex justify-between items-center px-4 sm:px-6 lg:px-8">
        <Link
          href="#hero"
          onClick={(e) => handleLinkClick(e, "hero")}
          className="text-xl font-bold text-primary hover:text-primary/80 transition-colors flex items-center"
          aria-label="Kembali ke atas"
        >
          <div className="relative h-7 w-auto flex items-center overflow-hidden">
            {/* Inisial "WP" - Ditampilkan saat nama di hero section TERLIHAT */}
            <span
              aria-hidden={!isHeroNameVisible}
              className={cn(
                "absolute inset-x-0 flex items-center justify-start transition-all duration-300 ease-in-out whitespace-nowrap",
                isHeroNameVisible
                  ? "opacity-100 translate-y-0" // Terlihat, di tempat
                  : "opacity-0 -translate-y-full" // Tersembunyi, slide ke atas keluar
              )}
            >
              {initials}
            </span>
            {/* Nama Lengkap "Wahyu Pratomo" - Ditampilkan saat nama di hero section TIDAK TERLIHAT (tertutup) */}
            <span
              aria-hidden={isHeroNameVisible}
              className={cn(
                "absolute inset-x-0 flex items-center justify-start transition-all duration-300 ease-in-out whitespace-nowrap",
                !isHeroNameVisible
                  ? "opacity-100 translate-y-0" // Terlihat, di tempat
                  : "opacity-0 translate-y-full" // Tersembunyi, slide dari bawah masuk
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
