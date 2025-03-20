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
};

console.log(pages);

export type Page = keyof typeof pages;

export type Params = Record<string, string>;

export const $router = createRouter(pages);

if (DEBUG) {
  logger({ $router });
}
