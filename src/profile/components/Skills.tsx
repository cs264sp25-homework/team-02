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
import { PlusCircle, X } from "lucide-react";
import { ProfileType } from "convex/profiles";

interface SkillsProps {
  profile: ProfileType;
  onUpdate: (update: Partial<ProfileType>) => Promise<boolean>;
}

interface SkillFormProps {
  skills: string[];
  onCancel: () => void;
  onSubmit: (skills: string[]) => void;
}

const SkillForm = ({ skills, onCancel, onSubmit }: SkillFormProps) => (
  <form
    onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const newSkills = (formData.get("skills") as string)
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean);

      onSubmit(newSkills);
    }}
    className="space-y-4 mt-4 p-4 border rounded-lg"
  >
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="skills">Skills (comma-separated)</Label>
        <Input
          id="skills"
          name="skills"
          defaultValue={skills?.join(", ")}
          required
          placeholder="e.g., JavaScript, React, Node.js, Python, SQL, Git"
        />
      </div>
    </div>

    <div className="flex justify-end gap-2">
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit">Update Skills</Button>
    </div>
  </form>
);

export const Skills = ({ profile, onUpdate }: SkillsProps) => {
  const [showSkillForm, setShowSkillForm] = useState(false);

  const handleSkillSubmit = async (skills: string[]) => {
    const success = await onUpdate({ skills });
    if (success) {
      setShowSkillForm(false);
      toast.success("Skills updated successfully");
    }
  };

  const handleRemoveSkill = async (skillToRemove: string) => {
    const updatedSkills = profile.skills.filter(
      (skill) => skill !== skillToRemove,
    );
    const success = await onUpdate({ skills: updatedSkills });
    if (success) {
      toast.success("Skill removed");
    }
  };

  return (
    <Card id="skills">
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
            Edit Skills
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {showSkillForm && (
          <SkillForm
            skills={profile?.skills || []}
            onCancel={() => {
              setShowSkillForm(false);
            }}
            onSubmit={handleSkillSubmit}
          />
        )}

        <div className="flex flex-wrap gap-2 mt-4">
          {profile?.skills?.map((skill, i) => (
            <div
              key={i}
              className="flex items-center px-3 py-1 bg-muted rounded-full text-sm group"
            >
              {skill}
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemoveSkill(skill)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}

          {(!profile?.skills || profile.skills.length === 0) && (
            <div className="text-muted-foreground text-sm">
              No skills added yet. Click 'Edit Skills' to add your skills.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
