
import SectionContainer from './section-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Send, Linkedin } from 'lucide-react'; // Added Linkedin icon

interface SocialLinks {
  // Only linkedin is needed here, but keep it open for future if necessary
  linkedin: string;
  // github?: string; // Add if other social links are needed in contact section
}

interface ContactSectionProps {
  id: string;
  title: string;
  email: string;
  socialLinks: SocialLinks; // Added socialLinks prop
}

export default function ContactSection({ id, title, email, socialLinks }: ContactSectionProps) {
  return (
    <SectionContainer id={id} className="bg-secondary"> {/* Light gray secondary background */}
      <div className="max-w-xl mx-auto text-center">
        <h2 id={`${id}-heading`} className="section-title inline-block">{title}</h2>
        <p className="text-lg text-muted-foreground mb-8 mt-[-1.5rem]">
          Saya selalu terbuka untuk diskusi, kolaborasi, atau sekadar menyapa. Jangan ragu untuk menghubungi!
        </p>
        <Card className="bg-card shadow-xl border border-border transition-all duration-200 ease-out hover:shadow-inner hover:brightness-95">
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
    </SectionContainer>
  );
}
