import { Infer, v } from "convex/values";
import { defineTable } from "convex/server";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { ConvexError } from "convex/values";
import { scrapeQuestionsFromImage } from "./scrape";

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

  // Application Questions and Answers
  questions: v.array(v.string()),
  answers: v.array(v.string()),

  // Urls
  postingUrl: v.string(),
  applicationUrl: v.string(),
  questionImageUrl: v.optional(v.string()),

  // Timestamps
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
  answers: v.optional(v.array(v.string())),
  questionImageUrl: v.optional(v.string()),
  postingUrl: v.optional(v.string()),
  applicationUrl: v.optional(v.string()),
};

// eslint-disable-next-line
const jobUpdateSchemaObject = v.object(jobUpdateSchema);
export type JobUpdateType = Infer<typeof jobUpdateSchemaObject>;

/**
 * Type representing a job in the database
 */
export const jobSchema = {
  ...jobInSchema,
  userId: v.string(), // relation to user table
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
 * Add a job to the database
 * @param job The job data to add
 * @returns The ID of the newly added job
 */
export const addJob = mutation({
  args: {
    userId: v.string(),
    title: v.string(),
    description: v.string(),
    questions: v.array(v.string()),
    answers: v.array(v.string()),
    postingUrl: v.string(),
    applicationUrl: v.string(),
  },
  handler: async (ctx, args): Promise<Id<"jobs">> => {
    const {
      userId,
      title,
      description,
      questions,
      answers,
      postingUrl,
      applicationUrl,
    } = args;

    // get user from auth
    const user = await ctx.db
      .query("users")
      .withIndex("by_id", (q) => q.eq("_id", userId as Id<"users">))
      .first();

    if (!user) {
      throw new Error("Not authenticated!");
    }

    // Create the job data
    const jobId = await ctx.db.insert("jobs", {
      userId,
      title: title,
      description: description,
      questions: questions,
      answers: answers,
      postingUrl: postingUrl,
      applicationUrl: applicationUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return jobId;
  },
});

/**
 * Get a job by ID
 * @param jobId The ID of the job to fetch
 * @returns The job data or null if not found
 */
export const getJobById = query({
  args: { userId: v.string(), jobId: v.id("jobs") },
  handler: async (ctx, { userId, jobId }) => {
    // get user from auth
    const user = await ctx.db
      .query("users")
      .withIndex("by_id", (q) => q.eq("_id", userId as Id<"users">))
      .first();

    if (!user) {
      throw new Error("Not authenticated!");
    }

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
    userId: v.string(),
    jobId: v.id("jobs"),
    ...jobUpdateSchema,
  },
  handler: async (ctx, { userId, jobId, ...update }) => {
    // get user from auth
    const user = await ctx.db
      .query("users")
      .withIndex("by_id", (q) => q.eq("_id", userId as Id<"users">))
      .first();

    if (!user) {
      throw new Error("Not authenticated!");
    }

    const existingJob = await ctx.db.get(jobId);

    if (!existingJob) {
      throw new Error("Job not found");
    }

    if (existingJob.userId !== userId) {
      throw new Error("Not authorized to update this job!");
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
  args: { jobId: v.id("jobs"), userId: v.string() },
  handler: async (ctx, { jobId, userId }) => {
    // get user from auth
    const user = await ctx.db
      .query("users")
      .withIndex("by_id", (q) => q.eq("_id", userId as Id<"users">))
      .first();

    if (!user) {
      throw new Error("Not authenticated!");
    }

    const existingJob = await ctx.db.get(jobId);

    if (!existingJob) {
      throw new Error("Job not found");
    }

    if (existingJob.userId !== userId) {
      throw new Error("Not authorized to delete this job!");
    }

    await ctx.db.delete(jobId);
    return true;
  },
});

/**
 * Update the answers for a job
 * @param jobId The ID of the job to update
 * @param answers The new answers to set
 * @returns true if successful
 */
export const updateAnswerAtIndex = mutation({
  args: {
    userId: v.string(),
    jobId: v.id("jobs"),
    index: v.number(),
    answer: v.string(),
  },
  handler: async (ctx, { userId, jobId, index, answer }) => {
    // get user from auth
    const user = await ctx.db
      .query("users")
      .withIndex("by_id", (q) => q.eq("_id", userId as Id<"users">))
      .first();

    if (!user) {
      throw new Error("Not authenticated!");
    }

    const existingJob = await ctx.db.get(jobId);
    if (!existingJob) {
      throw new Error("Job not found");
    }

    if (existingJob.userId !== userId) {
      throw new Error("Not authorized to update this job's answers!");
    }

    // Get current answers array
    const currentAnswers = existingJob.answers;

    // Validate index
    if (index < 0 || index >= currentAnswers.length) {
      throw new Error("Invalid answer index");
    }

    // Create new answers array with updated value
    const updatedAnswers = [...currentAnswers];
    updatedAnswers[index] = answer;

    // Update the job with new answers
    await ctx.db.patch(jobId, {
      answers: updatedAnswers,
      updatedAt: new Date().toISOString(),
    });

    return true;
  },
});

export const uploadQuestionImage = mutation({
  args: {
    jobId: v.id("jobs"),
    userId: v.string(),
    imageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const { jobId, userId, imageUrl } = args;

    // Verify job ownership
    const job = await ctx.db.get(jobId);
    if (!job || job.userId !== userId) {
      throw new ConvexError("Job not found or unauthorized");
    }

    // Update job with image URL
    await ctx.db.patch(jobId, {
      questionImageUrl: imageUrl,
    });

    return true;
  },
});
