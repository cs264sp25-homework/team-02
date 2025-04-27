import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/core/components/card";

interface SkillsCardProps {
  title: string;
  skills: string[];
  textColor?: string; // Optional prop for text color
}

const SkillsCard: React.FC<SkillsCardProps> = ({
  title,
  skills,
  textColor,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {skills.length > 0 ? (
          <ul className={`list-disc list-inside ${textColor || ""}`}>
            {skills.map((skill) => (
              <li key={skill}>{skill}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No skills to display.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default SkillsCard;
