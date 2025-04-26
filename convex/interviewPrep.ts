import { action } from "./_generated/server";
import { v } from "convex/values";
import OpenAI from "openai";
import { Id } from "./_generated/dataModel";
import { ActionCtx } from "./_generated/server";
import { api } from "./_generated/api";

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
    jobId: v.id("jobs"),
    userId: v.string(),
  },
  handler: async (
    ctx: ActionCtx,
    args: { jobId: Id<"jobs">; userId: string },
  ): Promise<GeneratedQuestions> => {
    const job = await ctx.runQuery(api.jobs.getJobById, {
      userId: args.userId,
      jobId: args.jobId,
    });

    if (!job) {
      throw new Error(
        `Job with ID ${args.jobId} not found or not accessible by user ${args.userId}.`,
      );
    }

    const jobDetailsText = job.description;

    if (!jobDetailsText) {
      throw new Error("Job details text cannot be empty.");
    }

    const systemPrompt = `
You are an expert career advisor and interviewer. Based on the following job details, generate a list of potential interview questions.
Separate the questions into two distinct categories: "technical" and "nonTechnical".
Provide 5 technical questions relevant to the skills and responsibilities mentioned.
Provide 5 non-technical (behavioral, situational, cultural fit) questions relevant to the role and company context if available.
If you are familiar with the company, you can incorporate company-specific questions or information.
Format your response ONLY as a JSON object with two keys: "technical" (an array of strings) and "nonTechnical" (an array of strings).
Example JSON format:
{
  "technical": ["Question 1", "Question 2", ...],
  "nonTechnical": ["Question 1", "Question 2", ...]
}
Do not include any introductory text, explanations, or markdown formatting outside the JSON structure.
`;

    const userPrompt = `Job Details:
${jobDetailsText}`;

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

/**
 * Generate feedback for a user's answer to an interview question
 */
export const generateFeedback = action({
  args: {
    jobId: v.id("jobs"),
    userId: v.string(),
    questionText: v.string(),
    userAnswer: v.string(),
    questionType: v.union(v.literal("technical"), v.literal("nonTechnical")),
  },
  handler: async (
    ctx: ActionCtx,
    args: {
      jobId: Id<"jobs">;
      userId: string;
      questionText: string;
      userAnswer: string;
      questionType: "technical" | "nonTechnical";
    },
  ): Promise<string> => {
    // Fetch job details and user profile
    const job = await ctx.runQuery(api.jobs.getJobById, {
      userId: args.userId,
      jobId: args.jobId,
    });

    if (!job) {
      throw new Error(
        `Job with ID ${args.jobId} not found or not accessible by user ${args.userId}.`,
      );
    }

    // Get user profile if available
    const userProfile = await ctx.runQuery(api.profiles.getProfileByUserId, {
      userId: args.userId,
    });

    // Create prompts for feedback generation
    const systemPrompt = `
You are an expert interviewer and career coach. Your task is to evaluate a candidate's answer to an interview question and provide constructive feedback.
The question is: "${args.questionText}"

This is a ${args.questionType === "technical" ? "technical" : "behavioral/non-technical"} question for a ${job.title} position.

Job description:
${job.description}

${
  userProfile
    ? `Candidate information (if relevant):
${userProfile.name || ""} - ${userProfile.skills?.join(", ") || "No skills listed"}
${userProfile.workExperience?.length > 0 ? `Experience: ${userProfile.workExperience.map((exp: { company: string }) => exp.company).join(", ")}` : ""}
`
    : ""
}

Provide a concise, constructive evaluation of the candidate's answer. Include:
1. What was done well in the answer
2. Areas for improvement
3. Specific suggestions to make the answer stronger
4. A rating out of 10 with brief explanation. Be as accurate / fair as possible.

No need to include the labels, just provide the feedback, but just maintain the format/structure. Always put a rating at the end.

Keep your feedback professional, actionable, and supportive. Focus on both content and delivery aspects of the answer.
Do not include any introductory text, explanations, or markdown formatting.
Your feedback should be 150-250 words.
`;

    const userPrompt = `Candidate's answer:
${args.userAnswer}`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const content = completion.choices[0]?.message?.content;

      if (!content) {
        throw new Error("OpenAI response content is empty.");
      }

      return content.trim();
    } catch (error) {
      console.error("Error generating feedback:", error);
      if (error instanceof OpenAI.APIError) {
        throw new Error(`OpenAI API Error: ${error.status} ${error.message}`);
      }
      throw new Error("Failed to generate feedback due to an internal error.");
    }
  },
});

/**
 * Generate a sample answer for an interview question
 */
export const generateSampleAnswer = action({
  args: {
    jobId: v.id("jobs"),
    userId: v.string(),
    questionText: v.string(),
    userAnswer: v.string(), // Optional - can be empty
    questionType: v.union(v.literal("technical"), v.literal("nonTechnical")),
  },
  handler: async (
    ctx: ActionCtx,
    args: {
      jobId: Id<"jobs">;
      userId: string;
      questionText: string;
      userAnswer: string;
      questionType: "technical" | "nonTechnical";
    },
  ): Promise<string> => {
    // Fetch job details and user profile
    const job = await ctx.runQuery(api.jobs.getJobById, {
      userId: args.userId,
      jobId: args.jobId,
    });

    if (!job) {
      throw new Error(
        `Job with ID ${args.jobId} not found or not accessible by user ${args.userId}.`,
      );
    }

    // Get user profile if available
    const userProfile = await ctx.runQuery(api.profiles.getProfileByUserId, {
      userId: args.userId,
    });

    // Check if user provided an answer
    const userAnswerProvided = args.userAnswer.trim().length > 0;

    // Create prompts for sample answer generation
    const systemPrompt = `
You are generating a DIRECT, FIRST-PERSON interview answer that the candidate can use verbatim.

CRUCIAL INSTRUCTIONS:
- Output ONLY the answer itself, as if the candidate is speaking 
- DO NOT include ANY meta text (no "here's a sample", no "this answer shows", etc.)
- DO NOT include ANY markdown formatting, quotation marks, or separators
- START IMMEDIATELY with the answer content in first person
- END with the last sentence of the answer

Question: "${args.questionText}"

This is a ${args.questionType === "technical" ? "technical" : "behavioral/non-technical"} question for a ${job.title} position.

Job description:
${job.description}

${
  userProfile
    ? `Candidate information (to customize the answer):
${userProfile.name || ""} - ${userProfile.skills?.join(", ") || "No skills listed"}
${userProfile.workExperience?.length > 0 ? `Experience: ${userProfile.workExperience.map((exp: { company: string }) => exp.company).join(", ")}` : ""}
`
    : ""
}

${
  userAnswerProvided
    ? `The candidate has provided a draft answer. Your goal is to create an improved version while maintaining their personal style and key points.

Candidate's draft:
${args.userAnswer}
`
    : "Create a complete sample answer from scratch."
}

Your sample answer should:
1. Be clear, concise, and well-structured
2. Demonstrate relevant skills and experience for the position
3. Be authentic and conversational in tone
4. Include specific examples or details where appropriate
5. Be 2-4 paragraphs in length

Remember: Output ONLY the first-person answer with no additional text before or after.
`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: systemPrompt }],
        temperature: 0.8,
        max_tokens: 700,
      });

      const content = completion.choices[0]?.message?.content;

      if (!content) {
        throw new Error("OpenAI response content is empty.");
      }

      return content.trim();
    } catch (error) {
      console.error("Error generating sample answer:", error);
      if (error instanceof OpenAI.APIError) {
        throw new Error(`OpenAI API Error: ${error.status} ${error.message}`);
      }
      throw new Error(
        "Failed to generate sample answer due to an internal error.",
      );
    }
  },
});
