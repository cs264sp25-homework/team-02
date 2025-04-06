# JobSync

JobSync is an AI-powered job application assistant designed to streamline the process of filling out job applications and crafting tailored resumes. The application leverages AI to generate personalized responses to uploaded job application questions and create customized resumes that match specific job descriptions.


## Features

### Implemented Features (Sprint 1)

- **User Authentication**: Secure sign-in through LinkedIn OAuth integration
- **Profile Management**: Create and edit a comprehensive profile with work history, education, skills, and projects
- **Resume Parsing**: Upload your existing resume in PDF format and have it automatically parsed into your profile
- **Job Import**: Import job postings and application questions from URLs and images
- **AI-Generated Responses**: Generate tailored, personalized responses to job application questions based on your profile and job requirements
- **Resume Customization**: Generate tailored resumes based on your profile and the job description

## Tech Stack

- **Frontend**: React with Vite
- **Styling**: TailwindCSS and Shadcn UI
- **Backend**: Convex BaaS (Backend as a Service)
- **AI Integration**: OpenAI APIs via Vercel AI SDK
- **Deployment**: Github Pages: [JobSync](https://cs264sp25-homework.github.io/team-02/)

## Getting Started

### Deployed Version of Our App
Our app is deployed on Github Pages. Please navigate to the following link.
Link: cs264sp25-homework.github.io/team-02/

### Prerequisites

- Node.js (v18 or higher)
- pnpm
- [LinkedIn Developer Account (for OAuth)](http://linkedin.com/developers) 
- OpenAI API Key

### LinkedIn OAuth Setup
1. Go to the [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps)
2. Click "Create App"
3. Fill in the required information:
   - App name: "JobSync Development" (or any name you prefer)
   - Company: Your company/organization
   - Privacy policy URL: Can be a placeholder during development
   - Business email: Your email
4. Upload an app logo (optional)
5. Click "Create App"
6. In the "Auth" tab:
   - Add the redirect URL: `http://localhost:5173/auth/callback`
   - Request the following OAuth scopes:
     - `openid`
     - `profile`
     - `email`
     - You may need to go to the products tab and request access to "Sign In with LinkedIn using OpenID Connect"
7. Save the changes
8. Note your Client ID and Client Secret and add them to your `.env` file


### Local Development Setup

Make sure you generated your own client ID and client secret for LinkedIn OAuth from above section. 

1. Clone the repository:
   ```bash
   git clone https://github.com/cs264sp25-homework/team-02
   cd team-02
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   VITE_LINKEDIN_CLIENT_ID=your_linkedin_client_id
   VITE_LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
   VITE_LINKEDIN_REDIRECT_URI=http://localhost:5173/auth/callback
   OPENAI_API_KEY=your_openai_api_key
   ```

4. Start convex server: 
  ```bash
   npx convex dev 
   ```

5. Start the development server:
   ```bash
   pnpm dev
   ```

6. Open your browser to `http://localhost:5173`


## Roadmap

- **Sprint 1** (Completed): Core functionality including authentication, profile creation, resume parsing, job import, and AI-generated content


## License

See the [LICENSE](LICENSE) file for details.
