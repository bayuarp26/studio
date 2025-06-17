import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProjectCardProps {
  imageUrl: string;
  imageHint: string;
  title: string;
  details: string[];
}

export default function ProjectCard({ imageUrl, imageHint, title, details }: ProjectCardProps) {
  return (
    <Card className="bg-card overflow-hidden hover:shadow-xl transition-all transform hover:-translate-y-1 duration-300">
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
        <CardTitle className="text-xl mb-3">{title}</CardTitle>
        <div className="space-y-1 text-sm text-muted-foreground">
          {details.map((detail, index) => {
            const parts = detail.split(':');
            if (parts.length > 1) {
              return (
                <p key={index}>
                  <strong className="text-foreground">{parts[0]}:</strong> {parts.slice(1).join(':')}
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
