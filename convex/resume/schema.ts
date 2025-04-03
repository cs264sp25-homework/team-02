import { v } from "convex/values";

import { Infer } from "convex/values";

import { defineTable } from "convex/server";

export const generationStatus = v.union(
  v.literal("started"),
  v.literal("fetching profile"),
  v.literal("fetching job description"),
  v.literal("generating tailored profile"),
  v.literal("generating tailored resume"),
  v.literal("compiling resume"),
  v.literal("completed"),
  v.literal("failed"),
);

export type GenerationStatusType = Infer<typeof generationStatus>;

export const resumeInSchema = {
  templateStorageId: v.string(), // storage id of the template used for generation
  latexContent: v.string(), // latex content of the resume
  generationStatus, // status of the generation
  generationError: v.optional(v.string()), // error message if generation failed
  chunkCount: v.number(), // number of chunks generated
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
