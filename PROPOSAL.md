# Project Proposal

We are building a personal profile and resume management platform that allows users to store multiple versions of their resumes and store answers for common open-ended job application questions. It will also include AI features such as creating tailored resumes and cover letters based on user uploaded resumes and inputted job description.

## Functional Requirements

### Primary Features (Must Have)

As a user, I want to

- Create an account and sign in
- Organize your resumes based on custom categories (industry/companies)
- Upload PDF resume (can upload multiple resumes if applying to different job categories)
- Organize answers to common behavioral questions in job applications
- Make user profiles from user-inputted data
- Add work history, skills, and projects to user profile
- Generates a tailored resume based on uploaded resume and copy-pasted job description
- Can come up with a personalized response to interview question inputted by user
- Personal AI Insights – strengths and weaknesses of your skills based on applied job
  - Basically if i am trying to apply to marketing manager job and have only SWE internships then AI will tell me that i need more experience in marketing and suggest me some activities i can do to gain experience (based on resume)

### Secondary Features (Should Have)

- Import personal info and work history for profile from Linkedin
- Upload profile picture
- personalized resume review checklist
- we can add notes to job application info (stuff i want to keep in mind about this company like memorize Amazon leadership principles for Amazon related jobs)
- generate a cover letter based on job description and user built profile
- AI can also suggest activities or skills to gain based on your career goals
- Allow users to add profile picture
- Personalized resume review checklist
- Add notes to job application info (stuff i want to keep in mind about this company like memorize Amazon leadership principles for Amazon related jobs)

### Tertiary Features (Nice to Have)

- create an extension to autofill any job application with AI
- job tracker with deadlines
- conduct mock interview with you
- generate Mock technical questions based on job description

### Tech Stack

To align with the technology stack used in the Practical Gen AI course, we'll use the following:

1. React for the frontend framework
2. TailwindCSS and Shadcn UI for styling
3. Nanostores and its router libraries for state management and routing
4. Vite for development
5. Convex BaaS for backend services, including authentication and database
6. Use Vercel's AI SDK as a thin abstraction layer for AI features.
   - Ideally, we will not use more complex abstraction (like LangChain or LlamaIndex) to orchestrate AI features, unless necessary.

## Project Roadmap

Later, after approval, we will create a detailed project roadmap.

## Sprint 1: March 10 - April 4

### Week 8 (March 10-14): Project Setup & Authentication

**Tasks:**

1. Set up project repository with React, Vite, TailwindCSS, and Shadcn UI

   - Create project structure and configure build tools
   - Set up code linting and formatting tools
   - Configure deployment pipeline

2. Implement user authentication system (Primary Feature #1)

   - Integrate Google OAuth with Convex
   - Create user profile data structure
   - Implement sign-in/sign-out functionality
   - Set up protected routes

3. Design and implement database schema

   - Design schema for users, resumes, folders, and cover letters
   - Set up Convex database configuration
   - Create data models and relationships

4. Develop UI component library
   - Build reusable UI components (buttons, cards, inputs, etc.)
   - Create layout components and page templates
   - Implement responsive design

**Deliverables:**

- Functioning GitHub authentication system
- Project repository with CI/CD setup
- Basic UI component library
- Database schema documentation

### Week 10 (March 24-28): Primary Features

- Organize your resumes based on custom categories (industry/companies)
- Upload PDF resume (can upload multiple resumes if applying to different job categories)
- Organize answers to common behavioral questions in job applications
- Make user profiles from user-inputted data
- Add work history, skills, and projects to user profile

### Week 11 (March 31-April 4): AI Features: Cover Letter/Resume Generation and Import from LinkedIn

- Generates a tailored resume based on uploaded resume and copy-pasted job description
- Generates a cover letter based on job description and user built profile
- Import personal info and work history for profile from Linkedin

## Sprint 2: April 7 - April 28

### Week 12 (April 7-11): Personalized Interview Response Generation and AI Insights

- Personal AI Insights – strengths and weaknesses of your skills based on applied job
  - Basically if i am trying to apply to marketing manager job and have only SWE internships then AI will tell me that i need more experience in marketing and suggest me some activities i can do to gain experience (based on resume)
- AI can also suggest activities or skills to gain based on your career goals

### Week 13 (April 14-18): Additional Features

- Allow users to add profile picture
- Personalized resume review checklist
- Add notes to job application info (stuff i want to keep in mind about this company like memorize Amazon leadership principles for Amazon related jobs)

### Week 14 (April 21-25): Final Touches & Buffer Week

1. Implement highest-priority tertiary features (selectively based on progress)

- generate Mock technical questions based on job description

2. Conduct comprehensive testing and quality assurance

   - Perform usability testing with representative users
   - Identify and fix bugs and issues
   - Optimize performance and responsiveness
   - Ensure accessibility compliance

3. Final deployment and project wrap-up
   - Deploy final application version
   - Verify all features are working in production
   - Create presentation materials
   - Prepare for project demonstration

**Deliverables:**

- Polished, production-ready application
- Presentation materials for project demonstration

1. **March 14**: Project infrastructure complete with authentication system
2. **March 28**: Core job preparation system functional
3. **April 4**: Sprint 1 completion with all primary features implemented
4. **April 11**: AI resume and cover letter generation features functional
5. **April 18**: AI personalized interview responses generation and personal insights complete
6. **April 25**: Application finalized with tertiary features and comprehensive testing
7. **April 28**: Final project submission and demonstration
