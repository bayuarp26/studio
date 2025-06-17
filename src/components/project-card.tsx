
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ProjectCardProps {
  imageUrl: string;
  imageHint: string;
  title: string;
  description: string;
  details: string[];
  tags: string[];
}

export default function ProjectCard({ imageUrl, imageHint, title, description, tags }: ProjectCardProps) {
  return (
    <Card className="overflow-hidden bg-card/30 backdrop-blur-md border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col h-full">
      <CardHeader className="p-0">
        <div className="relative aspect-[16/9] w-full"> {/* Aspect ratio for project images */}
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
      <CardContent className="p-5 flex-grow">
        <CardTitle className="text-xl lg:text-2xl mb-2 text-foreground">{title}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground mb-4 leading-relaxed line-clamp-4">
          {description}
        </CardDescription>
        <div className="mb-4">
          {tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="mr-2 mb-2 text-xs px-2 py-1">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      {/* CardFooter removed */}
    </Card>
  );
}
