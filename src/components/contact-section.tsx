import SectionContainer from './section-container';
import { Card, CardContent } from '@/components/ui/card';
import { Mail } from 'lucide-react';

interface ContactSectionProps {
  id: string;
  title: string;
  email: string;
}

export default function ContactSection({ id, title, email }: ContactSectionProps) {
  return (
    <SectionContainer id={id} className="bg-secondary" applyFadeIn>
      <h2 id={`${id}-heading`} className="section-title">{title}</h2>
      <Card className="max-w-md mx-auto bg-card">
        <CardContent className="p-6 text-center">
          <p className="text-lg text-muted-foreground mb-4">
            Feel free to reach out for collaborations or inquiries.
          </p>
          <a
            href={`mailto:${email}`}
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
          >
            <Mail className="mr-2 h-5 w-5" />
            {email}
          </a>
        </CardContent>
      </Card>
    </SectionContainer>
  );
}
