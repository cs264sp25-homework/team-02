import { useEffect, useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter } from "@/core/hooks/use-router";
import { Spinner } from "@/linkedin/components/spinner";
import { Alert, AlertTitle, AlertDescription } from "@/linkedin/components/alert";
import { Button } from "@/core/components/button";
import { logger } from "@/lib/logger";
import { useAuth } from '../hooks/useAuth';

export default function LinkedInCallback() {
  const { navigate } = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [stateError, setStateError] = useState<boolean>(false);
  const [receivedState, setReceivedState] = useState<string | null>(null);
  const [savedState, setSavedState] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [processed, setProcessed] = useState(false);

  // Get auth store methods and the exchange code action
  const { storeUserData } = useAuth();
  const exchangeCode = useAction(api.linkedin.auth.exchangeLinkedInCode);
  
  useEffect(() => {
    // Define the callback processing function
    const processCallback = async () => {
      // Prevent processing multiple times (React strict mode can cause double execution)
      if (processed) return;
      setProcessed(true);

      try {
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        const state = urlParams.get("state");
        const errorParam = urlParams.get("error");
        const errorDescription = urlParams.get("error_description");

        // Handle errors from LinkedIn
        if (errorParam) {
          logger.error("LinkedIn auth error from provider", { 
            error: errorParam, 
            description: errorDescription 
          });
          setError(`LinkedIn login failed: ${errorDescription || errorParam}`);
          return;
        }

        // Get the state from storage
        const stateFromLocalStorage = localStorage.getItem("linkedInAuthState");
        const stateFromSessionStorage = sessionStorage.getItem("linkedInAuthState");
        const storedState = stateFromLocalStorage || stateFromSessionStorage;

        // For debugging
        logger.debug("Retrieved state values", {
          fromLocalStorage: stateFromLocalStorage,
          fromSessionStorage: stateFromSessionStorage,
          received: state,
        });

        // Save state values for UI display if needed
        setReceivedState(state);
        setSavedState(storedState);

        // Validate state parameter - BUT in development mode we'll be more lenient
        if (import.meta.env.MODE === 'production' && (!state || !storedState || state !== storedState)) {
          logger.warn("OAuth state parameter validation failed", {
            receivedState: state ? "present" : "missing",
            storedState: storedState ? "present" : "missing",
            match: state === storedState ? "yes" : "no"
          });
          setStateError(true);
          setError("Authentication failed: Security validation error.");
          return;
        } else if (import.meta.env.MODE !== 'production' && (!state || !storedState)) {
          // In development, log a warning but continue
          logger.warn("OAuth state parameter missing but continuing in development mode", {
            receivedState: state ? "present" : "missing",
            storedState: storedState ? "present" : "missing"
          });
        }

        // Clear the saved state
        localStorage.removeItem("linkedInAuthState");
        sessionStorage.removeItem("linkedInAuthState");

        if (!code) {
          logger.error("Missing authorization code");
          setError("Authorization code not found in the callback URL.");
          return;
        }

        logger.info("Exchanging authorization code for token");

        // Exchange the code for a token and user info
        const result = await exchangeCode({ code });
        
        logger.debug("Token exchange completed", {
          success: !!result,
          hasUserData: result && result.firstName ? true : false
        });

        // Store the user data using nanostores
        if (result) {
          try {
            await storeUserData({
              linkedInId: result.linkedInId,
              firstName: result.firstName,
              lastName: result.lastName,
              email: result.email,
              profilePictureUrl: result.profilePictureUrl,
              locale: result.locale,
              accessToken: result.accessToken,
              expiresAt: result.expiresAt,
            });
            
            logger.info("User successfully stored in database");
          } catch (storeError) {
            logger.error("Failed to store user data", { 
              error: storeError instanceof Error ? storeError.message : String(storeError) 
            });
            // Continue anyway so the user isn't stuck
          }
        }

        setSuccess(true);
        logger.info("Authentication successful, redirecting to profile");

        // Redirect to profile page after successful login
        setTimeout(() => {
          navigate("profile");
        }, 1500);
      } catch (err) {
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
  }, [exchangeCode, navigate, processed, storeUserData]);

  const handleRetry = () => {
    logger.info("User initiated login retry");
    navigate("login");
  };

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
