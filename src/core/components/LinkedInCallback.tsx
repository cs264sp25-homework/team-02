import { useEffect, useState } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter } from "@/core/hooks/use-router";
import { Spinner } from "@/core/components/spinner";
import { Alert, AlertTitle, AlertDescription } from "@/core/components/alert";

export default function LinkedInCallback() {
  const { navigate } = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Get both the action and mutation
  const exchangeCode = useAction(api.linkedin.auth.exchangeLinkedInCode);
  const storeLinkedInUser = useMutation(api.linkedin.auth.storeLinkedInUser);
  
  useEffect(() => {
    const processCallback = async () => {
      // Get URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      const state = urlParams.get("state");
      const errorParam = urlParams.get("error");
      const errorDescription = urlParams.get("error_description");
      
      // Check for error from LinkedIn
      if (errorParam) {
        setError(`LinkedIn login failed: ${errorDescription || errorParam}`);
        return;
      }
      
      // Validate state to prevent CSRF attacks
      const savedState = localStorage.getItem("linkedInAuthState");
      if (!state || state !== savedState) {
        setError("Invalid state parameter. Login attempt may have been tampered with.");
        return;
      }
      
      // Clear the saved state
      localStorage.removeItem("linkedInAuthState");
      
      if (!code) {
        setError("Authorization code not found in the callback URL.");
        return;
      }
      
      try {
        console.log("Exchanging code for token...");
        
        // Exchange the code for a token and user info using the action
        const userInfo = await exchangeCode({ code });
        console.log("Token exchange result:", userInfo);
        
        // Now, use the mutation to store the user data in the database
        // This is a simplified version since the full data is returned from the action
        // In a production app, you'd likely get more complete user data from the action
        // and then store it using the mutation
        
        setSuccess(true);
        
        // Redirect to profile page after successful login
        setTimeout(() => {
          navigate("profile");
        }, 1500);
      } catch (err) {
        console.error("LinkedIn auth error:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred during LinkedIn login.");
      }
    };
    
    processCallback();
  }, [exchangeCode, storeLinkedInUser, navigate]);
  
  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      {!error && !success && (
        <div className="flex flex-col items-center space-y-4">
          <Spinner size="lg" />
          <p className="text-lg">Completing your LinkedIn sign-in...</p>
        </div>
      )}
      
      {error && (
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="max-w-md border-green-500 bg-green-50 text-green-800">
          <AlertTitle>Success!</AlertTitle>
          <AlertDescription>
            Successfully signed in with LinkedIn. Redirecting...
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}