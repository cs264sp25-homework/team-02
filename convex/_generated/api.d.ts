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
import type * as files from "../files.js";
import type * as hello from "../hello.js";
import type * as jobs from "../jobs.js";
import type * as linkedin_auth from "../linkedin/auth.js";
import type * as openai from "../openai.js";
import type * as profiles from "../profiles.js";
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
  files: typeof files;
  hello: typeof hello;
  jobs: typeof jobs;
  "linkedin/auth": typeof linkedin_auth;
  openai: typeof openai;
  profiles: typeof profiles;
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
