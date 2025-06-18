
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
    <Card className="overflow-hidden bg-card border border-border shadow-lg transition-all duration-200 ease-out hover:shadow-inner hover:brightness-95 flex flex-col h-full">
      <CardHeader className="p-0">
        <div className="relative aspect-[16/9] w-full">
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
        <CardTitle className="text-xl lg:text-2xl mb-2 text-primary">{title}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground mb-4 leading-relaxed">
          {description}
        </CardDescription>
        <div className="mb-4">
          {tags.map((tag, index) => (
            <Badge
              key={index}
              className="mr-2 mb-2 text-xs px-2 py-1 bg-[#09121f] text-primary border border-primary/30 hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
