import OpenAI from "openai";
import { internalAction, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { getUserProfileContext } from "./openai";
import { ActionCtx } from "./_generated/server";

interface GeneratedAnswers {
  response: string[];
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const generateJobApplicationAnswers = action({
  args: {
    userId: v.string(),
    jobTitle: v.string(),
    jobRequirements: v.string(),
    jobQuestions: v.array(v.string()),
  },
  handler: async (ctx, args): Promise<GeneratedAnswers> => {
    const userProfile = await ctx.runQuery(api.profiles.getProfileByUserId, {
      userId: args.userId,
    });

    const formattedQuestions = args.jobQuestions
      .map((q, index) => `${index + 1}. ${q}`)
      .join("\n");

    const systemPrompt = `
    You are expert career coach specialized in crafting excellent job application answers.
      
    Based on the following job title, job requirements, job application questions, and the 
    user's profile, generate a list of answers for the job application questions.

    ### Instructions:
    1. **Craft tailored responses** that are well-structured and compelling, addressing each question.
    2. **Emphasize relevant projects, skills, experiences, and achievements** from the user's profile.
    3. If they don't have anything in the user background, tell them that they need to add experience, skills, education 
       to their profile. Do not make things up! Always base the responses on the "User Profile" given to you.
    4. **Use a confident and professional tone** to make the user stand out. But don't make the responses sound so AI generated.
       Maintain a human touch.
    5. **Optimize for ATS (Applicant Tracking System)** by naturally incorporating key industry-specific keywords.
    6. **Where applicable, use the STAR (Situation, Task, Action, Result) method** to structure responses effectively.

    Format your response ONLY as a JSON object with two keys: "technical" (an array of strings) and "nonTechnical" (an array of strings).
    Example JSON format:
    {
      "response": ["Answer 1", "Answer 2", ...]
    }

    Do not include any introductory text, explanations, or markdown formatting outside the JSON structure.
    `;

    let userPrompt = `
      ### Job Details:
        - **Job Title:** ${args.jobTitle}
        - **Job Requirements:** ${args.jobRequirements}
        
      ### Job Application Questions:
      ${formattedQuestions}`;

    if (userProfile) {
      userPrompt += getUserProfileContext(userProfile);
    }

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.5,
      });

      const content = completion.choices[0]?.message?.content;

      if (!content) {
        throw new Error("OpenAI response content is empty.");
      }

      // Parse the JSON response
      let parsedAnswers: GeneratedAnswers;
      try {
        parsedAnswers = JSON.parse(content) as GeneratedAnswers;
        // Basic validation of the parsed structure
        if (!parsedAnswers || !Array.isArray(parsedAnswers.response)) {
          throw new Error("Invalid JSON structure received from OpenAI.");
        }
      } catch (parseError: unknown) {
        console.error(
          "Failed to parse OpenAI JSON response:",
          content,
          parseError,
        );
        throw new Error(
          "Failed to parse application answers from AI response.",
        );
      }

      return parsedAnswers;
    } catch (error) {
      console.error("Error generating application answers:", error);
      if (error instanceof OpenAI.APIError) {
        throw new Error(`OpenAI API Error: ${error.status} ${error.message}`);
      }
      throw new Error(
        "Failed to generate application answers due to an internal error.",
      );
    }
  },
});
