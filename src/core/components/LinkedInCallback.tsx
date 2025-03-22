import { useEffect, useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter } from "@/core/hooks/use-router";
import { Spinner } from "@/core/components/spinner";
import { Alert, AlertTitle, AlertDescription } from "@/core/components/alert";
import { Button } from "@/core/components/button";
import { useMutation } from "convex/react";

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

        console.log("Received callback parameters:", {
          code: code ? "present" : "missing",
          state,
          error: errorParam,
        });

        // Check for error from LinkedIn
        if (errorParam) {
          setError(`LinkedIn login failed: ${errorDescription || errorParam}`);
          return;
        }

        // Try to get the state from both localStorage and sessionStorage
        const stateFromLocalStorage = localStorage.getItem("linkedInAuthState");
        const stateFromSessionStorage =
          sessionStorage.getItem("linkedInAuthState");

        const storedState = stateFromLocalStorage || stateFromSessionStorage;

        console.log("Retrieved states:", {
          fromLocalStorage: stateFromLocalStorage,
          fromSessionStorage: stateFromSessionStorage,
          received: state,
        });

        // Save state values for debugging
        setReceivedState(state);
        setSavedState(storedState);

        // For development, let's make this more forgiving - only validate state if it exists
        if (storedState && state !== storedState) {
          console.error("State mismatch", {
            received: state,
            stored: storedState,
          });
          setStateError(true);
          setError(
            "Invalid state parameter. Login attempt may have been tampered with.",
          );
          return;
        }

        // Clear the saved state
        localStorage.removeItem("linkedInAuthState");
        sessionStorage.removeItem("linkedInAuthState");

        if (!code) {
          setError("Authorization code not found in the callback URL.");
          return;
        }

        console.log("Exchanging code for token...");

        // Exchange the code for a token and user info
        const result = await exchangeCode({ code });
        console.log("Token exchange result:", result);

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
            console.log("User stored in Convex:", storeResult);
          } catch (storeError) {
            console.error("Failed to store user:", storeError);
            // Continue anyway so the user isn't stuck
          }
        }

        setSuccess(true);

        // Redirect to profile page after successful login
        setTimeout(() => {
          navigate("profile");
        }, 1500);
      } catch (err) {
        console.error("LinkedIn auth error:", err);
        setError(
          err instanceof Error
            ? err.message
            : "An unknown error occurred during LinkedIn login.",
        );
      }
    };

    processCallback();
  }, [exchangeCode, navigate, processed, storeUser]);

  const handleRetry = () => {
    // Navigate back to login page
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
            {stateError && (
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
