
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
    <SectionContainer id={id} className="bg-secondary"> {/* Using light gray secondary background */}
      <h2 id={`${id}-heading`} className="section-title text-center">{title}</h2>
      <div className="flex flex-wrap justify-center gap-3 md:gap-4 max-w-2xl mx-auto">
        {skills.map((skill, index) => (
          <Badge 
            key={index} 
            className="text-sm md:text-base px-4 py-2 rounded-lg shadow-sm bg-[#09121f] text-primary border border-primary/30 hover:bg-primary hover:text-primary-foreground transition-colors" 
          >
            {skill.name}
          </Badge>
        ))}
      </div>
    </SectionContainer>
  );
}
