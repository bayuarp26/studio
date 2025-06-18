
"use client"; // Required for the hook

import SectionContainer from './section-container';
import { Card, CardContent } from '@/components/ui/card'; // CardHeader, CardTitle removed as not used directly
import { Button } from '@/components/ui/button';
import { Send, Linkedin } from 'lucide-react';
import { useDynamicCardEffect } from '@/hooks/useDynamicCardEffect'; // Adjust path if necessary

interface SocialLinks {
  linkedin: string;
}

interface ContactSectionProps {
  id: string;
  title: string;
  email: string;
  socialLinks: SocialLinks;
}

export default function ContactSection({ id, title, email, socialLinks }: ContactSectionProps) {
  const contactCardRef = useDynamicCardEffect<HTMLDivElement>({
     defaultBoxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)' // Tailwind shadow-xl
  });

  return (
    <SectionContainer id={id} className="bg-secondary">
      <div className="max-w-xl mx-auto text-center">
        <h2 id={`${id}-heading`} className="section-title inline-block">{title}</h2>
        <p className="text-lg text-muted-foreground mb-8 mt-[-1.5rem]">
          Saya selalu terbuka untuk diskusi, kolaborasi, atau sekadar menyapa. Jangan ragu untuk menghubungi!
        </p>
        <div className="[perspective:1000px]"> {/* Perspective wrapper for 3D effect */}
          <Card 
            ref={contactCardRef} 
            className="bg-card shadow-xl border border-border [transform-style:preserve-3d]"
            // Initial transition and box-shadow are now set by the hook
          >
            <CardContent className="p-6 md:p-8 space-y-4">
              <a
                href={`mailto:${email}`}
                className="w-full block"
              >
              <Button size="lg" className="w-full text-base md:text-lg">
                  <Send className="mr-2 h-5 w-5" />
                  Kirim Email
              </Button>
              </a>
              {socialLinks.linkedin && (
                <a
                  href={socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full block"
                >
                  <Button
                    size="lg"
                    className="w-full text-base md:text-lg bg-blue-600 text-white hover:bg-blue-700"
                  >
                    <Linkedin className="mr-2 h-5 w-5" />
                    Terhubung di LinkedIn
                  </Button>
                </a>
              )}
              <p className="text-xs text-muted-foreground pt-2">
                Email: <strong className="text-foreground">{email}</strong>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </SectionContainer>
  );
}
