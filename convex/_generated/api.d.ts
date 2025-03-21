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
import type * as linkedin_auth from "../linkedin/auth.js";
import type * as linkedin_profile from "../linkedin/profile.js";
import type * as profiles from "../profiles.js";

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
  "linkedin/auth": typeof linkedin_auth;
  "linkedin/profile": typeof linkedin_profile;
  profiles: typeof profiles;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
