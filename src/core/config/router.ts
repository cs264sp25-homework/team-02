import { BASE_URL } from "@/core/config/env";
import { logger } from "@nanostores/logger";
import { createRouter } from "@nanostores/router";

const DEBUG = false;

const baseUrl = BASE_URL === "" ? "" : `/${BASE_URL}`;

const pages = {
  home: `${baseUrl}/`, // Home page
  demo: `${baseUrl}/demo`, // Demo page
  login: `${baseUrl}/login`, // Log-in page
  profile: `${baseUrl}/profile`, // Profile page
  add_file: `${baseUrl}/add-file`, // File upload page
  auth_callback: `${baseUrl}/auth/callback`, // LinkedIn OAuth callback
  import_job: `${baseUrl}/import-job`, // Job import page
  job_details: `${baseUrl}/job-details/:jobId`, // Job details page with job ID parameter
  customize_resume_status: `${baseUrl}/customize-resume-status/:resumeId`, // Customize resume status page
  chat: `${baseUrl}/chat/:chatId?`, // Chat interface page
  edit_resume: `${baseUrl}/edit-resume/:resumeId`, // Latex editor page
  interview_prep: `${baseUrl}/interview-prep/:jobId`, // Interview question generator page with job ID
  job_fit: `${baseUrl}/job-fit/:jobId`, // Job fit evaluation page
  profile_skills: `${baseUrl}/profile#skills`, // Profile skills section
};

export type Page = keyof typeof pages;

export type Params = Record<string, string>;

export const $router = createRouter(pages);

if (DEBUG) {
  logger({ $router });
}
