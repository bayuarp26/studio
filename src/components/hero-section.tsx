
"use client";

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Github, Linkedin, Download as DownloadIcon } from 'lucide-react';
import { downloadDataUri } from '@/lib/downloadUtils'; // Import helper

interface SocialLinks {
  github: string;
  linkedin: string;
}

interface HeroSectionProps {
  id: string;
  name: string;
  title: string;
  tagline: string;
  imageUrl: string;
  imageHint: string;
  socialLinks: SocialLinks;
  cvUrl: string; 
}

export default function HeroSection({ id, name, title, tagline, imageUrl, imageHint, socialLinks, cvUrl }: HeroSectionProps) {
  
  const handleDownloadCv = () => {
    if (cvUrl && cvUrl.startsWith('data:application/pdf;base64,')) {
      downloadDataUri(cvUrl, "Wahyu_Pratomo-cv.pdf");
    } else {
      // Handle kasus di mana CV tidak tersedia atau format tidak benar
      alert("File CV tidak tersedia untuk diunduh atau format salah.");
    }
  };

  return (
    <section
      id={id}
      className="min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-5rem)] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 text-center bg-[#09121f]"
    >
      <div className="container mx-auto max-w-screen-lg flex flex-col md:flex-row items-center gap-8 md:gap-12">
        <div className="md:order-2 flex-shrink-0">
          <Image
            src={imageUrl}
            alt={`Foto profil ${name}`}
            data-ai-hint={imageHint}
            width={240}
            height={240}
            className="w-48 h-48 md:w-60 md:h-60 rounded-full mx-auto shadow-xl border-4 border-primary/50 object-cover"
            priority
          />
        </div>
        <div className="md:order-1 md:text-left text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-3 text-primary">{name}</h1>
          <p className="text-lg sm:text-xl md:text-2xl text-neutral-200/90 mb-4">{title}</p>
          <p className="text-md sm:text-lg text-neutral-300/75 max-w-xl mx-auto md:mx-0 mb-8">{tagline}</p>
          <div className="flex flex-col sm:flex-row justify-center md:justify-start items-center gap-4">
            {cvUrl && cvUrl.startsWith('data:application/pdf;base64,') ? (
              <Button 
                size="lg" 
                variant="outline" 
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                onClick={handleDownloadCv} // Gunakan onClick handler
              >
                <DownloadIcon className="mr-2 h-5 w-5" />
                Unduh CV
              </Button>
            ) : (
              <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground" disabled>
                <DownloadIcon className="mr-2 h-5 w-5" />
                CV Tidak Tersedia
              </Button>
            )}
            <div className="flex space-x-3 mt-4 sm:mt-0">
              <Button asChild variant="outline" size="icon" className="rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                <a href={socialLinks.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                  <Github className="h-5 w-5" />
                </a>
              </Button>
              <Button asChild variant="outline" size="icon" className="rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                  <Linkedin className="h-5 w-5" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
