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

interface EducationFormProps {
  education?: Education;
  onCancel: () => void;
}

const ProfilePage = () => {
  const { data: profile, loading } = useGetOrCreateProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [editingEducation, setEditingEducation] = useState<number | null>(null);
  const [showEducationForm, setShowEducationForm] = useState(false);
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
              <CardTitle>Work Experience</CardTitle>
              <CardDescription>
                Your professional experience and roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Work experience form fields will be added here */}
              <div className="text-center text-muted-foreground">
                Work experience section coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <CardTitle>Projects</CardTitle>
              <CardDescription>
                Your personal and professional projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Projects form fields will be added here */}
              <div className="text-center text-muted-foreground">
                Projects section coming soon
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
