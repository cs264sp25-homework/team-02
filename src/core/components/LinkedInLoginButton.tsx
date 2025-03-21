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
    // Generate a random state parameter to prevent CSRF attacks
    const state = Math.random().toString(36).substring(2, 15);
    
    // Important: Store state in localStorage (more reliable than sessionStorage)
    localStorage.setItem("linkedInAuthState", state);
    
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
    
    // Redirect to LinkedIn authorization page
    window.location.href = authUrl;
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