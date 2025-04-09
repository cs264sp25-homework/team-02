import Layout from "@/resume/layout";
import { useAuth } from "@/linkedin/hooks/useAuth";
import { useRouter } from "@/core/hooks/use-router";
const EditResume = () => {
  const { isLoading, isAuthenticated } = useAuth();
  const { redirect } = useRouter();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    redirect("login");
  }
  return (
    <Layout
      leftPanelContent={<div>Left Panel</div>}
      middlePanelContent={<div>Middle Panel</div>}
      rightPanelContent={null}
    />
  );
};

export default EditResume;
