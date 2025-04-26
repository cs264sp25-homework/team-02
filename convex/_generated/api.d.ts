/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as chat from "../chat.js";
import type * as files from "../files.js";
import type * as hello from "../hello.js";
import type * as interviewPrep from "../interviewPrep.js";
import type * as jobApplicationAnswers from "../jobApplicationAnswers.js";
import type * as jobFitSummary from "../jobFitSummary.js";
import type * as jobs from "../jobs.js";
import type * as linkedin_auth from "../linkedin/auth.js";
import type * as messages from "../messages.js";
import type * as openai from "../openai.js";
import type * as profiles from "../profiles.js";
import type * as resume_handlers from "../resume/handlers.js";
import type * as resume_prompts from "../resume/prompts.js";
import type * as resume_templates from "../resume/templates.js";
import type * as resume_verifiers from "../resume/verifiers.js";
import type * as resumeParser from "../resumeParser.js";
import type * as scrape from "../scrape.js";
import type * as types_linkedInUserResult from "../types/linkedInUserResult.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  chat: typeof chat;
  files: typeof files;
  hello: typeof hello;
  interviewPrep: typeof interviewPrep;
  jobApplicationAnswers: typeof jobApplicationAnswers;
  jobFitSummary: typeof jobFitSummary;
  jobs: typeof jobs;
  "linkedin/auth": typeof linkedin_auth;
  messages: typeof messages;
  openai: typeof openai;
  profiles: typeof profiles;
  "resume/handlers": typeof resume_handlers;
  "resume/prompts": typeof resume_prompts;
  "resume/templates": typeof resume_templates;
  "resume/verifiers": typeof resume_verifiers;
  resumeParser: typeof resumeParser;
  scrape: typeof scrape;
  "types/linkedInUserResult": typeof types_linkedInUserResult;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
