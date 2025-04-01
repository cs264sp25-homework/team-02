import { createOpenAI } from "@ai-sdk/openai";
import { internalAction, action } from "./_generated/server";
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

export const parseResume = action({
  args: {
    resumeText: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      console.log("Parsing resume...");
      const systemPrompt =
        "You are a resume parser that extracts structured information from resume text. " +
        "Parse the provided resume text into a structured profile format, ensuring all dates are in YYYY-MM format. " +
        "Output a JSON object that exactly fits the following schema. For the skills field, " +
        "make sure it is an object mapping categories (like 'Programming Languages', 'Tools', etc.) " +
        "to arrays of strings. If the resume only provides a list of skills, wrap them under a default category called 'General'. " +
        "Here is the resume text:\n\n" +
        args.resumeText;

      const { object } = await generateObject({
        model: openai("gpt-4o-mini"),
        prompt: systemPrompt,
        schema: z.object({
          name: z.string().describe("Full name of the candidate"),
          email: z
            .string()
            .nullable()
            .optional()
            .describe("Email address of the candidate"),
          phone: z
            .string()
            .optional()
            .describe("Phone number of the candidate"),
          location: z
            .string()
            .optional()
            .describe("Location or address of the candidate"),
          profilePictureUrl: z
            .string()
            .optional()
            .describe("URL to the candidate's profile picture if available"),

          socialLinks: z
            .array(
              z.object({
                platform: z
                  .string()
                  .describe(
                    "Name of the social platform (e.g., LinkedIn, GitHub)",
                  ),
                url: z
                  .string()
                  .describe(
                    "Full URL to the candidate's profile on this platform",
                  ),
              }),
            )
            .default([])
            .describe("List of the candidate's social media profiles"),

          education: z
            .array(
              z.object({
                institution: z
                  .string()
                  .describe("Name of the school, college, or university"),
                degree: z
                  .string()
                  .nullable()
                  .optional()
                  .describe("Degree obtained (e.g., Bachelor's, Master's)"),
                field: z
                  .string()
                  .nullable()
                  .optional()
                  .describe("Field of study or major"),
                startDate: z
                  .string()
                  .nullable()
                  .optional()
                  .describe("Start date in YYYY-MM format"),
                endDate: z
                  .string()
                  .nullable()
                  .optional()
                  .describe(
                    "End date in YYYY-MM format or 'Present' if ongoing",
                  ),
                gpa: z
                  .number()
                  .optional()
                  .describe("Grade Point Average if mentioned"),
                description: z
                  .string()
                  .optional()
                  .describe("Additional details about the education"),
                location: z
                  .string()
                  .optional()
                  .describe("Location of the institution"),
              }),
            )
            .default([])
            .describe("Educational background of the candidate"),

          workExperience: z
            .array(
              z.object({
                company: z.string().describe("Name of the employer or company"),
                position: z
                  .string()
                  .describe("Job title or role at the company"),
                location: z
                  .string()
                  .optional()
                  .describe("Location of the job (city, country, or remote)"),
                startDate: z
                  .string()
                  .nullable()
                  .optional()
                  .describe("Start date in YYYY-MM format"),
                endDate: z
                  .string()
                  .nullable()
                  .optional()
                  .describe("End date in YYYY-MM format or null if current"),
                current: z
                  .boolean()
                  .describe("Whether this is the candidate's current position"),
                description: z
                  .array(z.string())
                  .default([])
                  .describe("List of job responsibilities and achievements"),
                technologies: z
                  .array(z.string())
                  .optional()
                  .describe("Technologies or tools used in this role"),
              }),
            )
            .default([])
            .describe("Professional work experience of the candidate"),

          projects: z
            .array(
              z.object({
                name: z.string().describe("Name or title of the project"),
                description: z
                  .array(z.string())
                  .default([])
                  .describe("Detailed description of the project"),
                startDate: z
                  .string()
                  .nullable()
                  .optional()
                  .describe("When the project started in YYYY-MM format"),
                endDate: z
                  .string()
                  .nullable()
                  .optional()
                  .describe("When the project ended in YYYY-MM format"),
                technologies: z
                  .array(z.string())
                  .default([])
                  .describe("Technologies, languages, or frameworks used"),
                link: z
                  .string()
                  .optional()
                  .describe("URL to the live project if available"),
                githubUrl: z
                  .string()
                  .optional()
                  .describe("URL to the project's GitHub repository"),
                highlights: z
                  .array(z.string())
                  .optional()
                  .describe(
                    "Key achievements or notable aspects of the project",
                  ),
              }),
            )
            .default([])
            .describe("Projects completed by the candidate"),

          // Preprocess the skills field so that if an array is provided, it gets wrapped in an object
          skills: z.preprocess(
            (val) => {
              if (Array.isArray(val)) {
                return { General: val };
              }
              return val;
            },
            z
              .record(z.array(z.string()))
              .default({})
              .describe(
                "Skills grouped by category (e.g., 'Programming Languages': ['JavaScript', 'Python'])",
              ),
          ),
        }),
      });

      return object;
    } catch (error) {
      console.error("Error parsing resume:", error);
      throw error;
    }
  },
});
