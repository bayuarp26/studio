
import SectionContainer from './section-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Send } from 'lucide-react';

interface ContactSectionProps {
  id: string;
  title: string;
  email: string;
}

export default function ContactSection({ id, title, email }: ContactSectionProps) {
  return (
    <SectionContainer id={id} className="bg-secondary"> {/* Light gray secondary background */}
      <div className="max-w-xl mx-auto text-center">
        <h2 id={`${id}-heading`} className="section-title inline-block">{title}</h2>
        <p className="text-lg text-muted-foreground mb-8 mt-[-1.5rem]">
          Saya selalu terbuka untuk diskusi, kolaborasi, atau sekadar menyapa. Jangan ragu untuk menghubungi!
        </p>
        <Card className="bg-card shadow-xl border border-border">
          <CardContent className="p-6 md:p-8">
            <a
              href={`mailto:${email}`}
              className="w-full"
            >
            <Button size="lg" className="w-full text-base md:text-lg">
                <Send className="mr-2 h-5 w-5" />
                Kirim Email ke {email.split('@')[0]}
            </Button>
            </a>
            <p className="text-xs text-muted-foreground mt-4">
              Atau langsung kirim ke: <strong className="text-foreground">{email}</strong>
            </p>
          </CardContent>
        </Card>
      </div>
    </SectionContainer>
  );
}
