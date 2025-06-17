
import Image from 'next/image';
import SectionContainer from './section-container';

interface EducationItem {
  institution: string;
  detail: string;
}

interface AboutSectionProps {
  id: string;
  title: string;
  imageUrl: string;
  imageHint: string;
  paragraphs: string[];
  education: EducationItem[];
}

export default function AboutSection({ id, title, imageUrl, imageHint, paragraphs, education }: AboutSectionProps) {
  return (
    <SectionContainer id={id} className="bg-background">
      <h2 id={`${id}-heading`} className="section-title text-center md:text-left">{title}</h2>
      <div className="grid md:grid-cols-5 gap-8 lg:gap-12 items-center">
        <div className="md:col-span-2 relative aspect-square md:aspect-[4/5] rounded-lg overflow-hidden shadow-xl mx-auto md:mx-0 max-w-sm md:max-w-none">
          <Image
            src={imageUrl}
            alt={title}
            data-ai-hint={imageHint}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 80vw, (max-width: 1200px) 40vw, 33vw"
          />
        </div>
        <div className="md:col-span-3 space-y-4">
          {paragraphs.map((p, index) => (
            <p key={index} className="leading-relaxed text-base md:text-lg text-muted-foreground">
              {p}
            </p>
          ))}
          <div>
            <h3 className="font-semibold text-xl text-primary mt-6 mb-3">Latar Belakang Pendidikan</h3>
            <ul className="space-y-2 text-base md:text-lg">
              {education.map((edu, index) => (
                <li key={index} className="bg-card p-3 rounded-md shadow-sm border border-border">
                  <strong className="text-foreground">{edu.institution}</strong>
                  <p className="text-muted-foreground text-sm">{edu.detail}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </SectionContainer>
  );
}
