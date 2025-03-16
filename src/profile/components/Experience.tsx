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
import { WorkExperienceType, ProfileType } from "convex/profiles";

interface ExperienceProps {
  profile: ProfileType;
  onUpdate: (update: Partial<ProfileType>) => Promise<boolean>;
}

interface ExperienceFormProps {
  experience?: WorkExperienceType;
  onCancel: () => void;
  onSubmit: (experience: WorkExperienceType) => void;
}

const ExperienceForm = ({
  experience,
  onCancel,
  onSubmit,
}: ExperienceFormProps) => (
  <form
    onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const newExperience: WorkExperienceType = {
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
      onSubmit(newExperience);
    }}
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
      <Button type="submit">{experience ? "Update" : "Add"} Experience</Button>
    </div>
  </form>
);

export const Experience = ({ profile, onUpdate }: ExperienceProps) => {
  const [editingExperience, setEditingExperience] = useState<number | null>(
    null,
  );
  const [showExperienceForm, setShowExperienceForm] = useState(false);

  const handleExperienceSubmit = async (newExperience: WorkExperienceType) => {
    const updatedExperience = [...(profile.workExperience || [])];
    if (editingExperience !== null) {
      updatedExperience[editingExperience] = newExperience;
    } else {
      updatedExperience.push(newExperience);
    }

    const success = await onUpdate({ workExperience: updatedExperience });
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
    const updatedExperience = [...profile.workExperience];
    updatedExperience.splice(index, 1);
    const success = await onUpdate({ workExperience: updatedExperience });
    if (success) {
      toast.success("Experience entry removed");
    }
  };

  return (
    <Card>
      <CardHeader className="relative text-center pb-8">
        <div>
          <CardTitle className="text-xl font-bold">Work Experience</CardTitle>
          <CardDescription className="mt-2">
            Your professional experience and roles
          </CardDescription>
        </div>
        {!showExperienceForm && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowExperienceForm(true)}
            className="absolute right-6 top-6"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Experience
          </Button>
        )}
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
            onSubmit={handleExperienceSubmit}
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
                  {exp.startDate} - {exp.current ? "Present" : exp.endDate}
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
  );
};
