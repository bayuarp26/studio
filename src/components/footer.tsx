
import { Button } from '@/components/ui/button';
import { Github, Linkedin, Twitter } from 'lucide-react';

interface SocialLinks {
  github: string;
  linkedin: string;
  twitter?: string;
}

interface FooterProps {
  copyrightName: string;
  year: number;
  socialLinks: SocialLinks;
}

export default function Footer({ copyrightName, year, socialLinks }: FooterProps) {
  return (
    <footer className="bg-footer text-footer-foreground text-center p-8 mt-12">
      <div className="flex justify-center space-x-4 mb-4">
        <Button asChild variant="ghost" size="icon" className="text-footer-foreground hover:bg-white/10 hover:text-white rounded-full">
          <a href={socialLinks.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
            <Github className="h-5 w-5" />
          </a>
        </Button>
        <Button asChild variant="ghost" size="icon" className="text-footer-foreground hover:bg-white/10 hover:text-white rounded-full">
          <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
            <Linkedin className="h-5 w-5" />
          </a>
        </Button>
        {socialLinks.twitter && (
          <Button asChild variant="ghost" size="icon" className="text-footer-foreground hover:bg-white/10 hover:text-white rounded-full">
            <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter">
              <Twitter className="h-5 w-5" />
            </a>
          </Button>
        )}
      </div>
      <p className="text-sm">&copy; {year} {copyrightName}. All rights reserved.</p>
      <p className="text-xs mt-1 opacity-70">Dibangun dengan Next.js dan Tailwind CSS.</p>
    </footer>
  );
}
