import { action } from "./_generated/server";
import { v } from "convex/values";
import OpenAI from "openai";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const generateJobFitSummary = action({
  args: {
    jobId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args): Promise<string> => {
    try {
      // Get user profile for context
      const userProfile = await ctx.runQuery(api.profiles.getProfileByUserId, {
        userId: args.userId,
      });

      if (!userProfile) {
        throw new Error("User profile not found");
      }

      // get job details
      const job = await ctx.runQuery(api.jobs.getJobById, {
        jobId: args.jobId as Id<"jobs">,
        userId: args.userId,
      });

      if (!job || job.description === "No requirements found" || !job.title) {
        throw new Error("Missing job details");
      }
      let systemPrompt = `You are an expert career advisor and coach with deep knowledge 
      of the job market, hiring trends, and skill-based job matching. Your task is to analyze 
      how well a user's background and experience in their profile aligns with the job they are 
      interested in based on the job's title and requirements. Evaluate the degree of fit in 4–5 
      thoughtful and professional sentences. Highlight strengths, any gaps, and suggest areas for 
      improvement or preparation if needed. Keep the tone encouraging yet honest, as if advising 
      a client preparing for a job switch or application. The response should just be a plaintext 
      paragraph without any additional formatting or markdown.

      ### Job Title: ${job.title}
      ### Job Requirements: ${job.description}
      `;

      if (userProfile) {
        systemPrompt += `\n\n### User Profile Context:`;

        if (userProfile.education && userProfile.education.length > 0) {
          systemPrompt += `\n#### Education:`;
          userProfile.education.forEach((edu) => {
            systemPrompt += `\n- ${edu.degree} in ${edu.field} from ${edu.institution}`;
            if (edu.startDate && edu.endDate) {
              systemPrompt += ` (${edu.startDate} - ${edu.endDate})`;
            }
          });
        }

        if (
          userProfile.workExperience &&
          userProfile.workExperience.length > 0
        ) {
          systemPrompt += `\n#### Work Experience:`;
          userProfile.workExperience.forEach((work) => {
            systemPrompt += `\n- ${work.position} at ${work.company}`;
            if (work.startDate) {
              systemPrompt += ` (${work.startDate} - ${work.endDate || "Present"})`;
            }
            if (work.description && work.description.length > 0) {
              work.description.slice(0, 2).forEach((desc) => {
                systemPrompt += `\n  * ${desc}`;
              });
            }
            if (work.technologies && work.technologies.length > 0) {
              systemPrompt += `\n  * Technologies: ${work.technologies.join(", ")}`;
            }
          });
        }

        if (userProfile.projects && userProfile.projects.length > 0) {
          systemPrompt += `\n#### Projects:`;
          userProfile.projects.forEach((project) => {
            systemPrompt += `\n- ${project.name}`;
            if (project.startDate) {
              systemPrompt += ` (${project.startDate} - ${project.endDate || "Present"})`;
            }
            if (project.technologies && project.technologies.length > 0) {
              systemPrompt += `\n  * Technologies: ${project.technologies.join(", ")}`;
            }
          });
        }

        if (userProfile.skills && userProfile.skills.length > 0) {
          systemPrompt += `\n#### Skills: ${userProfile.skills.join(", ")}`;
        }
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "system", content: systemPrompt }],
        temperature: 0.5,
      });

      const summary = completion.choices[0]?.message?.content?.trim();

      if (!summary || summary === "") {
        throw new Error("OpenAI response content is empty.");
      }

      console.log("Job Fit Summary:", summary);

      await ctx.runMutation(api.jobs.updateJob, {
        jobId: args.jobId as Id<"jobs">,
        userId: args.userId,
        jobFitSummary: summary,
      });

      return summary;
    } catch (error) {
      console.error("Error generating summary:", error);
      if (error instanceof OpenAI.APIError) {
        throw new Error(`OpenAI API Error: ${error.status} ${error.message}`);
      }
      throw new Error(
        "Failed to generate job fit analysis summary due to an internal error.",
      );
    }
  },
});
