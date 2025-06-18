
"use client"; // Required for the hook

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDynamicCardEffect } from '@/hooks/useDynamicCardEffect'; // Adjust path if necessary

interface ProjectCardProps {
  imageUrl: string;
  imageHint: string;
  title: string;
  description: string;
  details: string[];
  tags: string[];
}

export default function ProjectCard({ imageUrl, imageHint, title, description, tags }: ProjectCardProps) {
  const cardRef = useDynamicCardEffect<HTMLDivElement>({
    // You can override default options here if needed, e.g.:
    // maxRotation: 10,
    // scaleAmount: 1.06,
  });

  return (
    <Card 
      ref={cardRef} 
      className="overflow-hidden bg-card border border-border shadow-lg flex flex-col h-full [transform-style:preserve-3d]"
      // Initial transition and box-shadow are now set by the hook
    >
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
