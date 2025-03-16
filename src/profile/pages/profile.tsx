import { useGetOrCreateProfile } from "../hooks/use-get-or-create-profile";
import { useMutationProfile } from "../hooks/use-mutation-profile";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/core/components/tabs";
import { useState } from "react";
import { Skeleton } from "@/core/components/skeleton";
import { toast } from "sonner";
import { Doc } from "convex/_generated/dataModel";
import { PlusCircle, Pencil, X } from "lucide-react";

interface Education {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
  gpa?: number;
  description?: string;
  location?: string;
}

interface WorkExperience {
  company: string;
  position: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description: string[];
  technologies?: string[];
}

interface Project {
  name: string;
  description: string[];
  startDate?: string;
  endDate?: string;
  technologies: string[];
  link?: string;
  githubUrl?: string;
  highlights?: string[];
}

interface EducationFormProps {
  education?: Education;
  onCancel: () => void;
}

interface ExperienceFormProps {
  experience?: WorkExperience;
  onCancel: () => void;
}

interface ProjectFormProps {
  project?: Project;
  onCancel: () => void;
}

const ProfilePage = () => {
  const { data: profile, loading } = useGetOrCreateProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [editingEducation, setEditingEducation] = useState<number | null>(null);
  const [showEducationForm, setShowEducationForm] = useState(false);
  const [editingExperience, setEditingExperience] = useState<number | null>(
    null,
  );
  const [showExperienceForm, setShowExperienceForm] = useState(false);
  const [editingProject, setEditingProject] = useState<number | null>(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const mutation = useMutationProfile((profile as Doc<"profiles">)?._id);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile) return;

    const formData = new FormData(e.currentTarget);

    const updatedProfile = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: (formData.get("phone") as string) || undefined,
      location: (formData.get("location") as string) || undefined,
    };

    const success = await mutation.edit(updatedProfile);
    if (success) {
      setIsEditing(false);
      toast.success("Profile updated successfully");
    }
  };

  const handleEducationSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile) return;

    const formData = new FormData(e.currentTarget);
    const newEducation: Education = {
      institution: formData.get("institution") as string,
      degree: formData.get("degree") as string,
      field: formData.get("field") as string,
      startDate: formData.get("startDate") as string,
      endDate: (formData.get("endDate") as string) || undefined,
      gpa: formData.get("gpa") ? Number(formData.get("gpa")) : undefined,
      description: (formData.get("description") as string) || undefined,
      location: (formData.get("location") as string) || undefined,
    };

    const updatedEducation = [...(profile.education || [])];
    if (editingEducation !== null) {
      updatedEducation[editingEducation] = newEducation;
    } else {
      updatedEducation.push(newEducation);
    }

    const success = await mutation.edit({ education: updatedEducation });
    if (success) {
      setShowEducationForm(false);
      setEditingEducation(null);
      toast.success(
        editingEducation !== null
          ? "Education updated successfully"
          : "Education added successfully",
      );
    }
  };

  const handleDeleteEducation = async (index: number) => {
    if (!profile) return;
    const updatedEducation = [...profile.education];
    updatedEducation.splice(index, 1);
    const success = await mutation.edit({ education: updatedEducation });
    if (success) {
      toast.success("Education entry removed");
    }
  };

  const handleExperienceSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    if (!profile) return;

    const formData = new FormData(e.currentTarget);
    const newExperience: WorkExperience = {
      company: formData.get("company") as string,
      position: formData.get("position") as string,
      location: (formData.get("location") as string) || undefined,
      startDate: formData.get("startDate") as string,
      endDate: (formData.get("endDate") as string) || undefined,
      current: formData.get("current") === "true",
      description: (formData.get("description") as string)
        .split("\n")
        .filter(Boolean),
      technologies: (formData.get("technologies") as string)
        .split(",")
        .map((tech) => tech.trim())
        .filter(Boolean),
    };

    const updatedExperience = [...(profile.workExperience || [])];
    if (editingExperience !== null) {
      updatedExperience[editingExperience] = newExperience;
    } else {
      updatedExperience.push(newExperience);
    }

    const success = await mutation.edit({ workExperience: updatedExperience });
    if (success) {
      setShowExperienceForm(false);
      setEditingExperience(null);
      toast.success(
        editingExperience !== null
          ? "Experience updated successfully"
          : "Experience added successfully",
      );
    }
  };

  const handleDeleteExperience = async (index: number) => {
    if (!profile) return;
    const updatedExperience = [...profile.workExperience];
    updatedExperience.splice(index, 1);
    const success = await mutation.edit({ workExperience: updatedExperience });
    if (success) {
      toast.success("Experience entry removed");
    }
  };

  const handleProjectSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile) return;

    const formData = new FormData(e.currentTarget);
    const newProject: Project = {
      name: formData.get("name") as string,
      description: (formData.get("description") as string)
        .split("\n")
        .filter(Boolean),
      startDate: (formData.get("startDate") as string) || undefined,
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

    const updatedProjects = [...(profile.projects || [])];
    if (editingProject !== null) {
      updatedProjects[editingProject] = newProject;
    } else {
      updatedProjects.push(newProject);
    }

    const success = await mutation.edit({ projects: updatedProjects });
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
    if (!profile) return;
    const updatedProjects = [...profile.projects];
    updatedProjects.splice(index, 1);
    const success = await mutation.edit({ projects: updatedProjects });
    if (success) {
      toast.success("Project removed");
    }
  };

  const EducationForm = ({ education, onCancel }: EducationFormProps) => (
    <form
      onSubmit={handleEducationSubmit}
      className="space-y-4 mt-4 p-4 border rounded-lg"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="institution">Institution</Label>
          <Input
            id="institution"
            name="institution"
            defaultValue={education?.institution}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="degree">Degree</Label>
          <Input
            id="degree"
            name="degree"
            defaultValue={education?.degree}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="field">Field of Study</Label>
          <Input
            id="field"
            name="field"
            defaultValue={education?.field}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            name="location"
            defaultValue={education?.location}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={education?.startDate}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            defaultValue={education?.endDate}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="gpa">GPA</Label>
          <Input
            id="gpa"
            name="gpa"
            type="number"
            step="0.01"
            min="0"
            max="4"
            defaultValue={education?.gpa}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            name="description"
            defaultValue={education?.description}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{education ? "Update" : "Add"} Education</Button>
      </div>
    </form>
  );

  const ExperienceForm = ({ experience, onCancel }: ExperienceFormProps) => (
    <form
      onSubmit={handleExperienceSubmit}
      className="space-y-4 mt-4 p-4 border rounded-lg"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="company">Company</Label>
          <Input
            id="company"
            name="company"
            defaultValue={experience?.company}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="position">Position</Label>
          <Input
            id="position"
            name="position"
            defaultValue={experience?.position}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            name="location"
            defaultValue={experience?.location}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={experience?.startDate}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            defaultValue={experience?.endDate}
            disabled={experience?.current}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="current">Current Position</Label>
          <Input
            id="current"
            name="current"
            type="checkbox"
            className="h-4 w-4"
            defaultChecked={experience?.current}
            onChange={(e) => {
              const endDateInput = document.getElementById(
                "endDate",
              ) as HTMLInputElement;
              if (endDateInput) {
                endDateInput.disabled = e.target.checked;
                if (e.target.checked) {
                  endDateInput.value = "";
                }
              }
            }}
          />
        </div>

        <div className="grid gap-2 md:col-span-2">
          <Label htmlFor="description">Description (one item per line)</Label>
          <textarea
            id="description"
            name="description"
            className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            defaultValue={experience?.description.join("\n")}
            required
          />
        </div>

        <div className="grid gap-2 md:col-span-2">
          <Label htmlFor="technologies">Technologies (comma-separated)</Label>
          <Input
            id="technologies"
            name="technologies"
            defaultValue={experience?.technologies?.join(", ")}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {experience ? "Update" : "Add"} Experience
        </Button>
      </div>
    </form>
  );

  const ProjectForm = ({ project, onCancel }: ProjectFormProps) => (
    <form
      onSubmit={handleProjectSubmit}
      className="space-y-4 mt-4 p-4 border rounded-lg"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2 md:col-span-2">
          <Label htmlFor="name">Project Name</Label>
          <Input id="name" name="name" defaultValue={project?.name} required />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={project?.startDate}
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

        <div className="grid gap-2 md:col-span-2">
          <Label htmlFor="description">Description (one item per line)</Label>
          <textarea
            id="description"
            name="description"
            className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            defaultValue={project?.description.join("\n")}
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
          />
        </div>

        <div className="grid gap-2 md:col-span-2">
          <Label htmlFor="technologies">Technologies (comma-separated)</Label>
          <Input
            id="technologies"
            name="technologies"
            defaultValue={project?.technologies.join(", ")}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="link">Project Link</Label>
          <Input
            id="link"
            name="link"
            type="url"
            defaultValue={project?.link}
          />
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
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{project ? "Update" : "Add"} Project</Button>
      </div>
    </form>
  );

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-[250px]" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Tabs defaultValue="basic" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="education">Education</TabsTrigger>
            <TabsTrigger value="experience">Experience</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
          </TabsList>
          <Button
            variant={isEditing ? "secondary" : "default"}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? "Cancel" : "Edit Profile"}
          </Button>
        </div>

        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Your personal and contact information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={profile?.name}
                      disabled={!isEditing}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      defaultValue={profile?.email}
                      disabled={!isEditing}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      defaultValue={profile?.phone || ""}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      name="location"
                      defaultValue={profile?.location || ""}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end">
                    <Button type="submit">Save Changes</Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="education">
          <Card>
            <CardHeader>
              <div className="flex justify-between">
                <div>
                  <CardTitle>Education</CardTitle>
                  <CardDescription>
                    Your academic background and achievements
                  </CardDescription>
                </div>
                {!showEducationForm && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEducationForm(true)}
                  >
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Add Education
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {showEducationForm && (
                <EducationForm
                  education={
                    editingEducation !== null
                      ? profile?.education[editingEducation]
                      : undefined
                  }
                  onCancel={() => {
                    setShowEducationForm(false);
                    setEditingEducation(null);
                  }}
                />
              )}

              <div className="space-y-4 mt-4">
                {profile?.education.map((edu, index) => (
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
                          setEditingEducation(index);
                          setShowEducationForm(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive"
                        onClick={() => handleDeleteEducation(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid gap-1">
                      <h4 className="text-lg font-semibold">
                        {edu.institution}
                      </h4>
                      <p className="text-muted-foreground">
                        {edu.degree} in {edu.field}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {edu.startDate} - {edu.endDate || "Present"}
                        {edu.location && ` • ${edu.location}`}
                        {edu.gpa && ` • GPA: ${edu.gpa}`}
                      </p>
                      {edu.description && (
                        <p className="text-sm mt-2">{edu.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="experience">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Work Experience</CardTitle>
                  <CardDescription>
                    Your professional experience and roles
                  </CardDescription>
                </div>
                {!showExperienceForm && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowExperienceForm(true)}
                  >
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Add Experience
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {showExperienceForm && (
                <ExperienceForm
                  experience={
                    editingExperience !== null
                      ? profile?.workExperience[editingExperience]
                      : undefined
                  }
                  onCancel={() => {
                    setShowExperienceForm(false);
                    setEditingExperience(null);
                  }}
                />
              )}

              <div className="space-y-4 mt-4">
                {profile?.workExperience.map((exp, index) => (
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
                          setEditingExperience(index);
                          setShowExperienceForm(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive"
                        onClick={() => handleDeleteExperience(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid gap-1">
                      <h4 className="text-lg font-semibold">{exp.position}</h4>
                      <p className="text-muted-foreground">
                        {exp.company}
                        {exp.location && ` • ${exp.location}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {exp.startDate} -{" "}
                        {exp.current ? "Present" : exp.endDate}
                      </p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        {exp.description.map((desc, i) => (
                          <li key={i} className="text-sm">
                            {desc}
                          </li>
                        ))}
                      </ul>
                      {exp.technologies && exp.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {exp.technologies.map((tech, i) => (
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
        </TabsContent>

        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Projects</CardTitle>
                  <CardDescription>
                    Your personal and professional projects
                  </CardDescription>
                </div>
                {!showProjectForm && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowProjectForm(true)}
                  >
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Add Project
                  </Button>
                )}
              </div>
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

                    <div className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-semibold">
                          {project.name}
                        </h4>
                        <div className="flex gap-2">
                          {project.link && (
                            <a
                              href={project.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-muted-foreground hover:text-primary"
                            >
                              Project Link ↗
                            </a>
                          )}
                          {project.githubUrl && (
                            <a
                              href={project.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-muted-foreground hover:text-primary"
                            >
                              GitHub ↗
                            </a>
                          )}
                        </div>
                      </div>

                      {(project.startDate || project.endDate) && (
                        <p className="text-sm text-muted-foreground">
                          {project.startDate && project.startDate}
                          {project.startDate && project.endDate && " - "}
                          {project.endDate && project.endDate}
                        </p>
                      )}

                      <ul className="list-disc list-inside mt-2 space-y-1">
                        {project.description.map((desc, i) => (
                          <li key={i} className="text-sm">
                            {desc}
                          </li>
                        ))}
                      </ul>

                      {project.highlights && project.highlights.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium mb-1">
                            Key Highlights:
                          </p>
                          <ul className="list-disc list-inside space-y-1">
                            {project.highlights.map((highlight, i) => (
                              <li
                                key={i}
                                className="text-sm text-muted-foreground"
                              >
                                {highlight}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

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
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills">
          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
              <CardDescription>
                Your technical and professional skills
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Skills form fields will be added here */}
              <div className="text-center text-muted-foreground">
                Skills section coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfilePage;
