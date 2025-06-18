
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Navigation from "@/components/navigation";
import HeroSection from "@/components/hero-section";
import AboutSection from "@/components/about-section";
import SkillsSection from "@/components/skills-section";
import ProjectsSection from "@/components/projects-section";
import ContactSection from "@/components/contact-section";
import Footer from "@/components/footer";
import { Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter
} from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import type { PortfolioDataType } from './page'; 

// Konstanta ini digunakan untuk offset saat scroll dan menentukan active section
const NAV_HEIGHT_OFFSET = 80; // Sesuaikan dengan tinggi navbar (md:h-20 -> 80px)

export default function PortfolioContent({ portfolioData }: { portfolioData: PortfolioDataType }) {
  const [activeSection, setActiveSection] = useState("hero");
  // sectionRefs tidak lagi dibutuhkan secara eksplisit di sini karena handleScroll menggunakan getElementById
  // const sectionRefs = useRef<{[key: string]: HTMLElement | null}>({}); 

  const isMobile = useIsMobile();
  const [isDeviceAlertOpen, setIsDeviceAlertOpen] = useState(false);
  const [deviceAlertSessionDismissed, setDeviceAlertSessionDismissed] = useState(false);

  useEffect(() => {
    if (isMobile === true && !deviceAlertSessionDismissed) {
      setIsDeviceAlertOpen(true);
    }
    else if (isMobile === false && isDeviceAlertOpen) {
        setIsDeviceAlertOpen(false);
    }
  }, [isMobile, deviceAlertSessionDismissed, isDeviceAlertOpen]);


  const navLinks = [
    { id: "about", label: "Tentang Saya", href: "#about" },
    { id: "skills", label: "Keahlian", href: "#skills" },
    { id: "projects", label: "Proyek", href: "#projects" },
    { id: "contact", label: "Kontak", href: "#contact" },
  ];
  const allSectionIds = ["hero", ...navLinks.map(link => link.id)];


  const handleScroll = useCallback(() => {
    // Offset sedikit lebih besar dari tinggi navbar untuk memastikan section benar-benar "di bawah" nav
    const scrollPositionWithOffset = window.scrollY + NAV_HEIGHT_OFFSET + 20; 
    let currentSectionId = "hero"; // Default ke hero

    for (const sectionId of allSectionIds) {
      const element = document.getElementById(sectionId);
      if (element) {
        const elementTop = element.offsetTop;
        const elementBottom = elementTop + element.offsetHeight;

        // Jika bagian atas elemen sudah lewat atau sama dengan posisi scroll
        if (elementTop <= scrollPositionWithOffset) {
          // Jika bagian bawah elemen masih di bawah posisi scroll (artinya elemen sedang terlihat)
          if (elementBottom > scrollPositionWithOffset) {
            currentSectionId = sectionId;
            break; // Keluar loop karena section aktif sudah ditemukan
          } else {
            // Jika sudah scroll melewati elemen ini, maka section ini adalah yang terakhir dilewati
            currentSectionId = sectionId; 
          }
        } else {
          // Jika elemen pertama (hero) belum tercapai, jangan ubah dari default "hero"
          // Jika elemen lain belum tercapai, berarti section aktif adalah yang sebelumnya
          break;
        }
      }
    }
     // Khusus untuk kasus jika sudah scroll sampai paling bawah halaman
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 50) { // toleransi 50px
        currentSectionId = allSectionIds[allSectionIds.length - 1]; // Set ke section terakhir
    }


    setActiveSection(currentSectionId);
  }, [allSectionIds]);

  useEffect(() => {
    // Tidak perlu lagi mengisi sectionRefs di sini
    
    handleScroll(); 
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col">
      <Dialog open={isDeviceAlertOpen} onOpenChange={(open) => {
          setIsDeviceAlertOpen(open);
          if (!open) {
              setDeviceAlertSessionDismissed(true);
          }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Smartphone className="mr-2 h-5 w-5" />
              Pengalaman Optimal
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className="py-4 text-muted-foreground">
            Untuk tampilan dan pengalaman pengguna terbaik, kami merekomendasikan membuka situs ini di perangkat PC atau Desktop.
          </DialogDescription>
          <DialogFooter>
            <Button onClick={() => {
                setIsDeviceAlertOpen(false);
                setDeviceAlertSessionDismissed(true);
            }}>Mengerti</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Navigation 
        activeSection={activeSection} 
        navLinks={navLinks} 
        profileName={portfolioData.name}
      />
      <main className="flex-grow pt-16 md:pt-20"> {/* pt-16 (64px) md:pt-20 (80px) sesuai tinggi navbar */}
        <HeroSection
          id="hero"
          name={portfolioData.name}
          title={portfolioData.title}
          tagline={portfolioData.heroTagline}
          imageUrl={portfolioData.heroImageUrl}
          imageHint={portfolioData.heroImageHint}
          socialLinks={portfolioData.socialLinks}
          cvUrl={portfolioData.cvUrl}
        />
        <AboutSection
          id="about"
          title="Tentang Saya"
          imageUrl={portfolioData.about.imageUrl}
          imageHint={portfolioData.about.imageHint}
          paragraphs={portfolioData.about.paragraphs}
          education={portfolioData.about.education}
        />
        <SkillsSection
          id="skills"
          title="Keahlian Utama"
          skills={portfolioData.skills}
        />
        <ProjectsSection
          id="projects"
          title="Proyek Pilihan"
          projects={portfolioData.projects}
        />
        <ContactSection
          id="contact"
          title="Hubungi Saya"
          email={portfolioData.contactEmail}
          socialLinks={portfolioData.socialLinks}
        />
      </main>
      <Footer 
        copyrightName={portfolioData.name} 
        year={portfolioData.copyrightYear}
        socialLinks={portfolioData.socialLinks}
      />
    </div>
  );
}
