import { Button } from "@/core/components/button";
import { Linkedin } from "lucide-react";

interface LinkedInLoginButtonProps {
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

export function LinkedInLoginButton({
  className,
  variant = "default",
  size = "default",
}: LinkedInLoginButtonProps) {
  const handleLogin = () => {
    try {
      // Generate a random state parameter with more entropy
      const state = Math.random().toString(36).substring(2, 15) + 
                    Math.random().toString(36).substring(2, 15);
      
      console.log("Generated LinkedIn state:", state);
      
      // Store state in localStorage and sessionStorage for redundancy
      localStorage.setItem("linkedInAuthState", state);
      sessionStorage.setItem("linkedInAuthState", state);
      
      // Log to confirm storage worked
      console.log("State stored in localStorage:", localStorage.getItem("linkedInAuthState"));
      console.log("State stored in sessionStorage:", sessionStorage.getItem("linkedInAuthState"));
      
      // Get authorization URL from environment variables
      const clientId = import.meta.env.VITE_LINKEDIN_CLIENT_ID;
      const redirectUri = import.meta.env.VITE_LINKEDIN_REDIRECT_URI || 
                          window.location.origin + "/auth/callback";
      
      // Using OpenID Connect scopes
      const authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
                      `response_type=code&` +
                      `client_id=${clientId}&` +
                      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
                      `state=${state}&` +
                      `scope=openid%20profile%20email`;
      
      console.log("Redirecting to LinkedIn auth URL:", authUrl);
      
      // Redirect to LinkedIn authorization page
      window.location.href = authUrl;
    } catch (error) {
      console.error("Error during LinkedIn login setup:", error);
      alert("There was an error setting up LinkedIn login. Please try again.");
    }
  };
  
  return (
    <Button
      className={className}
      variant={variant}
      size={size}
      onClick={handleLogin}
    >
      <Linkedin size={16} className="mr-2" />
      Sign in with LinkedIn
    </Button>
  );
}