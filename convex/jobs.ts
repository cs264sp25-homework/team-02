import { Infer, v } from "convex/values";
import { defineTable } from "convex/server";
import { mutation, query } from "./_generated/server";

/******************************************************************************
 * SCHEMA
 *
 * Defines types and database schema for jobs:
 * - JobInType: Fields that can be provided when creating/updating
 * - JobUpdateType: Fields that can be updated
 * - JobType: Complete job document type including system fields
 * Includes database indexes for efficient querying (by_companyId)
 ******************************************************************************/

/**
 * Type representing the fields that can be provided when creating a job
 */
export const jobInSchema = {
  // Basic Information
  title: v.string(),
  description: v.string(),
  // Application Questions
  questions: v.array(v.string()),
  createdAt: v.string(),
  updatedAt: v.string(),
};

// eslint-disable-next-line
const jobInSchemaObject = v.object(jobInSchema);
export type JobInType = Infer<typeof jobInSchemaObject>;

/**
 * Type representing the fields that can be provided when updating a job
 */
export const jobUpdateSchema = {
  // Make all fields optional for updates
  title: v.optional(v.string()),
  description: v.optional(v.string()),
  questions: v.optional(v.array(v.string())),
};

// eslint-disable-next-line
const jobUpdateSchemaObject = v.object(jobUpdateSchema);
export type JobUpdateType = Infer<typeof jobUpdateSchemaObject>;

/**
 * Type representing a job in the database
 */
export const jobSchema = {
  ...jobInSchema,
  userId: v.string(),
};

// eslint-disable-next-line
const jobSchemaObject = v.object(jobSchema);
export type JobType = Infer<typeof jobSchemaObject>;
export type QuestionType = JobType["questions"][number];

/**
 * Job table schema definition
 */
export const jobTables = {
  jobs: defineTable(jobSchema).index("by_userId", ["userId"]),
};

/**
 * Create a new job listing
 * @param job The job data to create
 * @returns The ID of the newly created job
 */
export const createJob = mutation({
  args: jobInSchemaObject,
  handler: async (ctx, job) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const jobData = {
      ...job,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return await ctx.db.insert("jobs", jobData);
  },
});

/**
 * Get a job by ID
 * @param jobId The ID of the job to fetch
 * @returns The job data or null if not found
 */
export const getJobById = query({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, { jobId }) => {
    return await ctx.db.get(jobId);
  },
});

/**
 * Update a job listing
 * @param update The job data to update
 * @returns The ID of the updated job
 */
export const updateJob = mutation({
  args: {
    ...jobUpdateSchema,
    jobId: v.id("jobs"),
  },
  handler: async (ctx, { jobId, ...update }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const existingJob = await ctx.db.get(jobId);
    if (!existingJob) {
      throw new Error("Job not found");
    }

    // Add updatedAt timestamp
    const jobUpdate = {
      ...update,
      updatedAt: new Date().toISOString(),
    };

    return await ctx.db.patch(jobId, jobUpdate);
  },
});

/**
 * Delete a job listing
 * @param jobId The ID of the job to delete
 * @returns true if successful
 */
export const deleteJob = mutation({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, { jobId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const existingJob = await ctx.db.get(jobId);
    if (!existingJob) {
      throw new Error("Job not found");
    }

    await ctx.db.delete(jobId);
    return true;
  },
});
