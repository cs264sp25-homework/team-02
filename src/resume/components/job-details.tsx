import { useQueryJob } from "@/jobs/hooks/use-query-job";
import { Spinner } from "@/linkedin/components/spinner";

function JobDetails({ jobId, userId }: { jobId: string; userId: string }) {
  const { data: job, loading: jobLoading } = useQueryJob(jobId, userId);

  if (jobLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <Spinner size="lg" />
        <p className="mt-4 text-sm text-gray-500">Loading job details...</p>
      </div>
    );
  }

  if (!job) {
    return <div className="p-4 text-red-500">Failed to load job details</div>;
  }

  return (
    <div className="p-4 space-y-4 mt-5">
      <h2 className="text-xl font-semibold">{job.title}</h2>
      <div className="prose max-w-none">
        <h3 className="text-lg font-medium mb-2">Job Description</h3>
        <div className="whitespace-pre-wrap text-left">{job.description}</div>
      </div>
      <div className="mt-4">
        <button
          onClick={() =>
            window.open(job.applicationUrl, "_blank", "noopener,noreferrer")
          }
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
        >
          Apply Now
        </button>
      </div>
    </div>
  );
}

export default JobDetails;
