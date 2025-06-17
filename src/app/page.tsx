
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Navigation from "@/components/navigation";
import HeroSection from "@/components/hero-section";
import AboutSection from "@/components/about-section";
import SkillsSection from "@/components/skills-section";
import ProjectsSection from "@/components/projects-section";
import ContactSection from "@/components/contact-section";
import Footer from "@/components/footer";
import { Target, ClipboardList, Leaf, Users, MessageSquare } from 'lucide-react';

const NAV_HEIGHT_OFFSET = 80; // Approximate height of nav + some buffer

export default function PortfolioPage() {
  const [activeSection, setActiveSection] = useState("hero");
  const sectionRefs = useRef<{[key: string]: HTMLElement | null}>({});

  const navLinks = [
    { id: "about", label: "Tentang Saya", href: "#about" },
    { id: "skills", label: "Keahlian", href: "#skills" },
    { id: "projects", label: "Proyek", href: "#projects" },
    { id: "contact", label: "Kontak", href: "#contact" },
  ];
  const allSectionIds = ["hero", ...navLinks.map(link => link.id)];


  const handleScroll = useCallback(() => {
    const scrollPosition = window.scrollY + NAV_HEIGHT_OFFSET + window.innerHeight / 3; // Adjust offset for better detection
    let currentSection = "hero";

    for (const sectionId of allSectionIds) {
      const element = document.getElementById(sectionId);
      if (element) {
         sectionRefs.current[sectionId] = element; // Keep refs updated
        if (element.offsetTop <= scrollPosition) {
          if (element.offsetTop + element.offsetHeight > scrollPosition) {
             currentSection = sectionId;
          } else if (scrollPosition >= document.body.scrollHeight - window.innerHeight) { // If at bottom, last section is active
             currentSection = allSectionIds[allSectionIds.length -1];
          } else {
            currentSection = sectionId; // Default to this section if it's the highest one passed
          }
        } else {
          // If the first section is not yet reached, active section remains hero or first in array
          if (allSectionIds.indexOf(sectionId) === 0 && currentSection === "hero") break; 
          // If we've passed all relevant sections, break
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
    
    handleScroll(); // Initial check
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll, allSectionIds]);

  const profileData = {
    name: "Wahyu Pratomo",
    title: "Spesialis Media Sosial | Digital Marketing Expert | Strategi dan Kinerja Pemasaran",
    heroImageUrl: "https://placehold.co/160x160.png",
    heroImageHint: "profile photo",
    about: {
      imageUrl: "https://placehold.co/600x400.png",
      imageHint: "digital marketing",
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
      { icon: Target, title: "Pemasaran Digital", description: "Strategi dan kinerja pemasaran." },
      { icon: ClipboardList, title: "Manajemen Proyek", description: "Mengelola proyek dengan efisien." },
      { icon: Leaf, title: "Desain Berkelanjutan", description: "Fokus pada desain ramah lingkungan." },
      { icon: Users, title: "Keterampilan Kolaborasi", description: "Bekerja efektif dalam tim." },
      { icon: MessageSquare, title: "Komunikasi Klien", description: "Membangun hubungan kuat dengan klien." }
    ],
    projects: [
      { 
        title: "Kampanye Harisenin.com", 
        imageUrl: "https://placehold.co/800x400.png", 
        imageHint: "campaign harisenin",
        description: "Meningkatkan kesadaran merek dan akuisisi pelanggan untuk Harisenin.com melalui strategi media sosial yang komprehensif, termasuk optimasi konten dan penargetan audiens yang efektif.",
        details: ["Tujuan: Meningkatkan kesadaran merek dan produk melalui media sosial.", "Strategi: Meningkatkan copywriting, hook, dan desain konten. Menarik audiens.", "Hasil: Pertumbuhan follower (+30%), jangkauan brand (100.000+), engagement (5%+), leads baru (100+)."] 
      },
      { 
        title: "Identitas Merek TEMA \"Coffee & Space\"", 
        imageUrl: "https://placehold.co/800x400.png", 
        imageHint: "brand identity",
        description: "Mengembangkan identitas merek yang kuat untuk TEMA \"Coffee & Space\" dengan melakukan analisis pasar mendalam, riset audiens, dan perancangan pesan kunci untuk meningkatkan posisi pasar dan penjualan.",
        details: ["Analisis Merek: Memperkuat posisi pasar TEMA.", "Riset Audiens: Menarik pelanggan baru.", "Pengembangan Pesan: Meningkatkan kesadaran merek dan penjualan."] 
      },
      { 
        title: "Analisis Media Sosial TukangSayur.co", 
        imageUrl: "https://placehold.co/800x400.png", 
        imageHint: "social media analysis",
        description: "Melakukan analisis mendalam terhadap performa media sosial TukangSayur.co di Instagram, mengevaluasi profil, kinerja postingan, dan penggunaan tools analitik untuk memberikan rekomendasi strategis.",
        details: ["Analisis Profil: Instagram: username, bio, tautan.", "Kinerja Postingan: Frekuensi, jenis konten, waktu, engagement.", "Penggunaan Tools: Analisis dengan Social Blade."] 
      },
      { 
        title: "Kanenakan (Donat)", 
        imageUrl: "https://placehold.co/800x400.png", 
        imageHint: "creative content",
        description: "Merancang dan mengimplementasikan strategi konten kreatif untuk Kanenakan (Donat) yang berfokus pada visual menarik dan interaksi pengguna, guna meningkatkan engagement dan brand awareness.",
        details: ["Deskripsi: Mengembangkan strategi konten kreatif rasa dan pengalaman pelanggan.", "Visual: Short copy dan visual donat warna-warni serta close-up.", "Engagement: Reels, foto carousel, UGC, tantangan, dan kontes."] 
      },
      { 
        title: "Sambal Sarumpet", 
        imageUrl: "https://placehold.co/800x400.png", 
        imageHint: "brand narrative",
        description: "Membangun narasi brand yang kuat untuk Sambal Sarumpet melalui strategi konten yang memikat, menggabungkan copywriting persuasif dengan visual produk yang menggugah selera untuk meningkatkan koneksi emosional dengan audiens.",
        details: ["Deskripsi: Merancang strategi konten untuk memperkuat narasi brand.", "Copywriting: Visual close-up sambal dan makanan tradisional.", "Tone: Naratif, persuasif, dan santai."] 
      }
    ],
    contactEmail: "wahyupratomo187@gmail.com",
    copyrightYear: 2025
  };

  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col">
      <Navigation activeSection={activeSection} navLinks={navLinks} />
      <main className="flex-grow pt-16"> {/* Padding top for fixed nav */}
        <HeroSection
          id="hero"
          name={profileData.name}
          title={profileData.title}
          imageUrl={profileData.heroImageUrl}
          imageHint={profileData.heroImageHint}
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
          title="Keahlian"
          skills={profileData.skills}
        />
        <ProjectsSection
          id="projects"
          title="Proyek"
          projects={profileData.projects}
        />
        <ContactSection
          id="contact"
          title="Kontak"
          email={profileData.contactEmail}
        />
      </main>
      <Footer copyrightName={profileData.name} year={profileData.copyrightYear} />
    </div>
  );
}

    