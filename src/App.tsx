import { useRouter } from "@/core/hooks/use-router";
import NotFoundPage from "./core/pages/not-found-page";
import Demo from "./core/pages/demo";
import Empty from "./core/pages/empty";
import LoginPage from "./core/pages/log-in";
import ProfilePage from "./profile/pages/profile";
import AddFile from "./file_upload/add_file";
import ImportJobPage from "./jobs/pages/import-job";
function App() {
  const { currentRoute } = useRouter();

  if (!currentRoute) {
    return <NotFoundPage />;
  }

  const renderContent = () => {
    switch (currentRoute) {
      case "home":
        return <Empty message="Please see modify routes in App.tsx" />;
      case "demo":
        return <Demo />;
      case "login":
        return <LoginPage />;
      case "profile":
        return <ProfilePage />;
      case "add_file":
        return <AddFile />;
      case "import_job":
        return <ImportJobPage />;
      default:
        return <NotFoundPage />;
    }
  };

  const content = renderContent();

  return (
    <div className="flex flex-col items-center justify-center min-h-svh">
      {content}
    </div>
  );
}

export default App;
