import Image from 'next/image';
import SectionContainer from './section-container';

interface HeroSectionProps {
  id: string;
  name: string;
  title: string;
  imageUrl: string;
  imageHint: string;
}

export default function HeroSection({ id, name, title, imageUrl, imageHint }: HeroSectionProps) {
  return (
    <section id={id} className="bg-gradient-to-br from-primary/10 via-background to-accent/20 pt-28 pb-16 sm:pt-32 sm:pb-20 px-4 sm:px-6 lg:px-8 text-center">
      <div className="container mx-auto max-w-screen-md">
        <Image
          src={imageUrl}
          alt={`Foto profil ${name}`}
          data-ai-hint={imageHint}
          width={160}
          height={160}
          className="w-32 h-32 md:w-40 md:h-40 rounded-full mx-auto shadow-xl mb-6 border-4 border-background object-cover"
          priority
        />
        <h1 className="text-4xl md:text-5xl font-bold mb-3 text-foreground">{name}</h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">{title}</p>
      </div>
    </section>
  );
}
