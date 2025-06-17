import type React from 'react';
import SectionContainer from './section-container';
import SkillCard from './skill-card';

interface Skill {
  icon: React.ElementType;
  title: string;
  description: string;
}

interface SkillsSectionProps {
  id: string;
  title: string;
  skills: Skill[];
}

export default function SkillsSection({ id, title, skills }: SkillsSectionProps) {
  return (
    <SectionContainer id={id} className="bg-secondary" applyFadeIn>
      <h2 id={`${id}-heading`} className="section-title">{title}</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {skills.map((skill, index) => (
          <SkillCard
            key={index}
            icon={skill.icon}
            title={skill.title}
            description={skill.description}
          />
        ))}
      </div>
    </SectionContainer>
  );
}
