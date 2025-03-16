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
import { ProfileType } from "convex/profiles";

interface SkillsProps {
  profile: ProfileType;
  onUpdate: (update: Partial<ProfileType>) => Promise<boolean>;
}

interface SkillFormProps {
  category?: string;
  skills?: string[];
  onCancel: () => void;
  onSubmit: (category: string, skills: string[]) => void;
}

const SkillForm = ({
  category,
  skills,
  onCancel,
  onSubmit,
}: SkillFormProps) => (
  <form
    onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const newCategory = formData.get("category") as string;
      const newSkills = (formData.get("skills") as string)
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean);

      onSubmit(newCategory, newSkills);
    }}
    className="space-y-4 mt-4 p-4 border rounded-lg"
  >
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="category">Category</Label>
        <Input
          id="category"
          name="category"
          defaultValue={category}
          required
          disabled={!!category}
          placeholder="e.g., Programming Languages, Frameworks, Tools"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="skills">Skills (comma-separated)</Label>
        <Input
          id="skills"
          name="skills"
          defaultValue={skills?.join(", ")}
          required
          placeholder="e.g., JavaScript, React, Node.js"
        />
      </div>
    </div>

    <div className="flex justify-end gap-2">
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit">{category ? "Update" : "Add"} Skills</Button>
    </div>
  </form>
);

export const Skills = ({ profile, onUpdate }: SkillsProps) => {
  const [editingSkillCategory, setEditingSkillCategory] = useState<
    string | null
  >(null);
  const [showSkillForm, setShowSkillForm] = useState(false);

  const handleSkillSubmit = async (category: string, skills: string[]) => {
    const updatedSkills = { ...(profile.skills || {}) };
    if (editingSkillCategory) {
      updatedSkills[editingSkillCategory] = skills;
    } else if (category) {
      updatedSkills[category] = skills;
    }

    const success = await onUpdate({ skills: updatedSkills });
    if (success) {
      setShowSkillForm(false);
      setEditingSkillCategory(null);
      toast.success(
        editingSkillCategory
          ? "Skills updated successfully"
          : "Skills added successfully",
      );
    }
  };

  const handleDeleteSkillCategory = async (category: string) => {
    const updatedSkills = { ...profile.skills };
    delete updatedSkills[category];
    const success = await onUpdate({ skills: updatedSkills });
    if (success) {
      toast.success("Skills category removed");
    }
  };

  return (
    <Card>
      <CardHeader className="relative text-center pb-8">
        <div>
          <CardTitle className="text-xl font-bold">Skills</CardTitle>
          <CardDescription className="mt-2">
            Your technical and professional skills
          </CardDescription>
        </div>
        {!showSkillForm && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSkillForm(true)}
            className="absolute right-6 top-6"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Skills
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {showSkillForm && (
          <SkillForm
            category={editingSkillCategory || undefined}
            skills={
              editingSkillCategory
                ? profile?.skills[editingSkillCategory]
                : undefined
            }
            onCancel={() => {
              setShowSkillForm(false);
              setEditingSkillCategory(null);
            }}
            onSubmit={handleSkillSubmit}
          />
        )}

        <div className="space-y-4 mt-4">
          {Object.entries(profile?.skills || {}).map(([category, skills]) => (
            <div
              key={category}
              className="p-4 border rounded-lg hover:bg-muted/50 relative group"
            >
              <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 mr-2"
                  onClick={() => {
                    setEditingSkillCategory(category);
                    setShowSkillForm(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive"
                  onClick={() => handleDeleteSkillCategory(category)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-2">
                <h4 className="text-lg font-semibold">{category}</h4>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-muted rounded-full text-xs"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
