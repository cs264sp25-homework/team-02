import { action } from "./_generated/server";
import { v } from "convex/values";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Structure for the generated questions (technical and non-technical)
interface GeneratedQuestions {
  technical: string[];
  nonTechnical: string[];
}

export const generateQuestions = action({
  args: {
    jobDetailsText: v.string(),
  },
  handler: async (_, args): Promise<GeneratedQuestions> => {
    if (!args.jobDetailsText) {
      throw new Error("Job details text cannot be empty.");
    }

    const systemPrompt = `
You are an expert career advisor and interviewer. Based on the following job details, generate a list of potential interview questions.
Separate the questions into two distinct categories: "technical" and "nonTechnical".
Provide 5 technical questions relevant to the skills and responsibilities mentioned.
Provide 5 non-technical (behavioral, situational, cultural fit) questions relevant to the role and company context if available.
Format your response ONLY as a JSON object with two keys: "technical" (an array of strings) and "nonTechnical" (an array of strings).
Example JSON format:
{
  "technical": ["Question 1", "Question 2", ...],
  "nonTechnical": ["Question 1", "Question 2", ...]
}
Do not include any introductory text, explanations, or markdown formatting outside the JSON structure.
`;

    const userPrompt = `Job Details:
${args.jobDetailsText}`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.5,
        max_tokens: 500,
      });

      const content = completion.choices[0]?.message?.content;

      if (!content) {
        throw new Error("OpenAI response content is empty.");
      }

      // Parse the JSON response
      let parsedQuestions: GeneratedQuestions;
      try {
        parsedQuestions = JSON.parse(content) as GeneratedQuestions;
        // Basic validation of the parsed structure
        if (
          !parsedQuestions ||
          !Array.isArray(parsedQuestions.technical) ||
          !Array.isArray(parsedQuestions.nonTechnical)
        ) {
          throw new Error("Invalid JSON structure received from OpenAI.");
        }
      } catch (parseError) {
        console.error(
          "Failed to parse OpenAI JSON response:",
          content,
          parseError,
        );
        throw new Error(
          "Failed to parse interview questions from AI response.",
        );
      }

      return parsedQuestions;
    } catch (error) {
      console.error("Error generating interview questions:", error);
      if (error instanceof OpenAI.APIError) {
        throw new Error(`OpenAI API Error: ${error.status} ${error.message}`);
      }
      throw new Error(
        "Failed to generate interview questions due to an internal error.",
      );
    }
  },
});
