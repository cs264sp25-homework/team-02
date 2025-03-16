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
import { EducationType, ProfileType } from "convex/profiles";

interface EducationProps {
  profile: ProfileType;
  onUpdate: (update: Partial<ProfileType>) => Promise<boolean>;
}

interface EducationFormProps {
  education?: EducationType;
  onCancel: () => void;
  onSubmit: (education: EducationType) => void;
}

const EducationForm = ({
  education,
  onCancel,
  onSubmit,
}: EducationFormProps) => (
  <form
    onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const newEducation: EducationType = {
        institution: formData.get("institution") as string,
        degree: formData.get("degree") as string,
        field: formData.get("field") as string,
        startDate: formData.get("startDate") as string,
        endDate: (formData.get("endDate") as string) || undefined,
        gpa: formData.get("gpa") ? Number(formData.get("gpa")) : undefined,
        description: (formData.get("description") as string) || undefined,
        location: (formData.get("location") as string) || undefined,
      };
      onSubmit(newEducation);
    }}
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

export const Education = ({ profile, onUpdate }: EducationProps) => {
  const [editingEducation, setEditingEducation] = useState<number | null>(null);
  const [showEducationForm, setShowEducationForm] = useState(false);

  const handleEducationSubmit = async (newEducation: EducationType) => {
    const updatedEducation = [...(profile.education || [])];
    if (editingEducation !== null) {
      updatedEducation[editingEducation] = newEducation;
    } else {
      updatedEducation.push(newEducation);
    }

    const success = await onUpdate({ education: updatedEducation });
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
    const updatedEducation = [...profile.education];
    updatedEducation.splice(index, 1);
    const success = await onUpdate({ education: updatedEducation });
    if (success) {
      toast.success("Education entry removed");
    }
  };

  return (
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
            onSubmit={handleEducationSubmit}
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
                <h4 className="text-lg font-semibold">{edu.institution}</h4>
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
  );
};
