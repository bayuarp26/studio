import type React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SkillCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

export default function SkillCard({ icon: Icon, title, description }: SkillCardProps) {
  return (
    <Card className="bg-card hover:shadow-xl transition-all transform hover:-translate-y-1 duration-300 h-full">
      <CardHeader className="flex flex-row items-center space-x-3 pb-3">
        <Icon className="w-8 h-8 text-primary" />
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">{description}</p>
      </CardContent>
    </Card>
  );
}
