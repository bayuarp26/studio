
import Link from 'next/link';
import clientPromise from '@/lib/mongodb';
import type { MongoClient, ObjectId, Document } from 'mongodb';
import { Button } from '@/components/ui/button';
import DeleteProjectButton from '@/components/delete-project-button';
import SectionContainer from '@/components/section-container';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Edit3 } from 'lucide-react'; // Edit3 can be for a future edit button

// This interface should match the data structure used for projects
interface ProjectData {
  _id: string;
  title: string;
  imageUrl: string;
  imageHint: string;
  description: string;
  details: string[];
  tags: string[];
  createdAt?: Date; // Optional: if you want to display or use it
}

interface ProjectDocument extends Document {
    _id: ObjectId;
    title: string;
    imageUrl: string;
    imageHint: string;
    description: string;
    details: string[];
    tags: string[];
    createdAt: Date; // Assuming createdAt exists from addProjectAction
}

async function getAdminProjects(): Promise<ProjectData[]> {
  try {
    const client: MongoClient = await clientPromise;
    const db = client.db();
    const projectsCollection = db.collection<ProjectDocument>("projects");
    const projects = await projectsCollection.find({}).sort({ createdAt: -1 }).toArray();
    return projects.map(p => ({
      _id: p._id.toString(),
      title: p.title,
      imageUrl: p.imageUrl,
      imageHint: p.imageHint,
      description: p.description,
      details: p.details, // Though not displayed in Card, kept for consistency
      tags: p.tags,
      createdAt: p.createdAt, // Map createdAt
    }));
  } catch (e) {
    console.error("Failed to fetch projects for admin:", e);
    return [];
  }
}

export default async function ManageProjectsPage() {
  const projects = await getAdminProjects();

  return (
    <SectionContainer id="manage-projects-admin" className="bg-background min-h-screen pt-24 md:pt-32">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10">
        <h1 className="section-title mb-4 sm:mb-0">Kelola Proyek</h1>
        <Button asChild size="lg">
          <Link href="/admin/add-project">
            <PlusCircle className="mr-2 h-5 w-5" />
            Tambah Proyek Baru
          </Link>
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-xl text-muted-foreground">Belum ada proyek yang ditambahkan.</p>
          <p className="text-muted-foreground mt-2">Mulai dengan menambahkan proyek baru.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project._id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="p-0">
                <div className="relative aspect-[16/9] w-full">
                  <Image
                    src={project.imageUrl}
                    alt={project.title}
                    data-ai-hint={project.imageHint}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-4 flex-grow">
                <CardTitle className="text-lg lg:text-xl mb-1 text-primary line-clamp-2">{project.title}</CardTitle>
                <CardDescription className="text-xs text-muted-foreground line-clamp-3 mb-2">
                  {project.description}
                </CardDescription>
                <div className="flex flex-wrap gap-1 mb-1">
                    {project.tags.slice(0, 4).map((tag, index) => ( // Show up to 4 tags
                       <Badge key={index} variant="secondary" className="text-xs px-1.5 py-0.5">{tag}</Badge>
                    ))}
                    {project.tags.length > 4 && <Badge variant="outline" className="text-xs px-1.5 py-0.5">+{project.tags.length - 4}</Badge>}
                </div>
                 {project.createdAt && (
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Dibuat: {new Date(project.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </CardContent>
              <CardFooter className="p-3 border-t bg-muted/30 flex justify-end space-x-2">
                {/* Placeholder for Edit Button - Future Feature
                <Button variant="outline" size="sm" className="w-full md:w-auto">
                  <Edit3 className="mr-0 md:mr-2 h-4 w-4" />
                   <span className="hidden md:inline">Edit</span>
                </Button>
                */}
                <DeleteProjectButton projectId={project._id} projectTitle={project.title} />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </SectionContainer>
  );
}
