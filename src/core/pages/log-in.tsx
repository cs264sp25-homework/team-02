import { LinkedInLoginButton } from "@/core/components/LinkedInLoginButton";

const LoginPage: React.FC = () => {

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md p-8 mx-auto space-y-8">
      <div className="flex flex-col items-center space-y-2 text-center">
        <h1 className="text-3xl font-bold">Welcome</h1>
        <p className="text-muted-foreground">
          Sign in with your LinkedIn account
        </p>
      </div>

      <div className="w-full">
        <LinkedInLoginButton className="w-full" />
      </div>
    </div>
  );
};

export default LoginPage;