import { useState } from "react";
import { useRouter } from "../hooks/use-router";
import { Button } from "../components/button";
import { cn } from "@/lib/utils";
import { LinkedInLoginButton } from "@/core/components/LinkedInLoginButton";

const LoginPage: React.FC = () => {
  const { navigate } = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulating authentication
    // TODO replace with authentication logic
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Login attempted with:", { email, password });
      // Navigate to home page after login

      navigate("home");
    } catch (error) {
      console.error("Login failed: ", error);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md p-8 mx-auto space-y-8">
      <div className="flex flex-col items-center space-y-2 text-center">
        <h1 className="text-3xl font-bold">Welcome back</h1>
        <p className="text-muted-foreground">
          Enter your credentials to sign in to your account
        </p>
      </div>

      <div className="w-full">
        <LinkedInLoginButton className="w-full" />
      </div>

      <div className="relative w-full">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t"></span>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              className={cn(
                "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors",
                "placeholder:text-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
              placeholder="m@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => console.log("Forgot password clicked")}
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <input
              id="password"
              type="password"
              className={cn(
                "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors",
                "placeholder:text-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <div className="text-center text-sm">
        <span className="text-muted-foreground">Don't have an account? </span>
        <button
          onClick={() => console.log("Sign up clicked")}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Sign up
        </button>
      </div>
    </div>
  );
};

export default LoginPage;