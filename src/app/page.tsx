
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


const NAV_HEIGHT_OFFSET = 70; 

export default function PortfolioPage() {
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

  const profileData = {
    name: "Wahyu Pratomo",
    title: "Spesialis Media Sosial | Digital Marketing Expert | Strategi dan Kinerja Pemasaran",
    heroTagline: "Membantu merek berkembang di dunia digital dengan strategi yang data-driven dan konten yang menarik.",
    heroImageUrl: "https://placehold.co/240x240.png",
    heroImageHint: "professional portrait",
    socialLinks: {
      github: "https://github.com/wahyupratomo187",
      linkedin: "https://linkedin.com/in/wahyupratomo",
    },
    cvUrl: "/wahyu-pratomo-cv.pdf", 
    about: {
      imageUrl: "https://placehold.co/600x450.png",
      imageHint: "team collaboration",
      paragraphs: [
        "Wahyu Pratomo adalah seorang Spesialis Media Sosial dengan fokus pada Pemasaran Digital dan Kinerja Pemasaran.",
        "Memiliki pengalaman selama 9 bulan di industri ini, Wahyu suka bekerja dengan merek yang memiliki misi dan berkomitmen untuk merepresentasikan produk secara menarik di media sosial."
      ],
      education: [
        { institution: "Sekolah Tinggi Teknologi Indonesia", detail: "Mahasiswa Tingkat Akhir (2020 - 2025)" },
        { institution: "Harisenin.com", detail: "Lulusan Bootcamp Digital Marketing" }
      ]
    },
    skills: [
      { name: "Pemasaran Digital" },
      { name: "Manajemen Proyek" },
      { name: "Desain Berkelanjutan" },
      { name: "Kolaborasi Tim" },
      { name: "Komunikasi Klien" },
      { name: "SEO" },
      { name: "Content Creation" },
      { name: "Social Media Ads" },
      { name: "Google Analytics" }
    ],
    projects: [
      {
        title: "Kampanye Harisenin.com",
        imageUrl: "https://placehold.co/800x450.png",
        imageHint: "marketing campaign",
        description: "Meningkatkan kesadaran merek dan akuisisi pelanggan untuk Harisenin.com melalui strategi media sosial yang komprehensif. Bertanggung jawab untuk meningkatkan copywriting, hook, dan desain konten yang menarik bagi audiens target.",
        details: ["Tujuan: Meningkatkan kesadaran merek dan produk melalui media sosial.", "Strategi: Meningkatkan copywriting, hook, dan desain konten. Menarik audiens.", "Hasil: Pertumbuhan follower (+30%), jangkauan brand (100.000+), engagement (5%+), leads baru (100+)."],
        tags: ["Social Media", "Copywriting", "Content Strategy", "Campaign Management"],
      },
      {
        title: "Identitas Merek TEMA \"Coffee & Space\"",
        imageUrl: "https://placehold.co/800x450.png",
        imageHint: "brand design",
        description: "Mengembangkan identitas merek yang kuat untuk TEMA \"Coffee & Space\" dengan melakukan analisis pasar mendalam dan riset audiens. Fokus pada penguatan posisi pasar dan pengembangan pesan yang resonan.",
        details: ["Analisis Merek: Memperkuat posisi pasar TEMA.", "Riset Audiens: Menarik pelanggan baru.", "Pengembangan Pesan: Meningkatkan kesadaran merek dan penjualan."],
        tags: ["Branding", "Market Research", "Strategy"],
      },
      {
        title: "Analisis Media Sosial TukangSayur.co",
        imageUrl: "https://placehold.co/800x450.png",
        imageHint: "data analytics",
        description: "Melakukan analisis mendalam terhadap performa media sosial TukangSayur.co di platform Instagram. Memberikan rekomendasi strategis berdasarkan data untuk peningkatan engagement dan pertumbuhan.",
        details: ["Analisis Profil: Instagram: username, bio, tautan.", "Kinerja Postingan: Frekuensi, jenis konten, waktu, engagement.", "Penggunaan Tools: Analisis dengan Social Blade."],
        tags: ["Social Media Analysis", "Instagram", "Data Analytics"],
      },
      {
        title: "Kanenakan (Donat) - Konten Kreatif",
        imageUrl: "https://placehold.co/800x450.png",
        imageHint: "food content",
        description: "Merancang dan mengimplementasikan strategi konten kreatif untuk Kanenakan (Donat) yang berfokus pada visual produk yang menarik dan peningkatan interaksi pengguna melalui berbagai format konten.",
        details: ["Deskripsi: Mengembangkan strategi konten kreatif rasa dan pengalaman pelanggan.", "Visual: Short copy dan visual donat warna-warni serta close-up.", "Engagement: Reels, foto carousel, UGC, tantangan, dan kontes."],
        tags: ["Content Creation", "Visual Design", "User Engagement"],
      },
      {
        title: "Proyek Kelima (Placeholder)",
        imageUrl: "https://placehold.co/800x450.png",
        imageHint: "project placeholder",
        description: "Ini adalah deskripsi placeholder untuk proyek kelima Anda. Silakan perbarui dengan detail proyek yang sebenarnya.",
        details: ["Detail 1 untuk proyek kelima.", "Detail 2 untuk proyek kelima.", "Detail 3 untuk proyek kelima."],
        tags: ["Teknologi 1", "Teknologi 2", "Placeholder"],
      }
    ],
    contactEmail: "wahyupratomo187@gmail.com",
    copyrightYear: 2025
  };

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
        profileName={profileData.name} 
      />
      <main className="flex-grow pt-16 md:pt-20">
        <HeroSection
          id="hero"
          name={profileData.name}
          title={profileData.title}
          tagline={profileData.heroTagline}
          imageUrl={profileData.heroImageUrl}
          imageHint={profileData.heroImageHint}
          socialLinks={profileData.socialLinks}
          cvUrl={profileData.cvUrl}
        />
        <AboutSection
          id="about"
          title="Tentang Saya"
          imageUrl={profileData.about.imageUrl}
          imageHint={profileData.about.imageHint}
          paragraphs={profileData.about.paragraphs}
          education={profileData.about.education}
        />
        <SkillsSection
          id="skills"
          title="Keahlian Utama"
          skills={profileData.skills}
        />
        <ProjectsSection
          id="projects"
          title="Proyek Pilihan"
          projects={profileData.projects}
        />
        <ContactSection
          id="contact"
          title="Hubungi Saya"
          email={profileData.contactEmail}
        />
      </main>
      <Footer 
        copyrightName={profileData.name} 
        year={profileData.copyrightYear}
        socialLinks={profileData.socialLinks}
      />
    </div>
  );
}
