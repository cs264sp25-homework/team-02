import { Button } from "@/core/components/button";
import { Input } from "@/core/components/input";
import { Label } from "@/core/components/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/core/components/card";
import { useState } from "react";
import { toast } from "sonner";
import { PlusCircle, Pencil, X } from "lucide-react";
import { ProjectsType, ProfileType } from "convex/profiles";

interface ProjectsProps {
  profile: ProfileType;
  onUpdate: (update: Partial<ProfileType>) => Promise<boolean>;
}

interface ProjectFormProps {
  project?: ProjectsType;
  onCancel: () => void;
  onSubmit: (project: ProjectsType) => void;
}

const ProjectForm = ({ project, onCancel, onSubmit }: ProjectFormProps) => (
  <form
    onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const newProject: ProjectsType = {
        name: formData.get("name") as string,
        description: (formData.get("description") as string)
          .split("\n")
          .filter(Boolean),
        startDate: formData.get("startDate") as string,
        endDate: (formData.get("endDate") as string) || undefined,
        technologies: (formData.get("technologies") as string)
          .split(",")
          .map((tech) => tech.trim())
          .filter(Boolean),
        link: (formData.get("link") as string) || undefined,
        githubUrl: (formData.get("githubUrl") as string) || undefined,
        highlights: (formData.get("highlights") as string)
          .split("\n")
          .filter(Boolean),
      };
      onSubmit(newProject);
    }}
    className="space-y-4 mt-4 p-4 border rounded-lg"
  >
    <div className="grid gap-4 md:grid-cols-2">
      <div className="grid gap-2">
        <Label htmlFor="name">Project Name</Label>
        <Input id="name" name="name" defaultValue={project?.name} required />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="technologies">Technologies (comma-separated)</Label>
        <Input
          id="technologies"
          name="technologies"
          defaultValue={project?.technologies?.join(", ")}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="startDate">Start Date</Label>
        <Input
          id="startDate"
          name="startDate"
          type="date"
          defaultValue={project?.startDate}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="endDate">End Date</Label>
        <Input
          id="endDate"
          name="endDate"
          type="date"
          defaultValue={project?.endDate}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="link">Project Link</Label>
        <Input id="link" name="link" type="url" defaultValue={project?.link} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="githubUrl">GitHub URL</Label>
        <Input
          id="githubUrl"
          name="githubUrl"
          type="url"
          defaultValue={project?.githubUrl}
        />
      </div>

      <div className="grid gap-2 md:col-span-2">
        <Label htmlFor="description">Description (one item per line)</Label>
        <textarea
          id="description"
          name="description"
          className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          defaultValue={project?.description?.join("\n")}
          required
        />
      </div>

      <div className="grid gap-2 md:col-span-2">
        <Label htmlFor="highlights">Key Highlights (one per line)</Label>
        <textarea
          id="highlights"
          name="highlights"
          className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          defaultValue={project?.highlights?.join("\n")}
          required
        />
      </div>
    </div>

    <div className="flex justify-end gap-2">
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit">{project ? "Update" : "Add"} Project</Button>
    </div>
  </form>
);

export const Projects = ({ profile, onUpdate }: ProjectsProps) => {
  const [editingProject, setEditingProject] = useState<number | null>(null);
  const [showProjectForm, setShowProjectForm] = useState(false);

  const handleProjectSubmit = async (newProject: ProjectsType) => {
    const updatedProjects = [...(profile.projects || [])];
    if (editingProject !== null) {
      updatedProjects[editingProject] = newProject;
    } else {
      updatedProjects.push(newProject);
    }

    const success = await onUpdate({ projects: updatedProjects });
    if (success) {
      setShowProjectForm(false);
      setEditingProject(null);
      toast.success(
        editingProject !== null
          ? "Project updated successfully"
          : "Project added successfully",
      );
    }
  };

  const handleDeleteProject = async (index: number) => {
    const updatedProjects = [...profile.projects];
    updatedProjects.splice(index, 1);
    const success = await onUpdate({ projects: updatedProjects });
    if (success) {
      toast.success("Project removed");
    }
  };

  return (
    <Card>
      <CardHeader className="relative text-center pb-8">
        <div>
          <CardTitle className="text-xl font-bold">Projects</CardTitle>
          <CardDescription className="mt-2">
            Your personal and professional projects
          </CardDescription>
        </div>
        {!showProjectForm && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowProjectForm(true)}
            className="absolute right-6 top-6"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Project
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {showProjectForm && (
          <ProjectForm
            project={
              editingProject !== null
                ? profile?.projects[editingProject]
                : undefined
            }
            onCancel={() => {
              setShowProjectForm(false);
              setEditingProject(null);
            }}
            onSubmit={handleProjectSubmit}
          />
        )}

        <div className="space-y-4 mt-4">
          {profile?.projects.map((project, index) => (
            <div
              key={index}
              className="p-4 border rounded-lg hover:bg-muted/50 relative group"
            >
              <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 mr-2"
                  onClick={() => {
                    setEditingProject(index);
                    setShowProjectForm(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive"
                  onClick={() => handleDeleteProject(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-1">
                <div className="flex gap-2">
                  <h4 className="text-lg font-semibold m-auto">
                    {project.name}
                  </h4>
                  <div className="flex gap-2">
                    {project.link && (
                      <a
                        href={project.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-500 hover:underline"
                      >
                        Project Link
                      </a>
                    )}
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-500 hover:underline"
                      >
                        GitHub
                      </a>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {project.startDate} - {project.endDate || "Present"}
                </p>
                <p className="text-sm mt-2">
                  {project.description?.join("\n")}
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  {project.highlights?.map((highlight, i) => (
                    <li key={i} className="text-sm">
                      {highlight}
                    </li>
                  ))}
                </ul>
                {project.technologies && project.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {project.technologies.map((tech, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-muted rounded-full text-xs"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
