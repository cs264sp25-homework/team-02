import { v } from "convex/values";

import { Infer } from "convex/values";
import { z } from "zod";
import { defineTable } from "convex/server";

export const improveResumeAction = v.union(
  v.literal("shorten"),
  v.literal("lengthen"),
  v.literal("professional"),
  v.literal("technical"),
);

export type ImproveResumeActionType = Infer<typeof improveResumeAction>;

export const generationStatus = v.union(
  v.literal("started"), // generation started
  v.literal("fetching profile"), // fetch the profile from the database
  v.literal("fetching job description"), // fetch the job description from the database
  v.literal("generating tailored profile"), // (AI) use generateObject to generate a profile that is tailored to the job description
  v.literal("generating tailored resume"), // fit the profile to the resume latex template
  v.literal("enhancing resume with AI"), // (AI) use streamText to enhance the resume with AI and any user instructions
  v.literal("providing resume insights"), // (AI) provide insights about the resume job fit
  v.literal("compiling resume"), // use compileLatex to compile the resume
  v.literal("completed"), // resume is ready to be viewed
  v.literal("failed"), // generation failed
);

export type GenerationStatusType = Infer<typeof generationStatus>;

export const resumeInsightsZodSchema = z.object({
  insights: z.array(
    z.object({
      requirement: z.string(),
      match: z.union([z.literal("match"), z.literal("gap")]),
      comments: z.string(),
    }),
  ),
});

export const resumeInsightsSchema = v.array(
  v.object({
    requirement: v.string(),
    match: v.union(v.literal("match"), v.literal("gap")),
    comments: v.string(),
  }),
);

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
  resumeInsights: v.optional(resumeInsightsSchema), // insights about the resume related to the job description
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
