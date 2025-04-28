import { createOpenAI } from "@ai-sdk/openai";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { generateObject } from "ai";
import { z } from "zod";

export const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  compatibility: "strict", // This ensures strict mode for the OpenAI API
});

export const parseResume = action({
  args: {
    resumeText: v.string(),
    existingProfile: v.optional(v.string()),
  },
  handler: async (_, args) => {
    try {
      // Prepare existing profile context if available
      let existingProfileContext = "";
      if (args.existingProfile && args.existingProfile.trim()) {
        try {
          const profile = JSON.parse(args.existingProfile);
          existingProfileContext = `
===== EXISTING PROFILE DATA =====

This is the user's current profile data that should be used as a reference when parsing. 
Update this data with new information from the resume(s), but keep existing information 
if the resume doesn't contain conflicting or improved data:

${JSON.stringify(profile, null, 2)}

`;
        } catch (error) {
          console.error("Error parsing existing profile:", error);
        }
      }

      const systemPrompt =
        "You are a resume parser that extracts structured information from resume text. " +
        "Parse the provided resume text into a structured profile format, ensuring all dates are in YYYY-MM-DD format. " +
        "If the text contains multiple resume sections with clear separators, merge the information intelligently, keeping the most comprehensive and recent data. " +
        "If the text contains multiple resumes, try to combine (add/update) the results. " +
        "For conflicting information, prefer the most recent or most detailed information. " +
        (existingProfileContext
          ? "IMPORTANT: The user already has an existing profile. Use this as a base and update it with any new or improved information from the resume(s). " +
            "Retain all existing profile information unless explicitly contradicted or improved by the resume data. "
          : "") +
        "For any links, please always include the https:// prefix. " +
        "Output a JSON object that exactly fits the following schema. " +
        (existingProfileContext ? existingProfileContext : "") +
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
            .nullable()
            .optional()
            .describe("Phone number of the candidate"),
          location: z
            .string()
            .nullable()
            .optional()
            .describe("Location or address of the candidate"),
          socialLinks: z
            .array(
              z.object({
                platform: z
                  .string()
                  .nullable()
                  .optional()
                  .describe(
                    "Name of the social platform. Only include LinkedIn, GitHub, and Website (use those exact names, same case). Website meaning the candidate's personal website.",
                  ),
                url: z
                  .string()
                  .nullable()
                  .optional()
                  .describe(
                    "Full URL to the candidate's profile on this platform. Please always include the https:// prefix.",
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
                  .nullable()
                  .optional()
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
                    "End date in YYYY-MM format. If unknown or unclear, then ignore this field.",
                  ),
                gpa: z
                  .number()
                  .nullable()
                  .optional()
                  .describe("Grade Point Average if mentioned"),
                description: z
                  .string()
                  .nullable()
                  .optional()
                  .describe("Additional details about the education"),
                location: z
                  .string()
                  .nullable()
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
                  .nullable()
                  .optional()
                  .describe("Job title or role at the company"),
                location: z
                  .string()
                  .nullable()
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
                  .describe(
                    "End date in YYYY-MM format. If unknown or unclear or present/ongoing, then ignore this field.",
                  ),
                current: z
                  .boolean()
                  .nullable()
                  .optional()
                  .default(false)
                  .describe("Whether this is the candidate's current position"),
                description: z
                  .array(z.string())
                  .default([])
                  .describe("List of job responsibilities and achievements"),
                technologies: z
                  .array(z.string())
                  .default([])
                  .describe(
                    "Technologies or tools used in this role. (e.g. 'Python', 'JavaScript', 'React', 'Node.js', 'SQL', 'Git', 'Docker', 'AWS')",
                  ),
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
                  .describe(
                    "When the project ended in YYYY-MM format. If the project is ongoing/present, then ignore this field.",
                  ),
                technologies: z
                  .array(z.string())
                  .default([])
                  .describe(
                    "Technologies, languages, or frameworks used. (e.g. 'Python', 'JavaScript', 'React', 'Node.js', 'SQL', 'Git', 'Docker', 'AWS')",
                  ),
                link: z
                  .string()
                  .nullable()
                  .optional()
                  .describe("URL to the live project if available"),
                githubUrl: z
                  .string()
                  .nullable()
                  .optional()
                  .describe("URL to the project's GitHub repository"),
                highlights: z
                  .array(z.string())
                  .default([])
                  .describe(
                    "Key achievements or notable aspects of the project. (e.g. 'Won hackathon', 'Won award', 'Sold product', 'Raised $100k', 'Published paper', 'Open-sourced code')",
                  ),
              }),
            )
            .default([])
            .describe("Projects completed by the candidate"),

          skills: z
            .array(z.string())
            .default([])
            .describe(
              "All relevant skills of the candidate. (e.g. 'Python', 'JavaScript', 'React', 'Node.js', 'SQL', 'Git', 'Docker', 'AWS')",
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
