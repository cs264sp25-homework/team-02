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

export const generateJobQuestions = action({
  args: {
    jobTitle: v.string(),
    jobRequirements: v.string(),
    jobQuestions: v.array(v.string()),
    userBackground: v.string(),
  },
  handler: async (_, args) => {
    console.log("Starting generateJobQuestions...");
    console.log("Job Title:", args.jobTitle);
    console.log("Job Requirements:", args.jobRequirements);
    console.log("Job Questions:", args.jobQuestions);
    console.log("User Background:", args.userBackground);

    const formattedQuestions = args.jobQuestions
      .map((q, index) => `${index + 1}. ${q}`)
      .join("\n");
    console.log("Formatted Questions:", formattedQuestions);

    const systemPrompt = `
      You are an experienced career coach specializing in job applications, resume writing, and interview preparation. 
      Your role is to generate well-structured and compelling responses to job application questions based on the user's education, experiences, and skills.

      ### Job Details:
        - **Job Title:** ${args.jobTitle}
        - **Job Requirements:** ${args.jobRequirements}

      ### User Background: ${args.userBackground}

      ### Instructions:
      1. **Craft tailored responses** that align with the job title and requirements.
      2. **Emphasize relevant skills, experiences, and achievements** from the user's background. If they don't have anything in the user background, tell
      them that they need to add experience, skills, education to their profile. Do not make things up! Always base the responses on the user's background given to you.
      3. **Use a confident and professional tone** to make the user stand out.
      4. **Optimize for ATS (Applicant Tracking System)** by naturally incorporating key industry-specific keywords.
      5. **Where applicable, use the STAR (Situation, Task, Action, Result) method** to structure responses effectively.

      IMPORTANT: Return ONLY a raw JSON array of responses, without any markdown formatting or code blocks. 
      The response should be a valid JSON array where each item has a "response" field containing the answer.
      Example format:
      [{"response": "First answer"}, {"response": "Second answer"}, ...]

      ### Job Application Questions:
      ${formattedQuestions}`;

    try {
      console.log("About to call streamText...");
      console.log("OpenAI API Key exists:", !!process.env.OPENAI_API_KEY);

      const { textStream } = streamText({
        model: openai("gpt-4o-mini"),
        temperature: 0.7, // Add some temperature for more creative responses
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content:
              "Generate structured JSON responses for the job application questions.",
          },
        ],
      });
      console.log("Got textStream, starting to collect response...");
      let fullResponse = "";
      try {
        for await (const delta of textStream) {
          if (delta) {
            fullResponse += delta;
          }
        }

        console.log("Full response:", fullResponse);
      } catch (streamError) {
        console.error("Error during streaming:", streamError);
        throw new Error(
          `Streaming error: ${streamError instanceof Error ? streamError.message : String(streamError)}`,
        );
      }

      // Validate that we got a response
      if (!fullResponse.trim()) {
        console.error(
          "Empty response received from AI. Full response:",
          fullResponse,
        );
        throw new Error("No response received from AI");
      }

      try {
        // Clean the response by removing markdown code block formatting
        const cleanedResponse = fullResponse
          .replace(/```json\n?/g, "") // Remove opening ```json
          .replace(/```\n?/g, "") // Remove closing ```
          .trim(); // Remove any extra whitespace

        console.log("Cleaned response:", cleanedResponse);
        const parsedResponse = JSON.parse(cleanedResponse);

        // Validate the response structure
        if (!Array.isArray(parsedResponse)) {
          throw new Error("AI response is not an array");
        }

        // Validate each item has the required fields
        const validResponses = parsedResponse.every(
          (item) => typeof item === "object" && "response" in item,
        );

        if (!validResponses) {
          throw new Error(
            "AI response items missing required 'response' field",
          );
        }

        return parsedResponse.map(
          (item: { response: string }) => item.response,
        );
      } catch (parseError: unknown) {
        console.error("Failed to parse AI response:", fullResponse);
        throw new Error(
          `Failed to parse AI response: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
        );
      }
    } catch (error) {
      console.error("Error generating job questions:", error);
      throw error;
    }
  },
});

export const parseResume = action({
  args: {
    resumeText: v.string(),
  },
  handler: async (_, args) => {
    try {
      console.log("Parsing resume...");
      const systemPrompt =
        "You are a resume parser that extracts structured information from resume text. " +
        "Parse the provided resume text into a structured profile format, ensuring all dates are in YYYY-MM format. " +
        "Output a JSON object that exactly fits the following schema. Here is the resume text:\n\n" +
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
                    "Name of the social platform (e.g., LinkedIn, GitHub)",
                  ),
                url: z
                  .string()
                  .nullable()
                  .optional()
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
