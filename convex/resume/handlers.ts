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
  getResumeEnhancementSystemPrompt,
  getTailoredProfilePrompt,
} from "./prompts";
import { generationStatus } from "./schema";
import { ConvexError } from "convex/values";
import { generateJakesResume } from "./templates";
import { ProfileType, zodProfileInSchema } from "../profiles";

export const generateResume = internalAction({
  args: {
    userId: v.string(),
    jobId: v.optional(v.string()),
    aiEnhancementPrompt: v.optional(v.string()),
  },
  handler: async (ctx, { userId, jobId, aiEnhancementPrompt }) => {
    const resumeId = await ctx.runMutation(
      api.resume.handlers.initializeResumeGeneration,
      {
        userId,
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

      let tailoredProfile: ProfileType = profile;
      if (jobId) {
        tailoredProfile = await createTailoredProfile(
          profile,
          jobId,
          userId,
          resumeId,
          ctx,
        );
      }

      await ctx.runMutation(api.resume.handlers.updateResumeGenerationStatus, {
        resumeId,
        status: "generating tailored resume",
      });

      let latexContent = generateJakesResume(tailoredProfile);
      await ctx.runMutation(api.resume.handlers.updateResumeLaTeXContent, {
        resumeId,
        latexContent,
      });

      if (aiEnhancementPrompt) {
        // Generate LaTeX content using ChatGPT, run internal action
        latexContent = await enhanceLatexWithAI(
          latexContent,
          aiEnhancementPrompt,
          resumeId,
          ctx,
        );
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
    jobId: v.optional(v.string()),
  },
  handler: async (ctx, { userId, jobId }) => {
    const resumeId = await ctx.db.insert("resumes", {
      userId,
      jobId,
      generationStatus: "started",
      generationError: undefined,
      latexContent: "",
      chunkCount: 0,
      tailoredProfile: {},
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
  jobId: string,
  userId: string,
  resumeId: string,
  ctx: ActionCtx,
): Promise<ProfileType> {
  await ctx.runMutation(api.resume.handlers.updateResumeGenerationStatus, {
    resumeId: resumeId as Id<"resumes">,
    status: "generating tailored profile",
  });
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
    await ctx.runMutation(api.resume.handlers.updateResumeTailoredProfile, {
      resumeId: resumeId as Id<"resumes">,
      tailoredProfile: object,
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

export const updateResumeTailoredProfile = mutation({
  args: {
    resumeId: v.id("resumes"),
    tailoredProfile: v.record(v.string(), v.any()),
  },
  handler: async (ctx, { resumeId, tailoredProfile }) => {
    await ctx.db.patch(resumeId, {
      tailoredProfile,
    });
  },
});

async function enhanceLatexWithAI(
  latexContent: string,
  enhancementPrompt: string,
  resumeId: Id<"resumes">,
  ctx: ActionCtx,
) {
  await ctx.runMutation(api.resume.handlers.updateResumeGenerationStatus, {
    resumeId,
    status: "enhancing resume with AI",
  });
  const messages = [
    {
      role: "system",
      content: getResumeEnhancementSystemPrompt(latexContent),
    },
    {
      role: "user",
      content: enhancementPrompt,
    },
  ];

  const { textStream } = streamText({
    model: openai("gpt-4o-mini"),
    messages: messages as CoreMessage[],
    onError: (error) => {
      throw new Error("Failed to generate resume: " + error);
    },
  });

  let enhancedLatexContent = "";
  let chunkCount = 0;
  for await (const delta of textStream) {
    enhancedLatexContent += delta;
    await ctx.runMutation(api.resume.handlers.updateResumeLaTeXContent, {
      resumeId,
      latexContent: enhancedLatexContent,
    });
    chunkCount++;
    if (chunkCount % 10 === 0) {
      await ctx.runMutation(api.resume.handlers.updateResumeChunkCount, {
        resumeId,
        chunkCount,
      });
    }
  }
  return enhancedLatexContent;
}
