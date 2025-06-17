
import SectionContainer from './section-container';
import ProjectCard from './project-card';

interface Project {
  title: string;
  imageUrl: string;
  imageHint: string;
  description: string;
  details: string[];
  tags: string[];
}

interface ProjectsSectionProps {
  id: string;
  title: string;
  projects: Project[];
}

export default function ProjectsSection({ id, title, projects }: ProjectsSectionProps) {
  return (
    <SectionContainer id={id} className="bg-background">
      <h2 id={`${id}-heading`} className="section-title text-center md:text-left">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 lg:gap-10">
        {projects.map((project, index) => (
          <ProjectCard
            key={index}
            title={project.title}
            imageUrl={project.imageUrl}
            imageHint={project.imageHint}
            description={project.description}
            details={project.details} // Pastikan details diteruskan jika masih ada di data
            tags={project.tags}
          />
        ))}
      </div>
    </SectionContainer>
  );
}
