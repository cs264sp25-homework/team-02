import { v } from "convex/values";

import { Infer } from "convex/values";

import { defineTable } from "convex/server";

export const generationStatus = v.union(
  v.literal("started"), // generation started
  v.literal("fetching profile"), // fetch the profile from the database
  v.literal("fetching job description"), // fetch the job description from the database
  v.literal("generating tailored profile"), // (AI) use generateObject to generate a profile that is tailored to the job description
  v.literal("generating tailored resume"), // fit the profile to the resume latex template
  v.literal("enhancing resume with AI"), // (AI) use streamText to enhance the resume with AI and any user instructions
  v.literal("compiling resume"), // use compileLatex to compile the resume
  v.literal("completed"), // resume is ready to be viewed
  v.literal("failed"), // generation failed
);

export type GenerationStatusType = Infer<typeof generationStatus>;

export const resumeInSchema = {
  latexContent: v.string(), // latex content of the resume
  tailoredProfile: v.record(v.string(), v.any()), // tailored profile
  generationStatus, // status of the generation
  statusBeforeFailure: v.optional(generationStatus), // status before failure
  generationError: v.optional(v.string()), // error message if generation failed
  chunkCount: v.number(), // number of chunks generated
  compiledResumeStorageId: v.optional(v.id("_storage")), // storage id of the compiled resume
  compiledResumeUrl: v.optional(v.string()), // url of the compiled resume
  userResumeCompilationErrorMessage: v.optional(v.string()), // error message if user compilation failed
};

export const resumeSchema = {
  ...resumeInSchema,
  userId: v.string(), // relation to user table
  jobId: v.optional(v.string()),
};

// eslint-disable-next-line
const resumeSchemaObject = v.object(resumeSchema);
export type ResumeType = Infer<typeof resumeSchemaObject>;

/**
 * Resume table schema definition
 */
export const resumeTables = {
  resumes: defineTable(resumeSchema)
    .index("by_userId", ["userId"])
    .index("by_jobId", ["jobId"]),
};
