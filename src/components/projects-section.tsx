import SectionContainer from './section-container';
import ProjectCard from './project-card';

interface Project {
  title: string;
  imageUrl: string;
  imageHint: string;
  details: string[];
}

interface ProjectsSectionProps {
  id: string;
  title: string;
  projects: Project[];
}

export default function ProjectsSection({ id, title, projects }: ProjectsSectionProps) {
  return (
    <SectionContainer id={id} className="bg-background" applyFadeIn>
      <h2 id={`${id}-heading`} className="section-title">{title}</h2>
      <div className="space-y-10">
        {projects.map((project, index) => (
          <ProjectCard
            key={index}
            title={project.title}
            imageUrl={project.imageUrl}
            imageHint={project.imageHint}
            details={project.details}
          />
        ))}
      </div>
    </SectionContainer>
  );
}
