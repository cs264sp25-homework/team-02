import { useRouter } from "@/core/hooks/use-router";
import NotFoundPage from "./core/pages/not-found-page";
import Demo from "./core/pages/demo";
import Empty from "./core/pages/empty";
import LoginPage from "./linkedin/pages/log-in";
import ProfilePage from "./profile/pages/profile";
import AddFile from "./file_upload/add_file";
import ImportJobPage from "./jobs/pages/import-job";
import JobDetailsPage from "./jobs/pages/job-details";
import LinkedInCallback from "./linkedin/components/LinkedInCallback";
import NavBar from "@/core/components/navbar";
import HomePage from "./core/pages/home-page";

function App() {
  const { currentRoute } = useRouter();

  if (!currentRoute) {
    return <NotFoundPage />;
  }

  // Skip navbar on login and auth callback routes
  const showNavbar = !["login", "auth_callback"].includes(currentRoute);

  const renderContent = () => {
    switch (currentRoute) {
      case "home":
        return <HomePage />;
      case "demo":
        return <Demo />;
      case "login":
        return <LoginPage />;
      case "profile":
        return <ProfilePage />;
      case "add_file":
        return <AddFile />;
      case "auth_callback":
        return <LinkedInCallback />;
      case "import_job":
        return <ImportJobPage />;
      case "job_details":
        return <JobDetailsPage />;
      default:
        return <NotFoundPage />;
    }
  };

  const content = renderContent();

  return (
    <>
      {showNavbar && <NavBar />}
      <div
        className={`flex flex-col items-center justify-center min-h-svh ${showNavbar ? "pt-16" : ""}`}
      >
        {content}
      </div>
    </>
  );
}

export default App;
