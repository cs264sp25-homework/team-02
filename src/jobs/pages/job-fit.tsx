import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/core/components/card";
import { Progress } from "@/core/components/progress"; // Assuming you have a progress bar component
import { useRouter } from "@/core/hooks/use-router";
import { Id } from "../../../convex/_generated/dataModel";
import { useQueryProfile } from "../../profile/hooks/use-query-profile";
import { useAuth } from "@/linkedin/hooks/useAuth";
import { useQueryJob } from "../hooks/use-query-job";
import { Button } from "@/core/components/button";
import SkillsCard from "../components/SkillsCard";
import SummaryCard from "../components/SummaryCard";
import { api } from "../../../convex/_generated/api";
import { useAction } from "convex/react";
import { useEffect, useState } from "react";

const JobFitPage = () => {
  const { isAuthenticated, user } = useAuth();
  const { redirect } = useRouter();

  if (!isAuthenticated) {
    redirect("login");
  }

  const { params } = useRouter();
  const jobId = params.jobId as Id<"jobs">;

  const { data: profile, loading } = useQueryProfile(user!.id);
  const { data: job, loading: jobLoading } = useQueryJob(jobId, user!.id);

  const userSkills = profile?.skills || [];
  const requiredSkills = job?.requiredSkills || [];

  const [summary, setSummary] = useState<string>("");

  const getJobFitSummary = useAction(api.jobFitSummary.generateJobFitSummary);

  useEffect(() => {
    // Don't run until job, profile, and user are all available
    if (!job || !profile || !user) return;

    // Don't regenerate if the summary already exists
    if (job.jobFitSummary && job.jobFitSummary !== "") {
      setSummary(job.jobFitSummary);
      return;
    }

    // Only fetch the summary if it's empty
    const fetchJobFitSummary = async () => {
      try {
        const jobFitSummary = await getJobFitSummary({
          jobId,
          userId: user.id,
        });
        setSummary(jobFitSummary);
      } catch (error) {
        console.error("Error fetching job fit summary:", error);
      }
    };

    fetchJobFitSummary();
  }, [job, profile, user, getJobFitSummary, jobId]);

  if (loading || jobLoading || !profile || !job) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <Card>
          <CardContent>
            <p className="text-gray-500">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (userSkills.length === 0) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <Card>
          <CardContent>
            <p className="text-gray-500">
              You need to add skills to your profile before we can analyze your
              fit for this job.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                redirect("profile_skills");
              }}
            >
              Add Skills
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading || jobLoading) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <Card>
          <CardContent>
            <p className="text-gray-500">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const matchedSkills = requiredSkills.filter((skill) =>
    userSkills.includes(skill),
  );
  const missingSkills = requiredSkills.filter(
    (skill) => !userSkills.includes(skill),
  );

  const fitPercentage = (matchedSkills.length / requiredSkills.length) * 100;
  let fitLevel = "Unknown";

  if (fitPercentage >= 75) {
    fitLevel = "Strong Fit";
  } else if (fitPercentage >= 50) {
    fitLevel = "Moderate Fit";
  } else {
    fitLevel = "Weak Fit";
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-4xl font-bold mb-5">Job Fit Analysis</h1>
      <div className="flex flex-col space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Fit Level: {fitLevel}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative w-full">
              <Progress
                value={fitPercentage}
                className="h-4 rounded-full bg-gray-200"
              />
              <span className="absolute inset-0 flex items-center justify-center text-sm font-medium text-white">
                {Math.round(fitPercentage)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <SummaryCard title="Analysis Summary" summary={summary}></SummaryCard>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SkillsCard title="Matched Skills" skills={matchedSkills} />
          <SkillsCard
            title="Missing Skills"
            skills={missingSkills}
            textColor="text-red-500"
          />
        </div>
      </div>
    </div>
  );
};

export default JobFitPage;
