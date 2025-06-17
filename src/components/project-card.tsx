
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProjectCardProps {
  imageUrl: string;
  imageHint: string;
  title: string;
  description: string;
  details: string[];
}

export default function ProjectCard({ imageUrl, imageHint, title, description, details }: ProjectCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-2xl transition-all transform hover:-translate-y-1 duration-300 rounded-lg bg-white/20 backdrop-blur-lg border border-white/30 shadow-xl">
      <CardHeader className="p-0">
        <div className="relative aspect-video w-full">
          <Image
            src={imageUrl}
            alt={title}
            data-ai-hint={imageHint}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <CardTitle className="text-xl mb-2 text-foreground">{title}</CardTitle>
        <p className="text-sm text-foreground/90 mb-4 leading-relaxed">
          {description}
        </p>
        <div className="space-y-1 text-sm text-muted-foreground">
          {details.map((detail, index) => {
            const parts = detail.split(':');
            if (parts.length > 1) {
              return (
                <p key={index}>
                  <strong className="text-foreground/80">{parts[0]}:</strong> {parts.slice(1).join(':')}
                </p>
              );
            }
            return <p key={index}>{detail}</p>;
          })}
        </div>
      </CardContent>
    </Card>
  );
}

    