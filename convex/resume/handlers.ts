import {
  internalAction,
  ActionCtx,
  mutation,
  query,
  action,
} from "../_generated/server";
import { v } from "convex/values";
import { openai } from "../openai";
import {
  CoreMessage,
  generateObject,
  NoObjectGeneratedError,
  streamText,
} from "ai";
import { api, internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import {
  getResumeEnhancementSystemPrompt,
  getTailoredProfilePrompt,
} from "./prompts";
import { generationStatus } from "./schema";
import { ConvexError } from "convex/values";
import { generateJakesResume } from "./templates";
import { ProfileType, zodProfileInSchema } from "../profiles";
import { cleanTailoredProfile } from "./verifiers";

export const startResumeGeneration = mutation({
  args: {
    userId: v.string(),
    jobId: v.optional(v.string()),
    aiEnhancementPrompt: v.optional(v.string()),
  },
  handler: async (ctx, { userId, jobId, aiEnhancementPrompt }) => {
    // check if resume already exists for this job id, using index
    const resume = await ctx.db
      .query("resumes")
      .withIndex("by_jobId", (q) => q.eq("jobId", jobId))
      .first();
    if (resume) {
      return resume._id;
    }
    const resumeId = await ctx.db.insert("resumes", {
      userId,
      jobId,
      generationStatus: "started",
      generationError: undefined,
      latexContent: "",
      chunkCount: 0,
      tailoredProfile: {},
    });
    ctx.scheduler.runAfter(0, internal.resume.handlers.generateResume, {
      userId,
      jobId,
      aiEnhancementPrompt,
      placeHolderResumeId: resumeId,
    });
    return resumeId;
  },
});

export const restartResumeGeneration = mutation({
  args: {
    resumeId: v.id("resumes"),
    userId: v.string(),
    jobId: v.optional(v.string()),
    aiEnhancementPrompt: v.optional(v.string()),
  },
  handler: async (ctx, { resumeId, userId, jobId, aiEnhancementPrompt }) => {
    await ctx.db.patch(resumeId, {
      generationStatus: "started",
      generationError: undefined,
      latexContent: "",
      chunkCount: 0,
      tailoredProfile: {},
    });
    ctx.scheduler.runAfter(0, internal.resume.handlers.generateResume, {
      userId,
      jobId,
      aiEnhancementPrompt,
      placeHolderResumeId: resumeId,
    });
  },
});

export const generateResume = internalAction({
  args: {
    userId: v.string(),
    jobId: v.optional(v.string()),
    aiEnhancementPrompt: v.optional(v.string()),
    placeHolderResumeId: v.optional(v.id("resumes")),
  },
  handler: async (
    ctx,
    { userId, jobId, aiEnhancementPrompt, placeHolderResumeId },
  ) => {
    let resumeId = placeHolderResumeId;
    if (!resumeId) {
      resumeId = await ctx.runMutation(
        api.resume.handlers.initializeResumeGeneration,
        {
          userId,
          jobId,
        },
      );
    }

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
        status: "compiling resume",
      });

      await compileAndUploadResume(latexContent, resumeId, ctx);

      await ctx.runMutation(api.resume.handlers.updateResumeGenerationStatus, {
        resumeId,
        status: "completed",
      });

      return latexContent;
    } catch (error: unknown) {
      console.error("Failed to generate resume: " + error);
      const resume = await ctx.runQuery(api.resume.handlers.getResumeById, {
        userId,
        resumeId,
      });
      const statusBeforeFailure = resume?.generationStatus;
      await ctx.runMutation(api.resume.handlers.updateResumeGenerationStatus, {
        resumeId,
        status: "failed",
        statusBeforeFailure: statusBeforeFailure,
        generationError:
          error instanceof Error ? error.message : "Unknown error",
      });
      throw new ConvexError("Failed to generate resume: " + error);
    }
  },
});

export const compileAndSaveResume = action({
  args: {
    userId: v.string(),
    resumeId: v.id("resumes"),
    latexContent: v.string(),
  },
  handler: async (ctx, { userId, resumeId, latexContent }) => {
    const resume = await ctx.runQuery(api.resume.handlers.getResumeById, {
      userId,
      resumeId,
    });
    if (!resume) {
      throw new Error("Resume not found");
    }
    await ctx.runMutation(api.resume.handlers.updateResumeLaTeXContent, {
      resumeId,
      latexContent,
    });

    try {
      await compileAndUploadResume(latexContent, resumeId, ctx);
      await ctx.runMutation(
        api.resume.handlers.updateResumeUserResumeCompilationErrorMessage,
        {
          resumeId,
          userResumeCompilationErrorMessage: "",
        },
      );
    } catch (error) {
      await ctx.runMutation(
        api.resume.handlers.updateResumeUserResumeCompilationErrorMessage,
        {
          resumeId,
          userResumeCompilationErrorMessage:
            error instanceof Error ? error.message : "Unknown error",
        },
      );
      throw new ConvexError(
        "Failed to compile and save resume: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    }
  },
});

export const deleteResume = mutation({
  args: {
    userId: v.string(),
    resumeId: v.id("resumes"),
  },
  handler: async (ctx, { userId, resumeId }) => {
    // first delete the compiled resume from storage
    const resume = await ctx.runQuery(api.resume.handlers.getResumeById, {
      userId,
      resumeId,
    });
    if (!resume) {
      throw new Error("Resume not found");
    }
    await Promise.all([
      Promise.all(
        resume.compiledResumeStorageId
          ? [ctx.storage.delete(resume.compiledResumeStorageId)]
          : [],
      ),
      ctx.db.delete(resumeId),
    ]);
  },
});
export const updateResumeUserResumeCompilationErrorMessage = mutation({
  args: {
    resumeId: v.id("resumes"),
    userResumeCompilationErrorMessage: v.string(),
  },
  handler: async (ctx, { resumeId, userResumeCompilationErrorMessage }) => {
    await ctx.db.patch(resumeId, {
      userResumeCompilationErrorMessage,
    });
  },
});

async function compileAndUploadResume(
  latexContent: string,
  resumeId: Id<"resumes">,
  ctx: ActionCtx,
) {
  try {
    const response = await fetch(
      "https://latex-compiler-393050277209.us-central1.run.app/latex/compile",
      {
        method: "POST",
        body: latexContent,
      },
    );

    if (!response.ok) {
      const body = await response.json();
      throw new Error("Failed to compile resume: " + body.details);
    }

    const pdfBuffer = await response.arrayBuffer();
    // get storage url
    const storageUrl = await ctx.storage.generateUploadUrl();
    const result = await fetch(storageUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/pdf",
      },
      body: pdfBuffer,
    });

    if (!result.ok) {
      const body = await result.json();
      console.error("Failed to upload resume: " + body.details);
      throw new Error(`Upload failed: ${body.details}`);
    }

    const { storageId } = await result.json();

    await ctx.runMutation(
      api.resume.handlers.updateResumeCompiledResumeStorageId,
      {
        resumeId,
        compiledResumeStorageId: storageId,
      },
    );
    const compiledResumeUrl = await ctx.storage.getUrl(storageId);
    if (!compiledResumeUrl) {
      throw new Error("Failed to get compiled resume URL");
    }
    await ctx.runMutation(api.resume.handlers.updateResumeCompiledResumeUrl, {
      resumeId,
      compiledResumeUrl,
    });
  } catch (error: unknown) {
    console.error("Failed to compile and upload resume: " + error);
    throw new ConvexError("Failed to compile and upload resume: " + error);
  }
}

export const getResumeById = query({
  args: {
    resumeId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, { resumeId, userId }) => {
    return await ctx.db
      .query("resumes")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("_id"), resumeId))
      .first();
  },
});

export const getResumeByJobId = query({
  args: {
    jobId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, { jobId }) => {
    return await ctx.db
      .query("resumes")
      .withIndex("by_jobId", (q) => q.eq("jobId", jobId))
      .first();
  },
});

export const updateResumeCompiledResumeUrl = mutation({
  args: {
    resumeId: v.id("resumes"),
    compiledResumeUrl: v.string(),
  },
  handler: async (ctx, { resumeId, compiledResumeUrl }) => {
    await ctx.db.patch(resumeId, {
      compiledResumeUrl,
    });
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
    statusBeforeFailure: v.optional(generationStatus),
  },
  handler: async (
    ctx,
    { resumeId, status, generationError, statusBeforeFailure },
  ) => {
    await ctx.db.patch(resumeId, {
      generationStatus: status,
      generationError: generationError,
      statusBeforeFailure: statusBeforeFailure,
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

export const updateResumeCompiledResumeStorageId = mutation({
  args: {
    resumeId: v.id("resumes"),
    compiledResumeStorageId: v.id("_storage"),
  },
  handler: async (ctx, { resumeId, compiledResumeStorageId }) => {
    await ctx.db.patch(resumeId, {
      compiledResumeStorageId,
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
    console.log("Raw profile", object);
    // remove any work experience, education, or projects that do not match the user's profile
    const tailoredProfile = cleanTailoredProfile(
      {
        ...object,
        userId,
      },
      profile,
    );
    await ctx.runMutation(api.resume.handlers.updateResumeTailoredProfile, {
      resumeId: resumeId as Id<"resumes">,
      tailoredProfile,
    });
    return tailoredProfile;
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
