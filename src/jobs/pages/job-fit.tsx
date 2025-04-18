import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/core/components/card";
import { Progress } from "@/core/components/progress"; // Assuming you have a progress bar component
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

const JobFitPage = () => {
  let matchedSkills = ["JavaScript", "React", "Node.js"]; // Example matched skills
  let missingSkills = ["TypeScript", "GraphQL"]; // Example missing skills
  // const userSkills = useQuery(api.skills.getUserSkills); // Fetch user's skills
  // const jobSkills = useQuery(api.jobs.getJobSkills, { jobId: "exampleJobId" }); // Fetch job's required skills

  // if (!userSkills || !jobSkills) {
  //   return <div>Loading...</div>;
  // }

  // Compare user skills with job skills
  // const matchedSkills = jobSkills.filter((skill) => userSkills.includes(skill));
  // const missingSkills = jobSkills.filter(
  //   (skill) => !userSkills.includes(skill),
  // );

  // Determine fit level
  // const fitPercentage = (matchedSkills.length / jobSkills.length) * 100;
  let fitLevel = "Strong Fit";
  // if (fitPercentage >= 75) {
  //   fitLevel = "Strong Fit";
  // } else if (fitPercentage >= 50) {
  //   fitLevel = "Moderate Fit";
  // }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Job Fit Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Fit Level: {fitLevel}</h2>
            <Progress value={100} />
          </div>
          <div className="mb-6">
            <h3 className="text-lg font-semibold">Matched Skills</h3>
            <ul className="list-disc list-inside">
              {matchedSkills.map((skill) => (
                <li key={skill}>{skill}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Missing Skills</h3>
            <ul className="list-disc list-inside text-red-500">
              {missingSkills.map((skill) => (
                <li key={skill}>{skill}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JobFitPage;
