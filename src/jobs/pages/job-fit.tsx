import { Card, CardContent } from "@/core/components/card";
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
import { useEffect, useState, useCallback } from "react";

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

  const fetchJobFitSummary = useCallback(async () => {
    if (!job || !profile || !user) return;

    try {
      const jobFitSummary = await getJobFitSummary({
        jobId,
        userId: user.id,
      });
      setSummary(jobFitSummary);
    } catch (error) {
      console.error("Error fetching job fit summary:", error);
    }
  }, [job, profile, user, getJobFitSummary, jobId]);

  useEffect(() => {
    // Don't run until job, profile, and user are all available
    if (!job || !profile || !user) return;

    // Don't regenerate if the summary already exists
    if (job.jobFitSummary && job.jobFitSummary !== "") {
      setSummary(job.jobFitSummary);
    } else {
      fetchJobFitSummary();
    }
  }, [job, profile, user, fetchJobFitSummary]);

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

  const matchedSkills = requiredSkills.filter((skill) =>
    userSkills.includes(skill),
  );
  const missingSkills = requiredSkills.filter(
    (skill) => !userSkills.includes(skill),
  );

  return (
    <div className="container mx-auto max-w-5xl px-4 py-2">
      <h1 className="text-3xl font-bold mb-5">Job Fit Analysis</h1>
      <div className="flex flex-col space-y-8">
        <SummaryCard
          title="Summary"
          summary={summary}
          onRegenerate={fetchJobFitSummary}
        ></SummaryCard>

        {userSkills.length === 0 ? (
          <div className="container mx-auto max-w-5xl px-4 py-8">
            <Card>
              <CardContent>
                <p className="text-gray-500">
                  You need to add skills to your profile to see matched and
                  missing skills.
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SkillsCard title="Matched Skills" skills={matchedSkills} />
            <SkillsCard
              title="Missing Skills"
              skills={missingSkills}
              textColor="text-red-500"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default JobFitPage;
