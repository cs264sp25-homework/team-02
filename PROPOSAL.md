# Project Proposal

We are building a personal profile and resume management platform that allows users to store multiple versions of their resumes and store answers for common open-ended job application questions. It will also include AI features such as creating tailored resumes and cover letters based on user uploaded resumes and inputted job description.

## Functional Requirements

### General Features

- Create an account and sign in
- Organize your resumes based on custom categories (industry/companies)
- Upload PDF resume (can upload multiple resumes if applying to different job categories)
- Organize answers to common behavioral questions in job applications
- Make user profiles from user-inputted data
- Add work history, skills, and projects to user profile

The following features could be implemented, if time permits:

- Import personal info and work history for profile from Linkedin
- Upload profile picture
- personalized resume review checklist
- we can add notes to job application info (stuff i want to keep in mind about this company like memorize Amazon leadership principles for Amazon related jobs)

The following features would be nice to have but won't be implemented:

- create an extension to autofill any job application with AI
- job tracker with deadlines

### AI Features

- Generates a tailored resume based on uploaded resume and copy-pasted job description
- Can come up with a personalized response to interview question inputted by user
- Personal AI Insights – strengths and weaknesses of your skills based on applied job
  - Basically if i am trying to apply to marketing manager job and have only SWE internships then AI will tell me that i need more experience in marketing and suggest me some activities i can do to gain experience (based on resume)

The following features could be implemented, if time permits:

- generate a cover letter based on job description and user built profile
- AI can also suggest activities or skills to gain based on your career goals

The following features would be nice to have but won't be implemented:

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

Sprint 1: March 10 - April 4
Week 8 (March 10-14): Project Setup & Authentication

### Week 8 (March 10-14): Project Setup & Authentication

**Tasks:**

1. Set up project repository with React, Vite, TailwindCSS, and Shadcn UI

   - Create project structure and configure build tools
   - Set up code linting and formatting tools
   - Configure deployment pipeline

2. Implement user authentication system (Primary Feature #1)

   - Integrate GitHub OAuth with Convex
   - Create user profile data structure
   - Implement sign-in/sign-out functionality
   - Set up protected routes

3. Design and implement database schema

   - Design schema for users, flashcards, and decks
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

### Week 11 (March 31-April 4): AI Feature: CoverAI/Resume Generation

- Generates a tailored resume based on uploaded resume and copy-pasted job description
- Generates a cover letter based on job description and user built profile
- Import personal info and work history for profile from Linkedin

## Sprint 2: April 7 - April 28

### Week 12 (April 7-11): Personalized Response and AI Insights

- Personal AI Insights – strengths and weaknesses of your skills based on applied job
  - Basically if i am trying to apply to marketing manager job and have only SWE internships then AI will tell me that i need more experience in marketing and suggest me some activities i can do to gain experience (based on resume)
- AI can also suggest activities or skills to gain based on your career goals

### Week 13 (April 14-18): Additional Features

- Allow users to add profile picture
- Personalized resume review checklist
- Add notes to job application info (stuff i want to keep in mind about this company like memorize Amazon leadership principles for Amazon related jobs)

### Week 14 (April 21-25): Final Touches & Buffer Week

- Buffer week, bug fixes, and final touches
