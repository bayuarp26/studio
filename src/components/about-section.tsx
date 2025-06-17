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
    <SectionContainer id={id} className="bg-background" applyFadeIn>
      <h2 id={`${id}-heading`} className="section-title">{title}</h2>
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
        <div className="relative aspect-[3/2] rounded-lg overflow-hidden shadow-lg">
          <Image
            src={imageUrl}
            alt={title}
            data-ai-hint={imageHint}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
        <div className="space-y-4 text-foreground">
          {paragraphs.map((p, index) => (
            <p key={index} className="leading-relaxed text-base md:text-lg">
              {p}
            </p>
          ))}
          <div>
            <h3 className="font-semibold text-xl mt-6 mb-3 text-primary">Latar Belakang Pendidikan</h3>
            <ul className="list-disc pl-5 space-y-2 text-base md:text-lg">
              {education.map((edu, index) => (
                <li key={index}>
                  <strong>{edu.institution}</strong> - {edu.detail}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </SectionContainer>
  );
}
