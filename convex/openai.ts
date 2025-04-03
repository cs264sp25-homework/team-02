import { createOpenAI } from "@ai-sdk/openai";
import { internalAction, action } from "./_generated/server";
import { v } from "convex/values";
import { streamText } from "ai";
import { parseResume } from "./resumeParser";

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
      2. **Emphasize relevant skills, experiences, and achievements** from the user's background.
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

export { parseResume };
