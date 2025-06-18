
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
import type { PortfolioDataType } from './page'; // Menggunakan PortfolioDataType

interface PortfolioContentProps {
  portfolioData: PortfolioDataType; // Menggunakan PortfolioDataType
}

const NAV_HEIGHT_OFFSET = 70; 

export default function PortfolioContent({ portfolioData }: PortfolioContentProps) {
  const [activeSection, setActiveSection] = useState("hero");
  const sectionRefs = useRef<{[key: string]: HTMLElement | null}>({});

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
    const scrollPosition = window.scrollY + NAV_HEIGHT_OFFSET + window.innerHeight / 3;
    let currentSection = "hero";

    for (const sectionId of allSectionIds) {
      const element = document.getElementById(sectionId);
      if (element) {
         sectionRefs.current[sectionId] = element;
        if (element.offsetTop <= scrollPosition) {
          if (element.offsetTop + element.offsetHeight > scrollPosition) {
             currentSection = sectionId;
          } else if (scrollPosition >= document.body.scrollHeight - window.innerHeight - NAV_HEIGHT_OFFSET) { 
             currentSection = allSectionIds[allSectionIds.length -1];
          } else {
            currentSection = sectionId;
          }
        } else {
          if (allSectionIds.indexOf(sectionId) === 0 && currentSection === "hero") break; 
          if (currentSection !== "hero" && allSectionIds.indexOf(currentSection) < allSectionIds.indexOf(sectionId)) break;
        }
      }
    }
    setActiveSection(currentSection);
  }, [allSectionIds]);

  useEffect(() => {
    allSectionIds.forEach(id => {
      sectionRefs.current[id] = document.getElementById(id);
    });
    
    handleScroll(); 
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll, allSectionIds]);

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
      <main className="flex-grow pt-16 md:pt-20">
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
