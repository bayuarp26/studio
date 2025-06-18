
import { Button } from '@/components/ui/button';
import { Github, Linkedin, UserCog } from 'lucide-react'; // Added UserCog
import Link from 'next/link'; // Added Link

interface SocialLinks {
  github: string;
  linkedin: string;
}

interface FooterProps {
  copyrightName: string;
  year: number;
  socialLinks: SocialLinks;
}

export default function Footer({ copyrightName, year, socialLinks }: FooterProps) {
  return (
    <footer className="bg-footer-background text-footer-foreground text-center p-8 mt-12">
      <div className="flex justify-center space-x-4 mb-4">
        <Button asChild variant="ghost" size="icon" className="text-footer-foreground hover:bg-primary/10 hover:text-primary rounded-full">
          <a href={socialLinks.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
            <Github className="h-5 w-5" />
          </a>
        </Button>
        <Button asChild variant="ghost" size="icon" className="text-footer-foreground hover:bg-primary/10 hover:text-primary rounded-full">
          <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
            <Linkedin className="h-5 w-5" />
          </a>
        </Button>
        {/* Admin Button Added Here */}
        <Button asChild variant="ghost" size="icon" className="text-footer-foreground hover:bg-primary/10 hover:text-primary rounded-full">
          <Link href="/admin/profile" aria-label="Admin Panel">
            <UserCog className="h-5 w-5" />
          </Link>
        </Button>
      </div>
      <p className="text-sm mb-2 opacity-70">&copy; {year} {copyrightName}. All rights reserved.</p>
    </footer>
  );
}
