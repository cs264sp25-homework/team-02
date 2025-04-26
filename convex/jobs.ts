import { Infer, v } from "convex/values";
import { defineTable } from "convex/server";
import { mutation, query, action } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { ConvexError } from "convex/values";
import { api } from "./_generated/api";
import OpenAI from "openai";

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
  questions: v.optional(v.array(v.string())),
  answers: v.optional(v.array(v.string())),
  aiAnswersGenerated: v.optional(v.boolean()),

  // Urls
  postingUrl: v.optional(v.string()),
  applicationUrl: v.optional(v.string()),
  questionImageUrl: v.optional(v.string()),

  // Timestamps
  createdAt: v.string(),
  updatedAt: v.string(),

  requiredSkills: v.optional(v.array(v.string())),

  jobFitSummary: v.optional(v.string()),
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
  aiAnswersGenerated: v.optional(v.boolean()),
  questionImageUrl: v.optional(v.string()),
  postingUrl: v.optional(v.string()),
  applicationUrl: v.optional(v.string()),
  requiredSkills: v.optional(v.array(v.string())),
  jobFitSummary: v.optional(v.string()),
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
export type QuestionType = JobType["questions"] extends (infer T)[] ? T : never;

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
    postingUrl: v.optional(v.string()),
    applicationUrl: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Id<"jobs">> => {
    const {
      userId,
      title,
      description,
      questions,
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
      questions: questions || [],
      postingUrl: postingUrl || "",
      applicationUrl: applicationUrl || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      aiAnswersGenerated: false,
      jobFitSummary: "",
    });

    console.log("questions", questions);

    if (Array.isArray(questions) && questions.length > 0) {
      console.log("Generating job application answers in addJob...");
      await ctx.scheduler.runAfter(
        0,
        api.jobApplicationAnswers.generateJobApplicationAnswers,
        {
          userId,
          jobId,
          jobTitle: title,
          jobRequirements: description,
          jobQuestions: questions,
        },
      );
    }

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
    try {
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

      await ctx.db.patch(jobId, jobUpdate);

      return true;
    } catch (error) {
      console.error("Error updating job:", error);
      return false;
      throw new Error("Failed to update job");
    }
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
    if (index < 0 || index >= currentAnswers!.length) {
      throw new Error("Invalid answer index");
    }

    // Create new answers array with updated value
    const updatedAnswers = [...(currentAnswers || [])];
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

/**
 * Get all jobs for a user
 * @param userId The ID of the user whose jobs to fetch
 * @returns Array of jobs or empty array if none found
 */
export const getAllJobs = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    // Get user from auth
    const user = await ctx.db
      .query("users")
      .withIndex("by_id", (q) => q.eq("_id", userId as Id<"users">))
      .first();

    if (!user) {
      throw new Error("Not authenticated!");
    }

    // Query all jobs for this user
    const jobs = await ctx.db
      .query("jobs")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    // Sort by createdAt date, newest first
    return jobs.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },
});

export const extractRequiredSkills = action({
  args: {
    userId: v.string(),
    jobId: v.string(),
    requirements: v.string(),
  },
  handler: async (ctx, args) => {
    console.log("Starting extractRequiredSkills");
    console.log("requirements", args.requirements);

    const systemPrompt = `You are good at extracting skills from a given string. Your role is to extract skills from a given text and put them into an array.

      Instructions:
      1. Review the provided requirements and identify the critical skills relevant to the job.
      2. Extract the skills in a clear and concise manner. Don't add markdown or formatting. 
      3. Ensure that the extracted skills is 1-2 words long.
      3. Ensure that the extracted skills are relevant to the job title and context. For example, if the job title is "Software Engineer", skills like "JavaScript" or "React" would be relevant.
      4. Only extract skills that are mentioned in the requirements. Do not add any additional skills or information.
      5. Only extract skills, not qualifications or experiences like "5 years of experience" or "Bachelor's degree". Don't extract vague terms like "good communication" or "team player" or "organization".
      6. If the job title is "Data Scientist", skills like "Python" or "Machine Learning" or "SQL" would be relevant.
      7. If the job title is "Software Engineer", skills like "JavaScript" or "React" or "Node.js" would be relevant.
      8. If the job title is "Sales Manager", skills like "Sales strategy" or "CRM software" or "lead generation" would be relevant.
      If the job title is "Product Manager", skills like "Agile methodology" or "Product management" or "SQL" or "data analysis" would be relevant.

      Requirements:
      ${args.requirements}

      Examples:
      """
      Requirements: Experience with Typescript, React, Node or other software development
frameworks

+ Communication: You can clearly articulate what's going on to both technical
and non-technical stakeholders

» Cracked-ness: You're more cracked than the most cracked person on the team

« Organization: You naturally gravitate toward building systems that stand the
test of time

« Startup Ready: You have a reason to be here and can make sacrifices for
something uncertain

» Founder Juice: New ideas come from you, you build it yourself or annoy
everyone until it's done ;)

      Output: '["Typescript", "React", "Node"]'
      """

      """
      Requirements:  Is very proficient in Typescript/React/Node.

      - Can leverage GPT/Claude/Cursor to accelerate their work.

      - Has built products 0 -> 1 with real users and revenue.

      - Is OK with not having product and design support all the time.

      - Is ALWAYS SHIPPING. We don't spend weeks planning features at Replo.

      - Has a product and customer-focused mindset.

      - Has experience being burned by deployment and maintenance issues. If you have a a
strong opinion on how products should be built, that’s good.

      - Values writing clean, maintainable software, including documentation (e.g. the code needs
to be correct and run fast, but we're the ones that have to read it and understand it).

      - Is comfortable with ambiguity and defining software architecture patterns to solve customer
pain points.

      Output: '["Typescript", "React", "Node", "AI"]'
      """

      """
      Requirements: Cold calling experience preferred but open to someone hungry to start their sales career
Grit, resilience, and desire to exceed sales goals
Excellent communication and prioritization skills
Self-motivated, disciplined, and organized
A proven top performer in previous experiences, consistently hitting and exceeding goals
Positive mindset with ability to navigate change and quickly adapt
Proficiency with CRM software and other sales tools preferred

      Output: '["cold calling", "communication", "CRM software", "sales toools"]'  

      """

      Output:
      Return the output as a JSON array of strings. Do not include any explanation, markdown, or formatting — only the raw JSON array.      `;

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: systemPrompt }],
      });

      const content = completion.choices[0]?.message.content;

      if (!content) {
        throw new Error("OpenAI response content is empty.");
      }

      let parsedSkillsArray: string[];
      try {
        parsedSkillsArray = JSON.parse(content);
        if (!parsedSkillsArray || !Array.isArray(parsedSkillsArray)) {
          throw new Error("Invalid JSON structure received from OpenAI.");
        }

        if (parsedSkillsArray.length === 0) {
          throw new Error("Failed to extract skills from requirements.");
        }
      } catch (parseError) {
        console.error(
          "Failed to parse OpenAI JSON response:",
          content,
          parseError,
        );
        throw new Error("Failed to parse skills from AI response.");
      }

      console.log("Parsed skills array:", parsedSkillsArray);

      await ctx.runMutation(api.jobs.updateJob, {
        userId: args.userId,
        jobId: args.jobId as Id<"jobs">,
        requiredSkills: parsedSkillsArray,
      });
    } catch (error) {
      console.error(
        "Error generating array of skills from requirements string:",
        error,
      );
      if (error instanceof OpenAI.APIError) {
        throw new Error(`OpenAI API Error: ${error.status} ${error.message}`);
      }
      throw new Error(
        "Failed to generate array of skills due to an internal error.",
      );
    }
  },
});
