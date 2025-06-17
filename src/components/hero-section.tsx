
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Github, Linkedin, Twitter, Download } from 'lucide-react';

interface SocialLinks {
  github: string;
  linkedin: string;
  twitter?: string;
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
  return (
    <section 
      id={id} 
      className="bg-gradient-to-br from-primary/10 via-background to-secondary/20 min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-5rem)] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 text-center"
    >
      <div className="container mx-auto max-w-screen-lg flex flex-col md:flex-row items-center gap-8 md:gap-12">
        <div className="md:order-2 flex-shrink-0">
          <Image
            src={imageUrl}
            alt={`Foto profil ${name}`}
            data-ai-hint={imageHint}
            width={240} 
            height={240}
            className="w-48 h-48 md:w-60 md:h-60 rounded-full mx-auto shadow-xl border-4 border-background object-cover"
            priority
          />
        </div>
        <div className="md:order-1 md:text-left text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-3 text-foreground">{name}</h1>
          <p className="text-lg sm:text-xl md:text-2xl text-primary mb-4">{title}</p>
          <p className="text-md sm:text-lg text-muted-foreground max-w-xl mx-auto md:mx-0 mb-8">{tagline}</p>
          <div className="flex flex-col sm:flex-row justify-center md:justify-start items-center gap-4">
            <Button asChild size="lg">
              <a href={cvUrl} target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-5 w-5" />
                Unduh CV
              </a>
            </Button>
            <div className="flex space-x-3 mt-4 sm:mt-0">
              <Button asChild variant="outline" size="icon" className="rounded-full">
                <a href={socialLinks.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                  <Github className="h-5 w-5" />
                </a>
              </Button>
              <Button asChild variant="outline" size="icon" className="rounded-full">
                <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                  <Linkedin className="h-5 w-5" />
                </a>
              </Button>
              {socialLinks.twitter && (
                <Button asChild variant="outline" size="icon" className="rounded-full">
                  <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                    <Twitter className="h-5 w-5" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
