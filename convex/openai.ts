import { createOpenAI } from "@ai-sdk/openai";
import { internalAction, mutation } from "./_generated/server";
import { v } from "convex/values";
import { streamText, generateObject } from "ai";
import { z } from "zod";

export const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  compatibility: "strict", // This ensures strict mode for the OpenAI API
});

export const completion = internalAction({
  args: {
    messages: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
      }),
    ),
  },
  handler: async (_, args) => {
    const { textStream } = streamText({
      model: openai("gpt-4o-mini"),
      temperature: 0,
      messages: args.messages,
      tools: {},
      onStepFinish: ({
        text,
        reasoning,
        sources,
        toolCalls,
        toolResults,
        finishReason,
        usage,
        warnings,
        logprobs,
        request,
        response,
        providerMetadata,
        stepType,
        isContinued,
      }) => {
        console.log("Text", text);
        console.log("Tool calls:", toolCalls);
        console.log("Tool results:", toolResults);
        console.log("Reasoning:", reasoning);
        console.log("Sources:", sources);
        console.log("Finish reason:", finishReason);
        console.log("Usage:", usage);
        console.log("Warnings:", warnings);
        console.log("Logprobs:", logprobs);
        console.log("Request:", request);
        console.log("Response:", response);
        console.log("Provider metadata:", providerMetadata);
        console.log("Step type:", stepType);
        console.log("Is continued:", isContinued);
      },
    });
    let fullResponse = "";
    for await (const delta of textStream) {
      fullResponse += delta;
    }
    console.log(fullResponse);
    return fullResponse;
  },
});

export const parseResume = mutation({
  args: {
    resumeText: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const systemPrompt =
        "You are a resume parser that extracts structured information from resume text. " +
        "Parse the provided resume text into a structured profile format, ensuring all dates are in YYYY-MM format. " +
        "Here is the resume text:\n\n" +
        args.resumeText;

      const { object } = await generateObject({
        model: openai("gpt-4o-mini"),
        prompt: systemPrompt,
        schema: z.object({
          name: z.string(),
          email: z.string(),
          phone: z.optional(z.string()),
          location: z.optional(z.string()),
          profilePictureUrl: z.optional(z.string()),

          socialLinks: z.optional(
            z.array(
              z.object({
                platform: z.string(),
                url: z.string(),
              }),
            ),
          ),

          education: z.array(
            z.object({
              institution: z.string(),
              degree: z.string(),
              field: z.string(),
              startDate: z.string(),
              endDate: z.optional(z.string()),
              gpa: z.optional(z.number()),
              description: z.optional(z.string()),
              location: z.optional(z.string()),
            }),
          ),

          workExperience: z.array(
            z.object({
              company: z.string(),
              position: z.string(),
              location: z.optional(z.string()),
              startDate: z.string(),
              endDate: z.optional(z.string()),
              current: z.boolean(),
              description: z.array(z.string()),
              technologies: z.optional(z.array(z.string())),
            }),
          ),

          projects: z.array(
            z.object({
              name: z.string(),
              description: z.array(z.string()),
              startDate: z.optional(z.string()),
              endDate: z.optional(z.string()),
              technologies: z.array(z.string()),
              link: z.optional(z.string()),
              githubUrl: z.optional(z.string()),
              highlights: z.optional(z.array(z.string())),
            }),
          ),

          skills: z.record(z.string(), z.array(z.string())),
        }),
      });

      return object;
    } catch (error) {
      console.error("Error parsing resume:", error);
      throw error;
    }
  },
});
