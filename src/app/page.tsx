
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Navigation from "@/components/navigation";
import HeroSection from "@/components/hero-section";
import AboutSection from "@/components/about-section";
import SkillsSection from "@/components/skills-section";
import ProjectsSection from "@/components/projects-section";
import ContactSection from "@/components/contact-section";
import Footer from "@/components/footer";
import { Github, Linkedin, Twitter, Download, ExternalLink } from 'lucide-react';

const NAV_HEIGHT_OFFSET = 70; // Adjusted nav height offset

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
    
    handleScroll(); // Initial check
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
      github: "https://github.com/yourusername",
      linkedin: "https://linkedin.com/in/yourusername",
      twitter: "https://twitter.com/yourusername",
    },
    cvUrl: "/path-to-your-cv.pdf", // Replace with actual path or link
    about: {
      imageUrl: "https://placehold.co/600x450.png", // Slightly adjusted aspect ratio
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
      { name: "Desain Berkelanjutan" }, // Keeping this for now, can be reviewed
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
        description: "Meningkatkan kesadaran merek dan akuisisi pelanggan untuk Harisenin.com melalui strategi media sosial yang komprehensif.",
        details: ["Tujuan: Meningkatkan kesadaran merek dan produk melalui media sosial.", "Strategi: Meningkatkan copywriting, hook, dan desain konten. Menarik audiens.", "Hasil: Pertumbuhan follower (+30%), jangkauan brand (100.000+), engagement (5%+), leads baru (100+)."],
        tags: ["Social Media", "Copywriting", "Content Strategy", "Campaign Management"],
        links: { github: "https://github.com/project", demo: "https://livedemo.com/project1" }
      },
      {
        title: "Identitas Merek TEMA \"Coffee & Space\"",
        imageUrl: "https://placehold.co/800x450.png",
        imageHint: "brand design",
        description: "Mengembangkan identitas merek yang kuat untuk TEMA \"Coffee & Space\" dengan analisis pasar dan riset audiens.",
        details: ["Analisis Merek: Memperkuat posisi pasar TEMA.", "Riset Audiens: Menarik pelanggan baru.", "Pengembangan Pesan: Meningkatkan kesadaran merek dan penjualan."],
        tags: ["Branding", "Market Research", "Strategy"],
        links: { github: "https://github.com/project2" }
      },
      {
        title: "Analisis Media Sosial TukangSayur.co",
        imageUrl: "https://placehold.co/800x450.png",
        imageHint: "data analytics",
        description: "Analisis mendalam performa media sosial TukangSayur.co di Instagram dan rekomendasi strategis.",
        details: ["Analisis Profil: Instagram: username, bio, tautan.", "Kinerja Postingan: Frekuensi, jenis konten, waktu, engagement.", "Penggunaan Tools: Analisis dengan Social Blade."],
        tags: ["Social Media Analysis", "Instagram", "Data Analytics"],
        links: { demo: "https://livedemo.com/project3" }
      },
      {
        title: "Kanenakan (Donat) - Konten Kreatif",
        imageUrl: "https://placehold.co/800x450.png",
        imageHint: "food content",
        description: "Merancang strategi konten kreatif untuk Kanenakan (Donat) yang berfokus pada visual menarik dan interaksi.",
        details: ["Deskripsi: Mengembangkan strategi konten kreatif rasa dan pengalaman pelanggan.", "Visual: Short copy dan visual donat warna-warni serta close-up.", "Engagement: Reels, foto carousel, UGC, tantangan, dan kontes."],
        tags: ["Content Creation", "Visual Design", "User Engagement"],
        links: { github: "https://github.com/project4", demo: "https://livedemo.com/project4" }
      }
    ],
    contactEmail: "wahyupratomo187@gmail.com",
    copyrightYear: 2025
  };

  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col">
      <Navigation 
        activeSection={activeSection} 
        navLinks={navLinks} 
        profileName={profileData.name} 
      />
      <main className="flex-grow pt-16 md:pt-20"> {/* Adjusted padding top */}
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
