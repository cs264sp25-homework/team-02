import { useEffect, useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter } from "@/core/hooks/use-router";
import { Spinner } from "@/linkedin/components/spinner";
import { Alert, AlertTitle, AlertDescription } from "@/linkedin/components/alert";
import { Button } from "@/core/components/button";
import { useMutation } from "convex/react";
import { logger } from "@/lib/logger";

export default function LinkedInCallback() {
  const { navigate } = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [stateError, setStateError] = useState<boolean>(false);
  const [receivedState, setReceivedState] = useState<string | null>(null);
  const [savedState, setSavedState] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [processed, setProcessed] = useState(false);

  // Get the action
  const exchangeCode = useAction(api.linkedin.auth.exchangeLinkedInCode);
  const storeUser = useMutation(api.linkedin.auth.storeLinkedInUser);
  
  useEffect(() => {
    const processCallback = async () => {
      // Skip if we've already processed this callback
      if (processed) return;
      setProcessed(true);

      try {
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        const state = urlParams.get("state");
        const errorParam = urlParams.get("error");
        const errorDescription = urlParams.get("error_description");

        // Check for error from LinkedIn
        if (errorParam) {
          // Use error level for authentication failures from the provider
          logger.error("LinkedIn auth error from provider", { 
            error: errorParam, 
            description: errorDescription 
          });
          setError(`LinkedIn login failed: ${errorDescription || errorParam}`);
          return;
        }

        // Try to get the state from both localStorage and sessionStorage
        const stateFromLocalStorage = localStorage.getItem("linkedInAuthState");
        const stateFromSessionStorage = sessionStorage.getItem("linkedInAuthState");
        const storedState = stateFromLocalStorage || stateFromSessionStorage;

        // Use debug level for detailed troubleshooting info (only needed during development)
        logger.debug("Retrieved state values", {
          fromLocalStorage: stateFromLocalStorage,
          fromSessionStorage: stateFromSessionStorage,
          received: state,
        });

        // Save state values for debugging
        setReceivedState(state);
        setSavedState(storedState);

        // Validate state parameter to prevent CSRF attacks
        if (!state || !storedState || state !== storedState) {
          // Use warn level for security concerns - these might be important in production too
          logger.warn("OAuth state parameter validation failed", {
            receivedState: state ? "present" : "missing",
            storedState: storedState ? "present" : "missing",
            match: state === storedState ? "yes" : "no"
          });
          setStateError(true);
          setError("Authentication failed: Security validation error.");
          return;
        }

        // Clear the saved state
        localStorage.removeItem("linkedInAuthState");
        sessionStorage.removeItem("linkedInAuthState");

        if (!code) {
          // Use error level for missing required parameters
          logger.error("Missing authorization code");
          setError("Authorization code not found in the callback URL.");
          return;
        }

        // Use info level for tracking progress through important steps
        logger.info("Exchanging authorization code for token");

        // Exchange the code for a token and user info
        const result = await exchangeCode({ code });
        
        // Use debug for detailed response data (which could contain sensitive info)
        logger.debug("Token exchange completed", {
          success: !!result,
          hasUserData: result && result.firstName ? true : false
        });

        // Store the user data
        if (result) {
          try {
            const storeResult = await storeUser({
              linkedInId: result.linkedInId,
              firstName: result.firstName,
              lastName: result.lastName,
              email: result.email,
              profilePictureUrl: result.profilePictureUrl,
              locale: result.locale,
              accessToken: result.accessToken,
              expiresAt: result.expiresAt,
            });
            
            // Use info for successful operations
            logger.info("User successfully stored in database", { userId: storeResult?.userId });
          } catch (storeError) {
            // Use error for operation failures
            logger.error("Failed to store user data", { error: storeError });
            // Continue anyway so the user isn't stuck
          }
        }

        setSuccess(true);

        // Use info for user navigation events
        logger.info("Authentication successful, redirecting to profile");

        // Redirect to profile page after successful login
        setTimeout(() => {
          navigate("profile");
        }, 1500);
      } catch (err) {
        // Use error for unexpected exceptions
        logger.error("Unhandled exception during LinkedIn authentication", { 
          error: err instanceof Error ? err.message : String(err)
        });
        
        setError(
          err instanceof Error
            ? err.message
            : "An unknown error occurred during LinkedIn login."
        );
      }
    };

    processCallback();
  }, [exchangeCode, navigate, processed, storeUser]);

  const handleRetry = () => {
    // Use info for user actions
    logger.info("User initiated login retry");
    navigate("login");
  };

  // JSX return - no changes needed here
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
          <AlertDescription>
            {error}
            {stateError && import.meta.env.MODE === 'development' && (
              <div className="mt-2">
                <p className="text-sm mt-2">Debug info:</p>
                <p className="text-xs">
                  Received state: {receivedState || "none"}
                </p>
                <p className="text-xs">Saved state: {savedState || "none"}</p>
              </div>
            )}
            <div className="mt-4">
              <Button onClick={handleRetry}>Try Again</Button>
            </div>
          </AlertDescription>
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