
import type React from 'react';
import SectionContainer from './section-container';
import { Badge } from '@/components/ui/badge';

interface Skill {
  name: string;
}

interface SkillsSectionProps {
  id: string;
  title: string;
  skills: Skill[];
}

export default function SkillsSection({ id, title, skills }: SkillsSectionProps) {
  return (
    <SectionContainer id={id} className="bg-secondary">
      <h2 id={`${id}-heading`} className="section-title text-center">{title}</h2>
      <div className="flex flex-wrap justify-center gap-3 md:gap-4 max-w-2xl mx-auto">
        {skills.map((skill, index) => (
          <Badge 
            key={index} 
            variant="default" 
            className="text-sm md:text-base px-4 py-2 rounded-lg shadow-sm bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30"
          >
            {skill.name}
          </Badge>
        ))}
      </div>
    </SectionContainer>
  );
}
