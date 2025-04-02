// Define Convex environment variables
export default {
  // LinkedIn OAuth configuration
  LINKEDIN_CLIENT_ID: process.env.VITE_LINKEDIN_CLIENT_ID || "",
  LINKEDIN_CLIENT_SECRET: process.env.VITE_LINKEDIN_CLIENT_SECRET || "",
  LINKEDIN_REDIRECT_URI:
    process.env.VITE_LINKEDIN_REDIRECT_URI ||
    "http://localhost:5173/auth/callback",

  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
};
