import { ActionCtx, internalAction, mutation } from "../_generated/server";
import { v } from "convex/values";
import { openai } from "../openai";
import {
  CoreMessage,
  generateObject,
  NoObjectGeneratedError,
  streamText,
} from "ai";
import { api } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import {
  getResumeGenerationSystemPrompt,
  getTailoredProfilePrompt,
} from "./prompts";
import { generationStatus } from "./schema";
import { ConvexError } from "convex/values";
import { generateJakesResume } from "./templates";
import { ProfileType, zodProfileInSchema } from "../profiles";

export const generateResume = internalAction({
  args: {
    userId: v.string(),
    templateStorageId: v.string(),
    jobId: v.optional(v.string()),
    useAI: v.optional(v.boolean()),
  },
  handler: async (ctx, { userId, templateStorageId, jobId, useAI }) => {
    const resumeId = await ctx.runMutation(
      api.resume.handlers.initializeResumeGeneration,
      {
        userId,
        templateStorageId,
        jobId,
      },
    );

    if (!resumeId) {
      throw new ConvexError("Failed to initialize resume generation");
    }

    try {
      await ctx.runMutation(api.resume.handlers.updateResumeGenerationStatus, {
        resumeId,
        status: "fetching profile",
      });

      // Get the user's profile
      const profile = await ctx.runQuery(api.profiles.getProfileByUserId, {
        userId,
      });

      if (!profile) {
        throw new Error("Profile not found");
      }

      await ctx.runMutation(api.resume.handlers.updateResumeGenerationStatus, {
        resumeId,
        status: "generating tailored profile",
      });
      let tailoredProfile: ProfileType = profile;
      if (jobId) {
        tailoredProfile = await createTailoredProfile(
          profile,
          jobId as Id<"jobs">,
          userId,
          ctx,
        );
      }

      await ctx.runMutation(api.resume.handlers.updateResumeGenerationStatus, {
        resumeId,
        status: "generating tailored resume",
      });

      let latexContent = "";

      if (useAI) {
        // Generate LaTeX content using ChatGPT, run internal action
        latexContent = await generateWithAI(
          tailoredProfile,
          resumeId,
          templateStorageId as Id<"_storage">,
          ctx,
        );
      } else {
        // Generate LaTeX content using Jakes template
        latexContent = generateJakesResume(tailoredProfile);
        await ctx.runMutation(api.resume.handlers.updateResumeLaTeXContent, {
          resumeId,
          latexContent,
        });
      }

      await ctx.runMutation(api.resume.handlers.updateResumeGenerationStatus, {
        resumeId,
        status: "completed",
      });

      return latexContent;
    } catch (error: unknown) {
      console.error("Failed to generate resume: " + error);
      await ctx.runMutation(api.resume.handlers.updateResumeGenerationStatus, {
        resumeId,
        status: "failed",
        generationError:
          error instanceof Error ? error.message : "Unknown error",
      });
      throw new ConvexError("Failed to generate resume: " + error);
    }
  },
});

export const initializeResumeGeneration = mutation({
  args: {
    userId: v.string(),
    templateStorageId: v.string(),
    jobId: v.optional(v.string()),
  },
  handler: async (ctx, { userId, templateStorageId, jobId }) => {
    const resumeId = await ctx.db.insert("resumes", {
      userId,
      templateStorageId,
      jobId,
      generationStatus: "started",
      generationError: undefined,
      latexContent: "",
      chunkCount: 0,
    });

    return resumeId;
  },
});
export const updateResumeGenerationStatus = mutation({
  args: {
    resumeId: v.id("resumes"),
    status: generationStatus,
    generationError: v.optional(v.string()),
  },
  handler: async (ctx, { resumeId, status, generationError }) => {
    await ctx.db.patch(resumeId, {
      generationStatus: status,
      generationError: generationError,
    });
  },
});

export const updateResumeLaTeXContent = mutation({
  args: {
    resumeId: v.id("resumes"),
    latexContent: v.string(),
  },
  handler: async (ctx, { resumeId, latexContent }) => {
    await ctx.db.patch(resumeId, {
      latexContent,
    });
  },
});

export const updateResumeChunkCount = mutation({
  args: {
    resumeId: v.id("resumes"),
    chunkCount: v.number(),
  },
  handler: async (ctx, { resumeId, chunkCount }) => {
    await ctx.db.patch(resumeId, {
      chunkCount,
    });
  },
});

async function createTailoredProfile(
  profile: ProfileType,
  jobId: Id<"jobs">,
  userId: string,
  ctx: ActionCtx,
): Promise<ProfileType> {
  const job = await ctx.runQuery(api.jobs.getJobById, {
    jobId: jobId as Id<"jobs">,
    userId,
  });

  if (!job) {
    throw new Error("Job not found");
  }

  const jobDescription = job.description;
  try {
    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      prompt: getTailoredProfilePrompt(profile, jobDescription),
      schema: zodProfileInSchema,
    });
    return {
      ...object,
      userId,
    };
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) {
      console.error("NoObjectGeneratedError");
      console.error("Cause:", error.cause);
      console.error("Text:", error.text);
      console.error("Response:", error.response);
      console.error("Usage:", error.usage);
    }
    throw new ConvexError("Failed to generate tailored profile: " + error);
  }
}

async function generateWithAI(
  profile: ProfileType,
  resumeId: Id<"resumes">,
  templateStorageId: Id<"_storage">,
  ctx: ActionCtx,
) {
  const resumeTemplate = await ctx.storage.get(
    templateStorageId as Id<"_storage">,
  );

  if (!resumeTemplate) {
    throw new Error("Requested resume template not found");
  }
  const systemPrompt = await getResumeGenerationSystemPrompt(resumeTemplate);

  const messages = [
    {
      role: "system",
      content: systemPrompt,
    },
    {
      role: "user",
      content: `Generate a LaTeX resume for the following profile:
          ${JSON.stringify(profile)}
          `,
    },
  ];

  const { textStream } = streamText({
    model: openai("gpt-4o-mini"),
    messages: messages as CoreMessage[],
    onError: (error) => {
      throw new Error("Failed to generate resume: " + error);
    },
  });

  let latexContent = "";
  let chunkCount = 0;
  for await (const delta of textStream) {
    latexContent += delta;
    await ctx.runMutation(api.resume.handlers.updateResumeLaTeXContent, {
      resumeId,
      latexContent,
    });
    chunkCount++;
    if (chunkCount % 10 === 0) {
      await ctx.runMutation(api.resume.handlers.updateResumeChunkCount, {
        resumeId,
        chunkCount,
      });
    }
  }
  return latexContent;
}
