import { createOpenAI } from "@ai-sdk/openai";
import { internalAction, action } from "./_generated/server";
import { v } from "convex/values";
import { streamText } from "ai";
import { parseResume } from "./resumeParser";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

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

export const refineResponse = action({
  args: {
    jobTitle: v.string(),
    jobRequirements: v.string(),
    jobQuestion: v.string(),
    userBackground: v.string(),
    userResponse: v.string(),
  },
  handler: async (_, args) => {
    console.log("starting refineResponse");

    const systemPrompt = `You are an experienced career coach specializing in job applications, resume writing, and interview preparation. Your role is to help refine a user’s job application response to make it clearer, more specific, and impactful.

      ### Instructions:
      1. Review the user’s original response to the job application question. 
      2. Improve the structure, clarity, and flow of the response. Ensure that the answer directly addresses the job application question in a more precise and detailed manner.
      3. Strengthen the response by including more relevant examples, specific details, and removing any vague or unnecessary information.
      4. Ensure the response remains confident and professional while maintaining the user’s voice.
      5. Ensure that the response aligns with the job title, requirements, and industry-specific terminology.

      ### Original Response:
      ${args.userResponse}

      ### Job Details:
      - **Job Title:** ${args.jobTitle}
      - **Job Requirements:** ${args.jobRequirements}

      ### User Background:
      ${args.userBackground}

      ### Output:
      Return a refined version of the response that is more specific, clear, and impactful. 
      Do not include any markdown formatting or code blocks in the response.
      The response should just be a plaintext response without any additional formatting and don't include subject line, greeting, and closing. This is a job application response, not an email.
      `;

    try {
      console.log("About to call streamText...");
      console.log("OpenAI API Key exists:", !!process.env.OPENAI_API_KEY);

      const { textStream } = streamText({
        model: openai("gpt-4o-mini"),
        temperature: 0.3,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Please refine the user's response to the job application question based on the provided system instructions and context. The job application question is: ${args.jobQuestion}`,
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

      return fullResponse;
    } catch (error) {
      console.error("Error generating job questions:", error);
      throw error;
    }
  },
});

export const optimizeResponse = action({
  args: {
    jobTitle: v.string(),
    jobRequirements: v.string(),
    jobQuestion: v.string(),
    userBackground: v.string(),
    userResponse: v.string(),
  },
  handler: async (_, args) => {
    console.log("starting optmizeResponse");

    const systemPrompt = `You are an experienced career coach specializing in job applications, resume writing, and interview preparation. Your role is to optimize a user's job application response to better fit the job title, requirements, and company culture.

      ### Instructions:
      1. Review the user’s response to the job application question.
      2. Ensure that the answer is aligned with the job title, job requirements, and company culture.
      3. Incorporate key industry-specific keywords from the job posting and ensure that they are used naturally within the response.
      4. Emphasize the user’s most relevant strengths, experiences, and skills that directly relate to the job posting.
      5. Ensure the response is tailored to make the user appear as a strong fit for this specific job.

      ### Original Response:
      ${args.userResponse}

      ### Job Details:
      - **Job Title:** ${args.jobTitle}
      - **Job Requirements:** ${args.jobRequirements}

      ### User Background:
      ${args.userBackground}

      ### Output:
      Return an optimized version of the response that highlights the most relevant skills and experiences and aligns better with the job posting and company culture. 
      The ${args.jobTitle} and ${args.jobRequirements} should be used to look up on the web and find out what the company culture is like.

      The ${args.userResponse} should be used as a base but you should edit words or add words so that the response will catch the recruiter's attention and make them think that this person is a good fit for the role 
      based on their ${args.userBackground}. Don't make things up! Always base the responses on the user's background given to you.

      ### Output:
      Return an optimized version of the response that highlights the most relevant skills and experiences and aligns better with the job posting and company culture.
      Do not include any markdown formatting or code blocks in the response.
      The response should just be a plaintext response without any additional formatting and don't include subject line, greeting, and closing. This is a job application response, not an email.
      `;

    try {
      console.log("About to call streamText...");
      console.log("OpenAI API Key exists:", !!process.env.OPENAI_API_KEY);

      const { textStream } = streamText({
        model: openai("gpt-4o-mini"),
        temperature: 0.3,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Please optimize this response to the job application question to ensure it aligns with the job title, requirements, and company culture. The goal is to make the user stand out as the ideal candidate for the position. The job application question is: ${args.jobQuestion}`,
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

      return fullResponse;
    } catch (error) {
      console.error("Error generating job questions:", error);
      throw error;
    }
  },
});

export const adjustTone = action({
  args: {
    jobTitle: v.string(),
    jobRequirements: v.string(),
    jobQuestion: v.string(),
    userBackground: v.string(),
    userResponse: v.string(),
  },
  handler: async (_, args) => {
    console.log("starting adjustTone");

    const systemPrompt = `You are an experienced career coach specializing in job applications, resume writing, and interview preparation. Your role is to adjust the tone of the user’s job application response to align with the company’s culture, whether it needs to be more formal, casual, enthusiastic, etc.

    ### Instructions:
    1. Review the user’s response to the job application question.
    2. Modify the tone of the response to better match the company’s culture. If the company is known for being formal, make the tone more professional. If the company has a more casual or creative environment, make the tone more friendly and approachable.
    3. Ensure that the tone is consistent throughout the response and remains professional, confident, and authentic to the user’s style.
    4. Maintain the clarity and quality of the response while adjusting the tone as requested.

    ### Original Response:
    ${args.userResponse}

    ### Company Culture: 
    - **Job Title:** ${args.jobTitle}
    - **Job Requirements:** ${args.jobRequirements}

    Use the ${args.jobTitle} and ${args.jobRequirements} to look up on the web and find out what the company culture is like.

    When you generate the response, please make sure that you are using the ${args.userResponse} as a base and that you are not changing the content of the response. You are only changing the tone of the response.
    You can change some wording to better fit the tone of the company, but you are not changing the overall content and facts of the response.

    ### Output:
    Return a version of the response that reflects the desired tone, matching the company’s culture.
    Do not include any markdown formatting or code blocks in the response.
    The response should just be a plaintext response without any additional formatting and don't include subject line, greeting, and closing. This is a job application response, not an email.
      `;

    try {
      console.log("About to call streamText...");
      console.log("OpenAI API Key exists:", !!process.env.OPENAI_API_KEY);

      const { textStream } = streamText({
        model: openai("gpt-4o-mini"),
        temperature: 0.5,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Based on the system instructions and context provided, adjust the tone of the user's response to align with the company's culture and the job they are applying for. The job application question is: ${args.jobQuestion}`,
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

      return fullResponse;
    } catch (error) {
      console.error("Error generating job questions:", error);
      throw error;
    }
  },
});

export const regenerateResponse = action({
  args: {
    jobTitle: v.string(),
    jobRequirements: v.string(),
    jobQuestion: v.string(),
    userBackground: v.string(),
    userResponse: v.string(),
  },
  handler: async (_, args) => {
    console.log("starting regenerateResponse");

    const systemPrompt = `You are an experienced career coach specializing in job applications, resume writing, and interview preparation. Your role is to generate well-structured and compelling responses to job application questions based on the user's education, experiences, and skills. The user has updated their profile with additional information. Use this updated information to regenerate the response.

      ### Instructions:
      1. Review the updated user profile data to incorporate any newly added skills, experiences, or education.
      2. Rebuild the response to the job application question using the most recent profile information. Make sure to integrate the updated details seamlessly into the response.
      3. Ensure the new response is well-structured, compelling, and clearly highlights the user's relevant skills and experiences.
      4. Emphasize relevant skills, experiences, and achievements based on the updated profile.
      5. Use a confident and professional tone to make the user stand out.
      6. Optimize the response to be ATS-friendly by naturally incorporating key industry-specific keywords.
      7. Where applicable, use the STAR (Situation, Task, Action, Result) method to structure responses effectively.

      ### Job Details:
      - **Job Title:** ${args.jobTitle}
      - **Job Requirements:** ${args.jobRequirements}

      ### Updated User Background:
      ${args.userBackground}

      ### Job Application Question:
      ${args.jobQuestion}

      ### Output:
      Return the regenerated response incorporating the updated profile data.
      Do not include any markdown formatting or code blocks in the response.
      The response should just be a plaintext response without any additional formatting and don't include subject line, greeting, and closing. This is a job application response, not an email.
      `;

    try {
      console.log("About to call streamText...");
      console.log("OpenAI API Key exists:", !!process.env.OPENAI_API_KEY);

      const { textStream } = streamText({
        model: openai("gpt-4o-mini"),
        temperature: 0.2,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Based on the system instructions and context provided, adjust the tone of the user's response to align with the company's culture and the job they are applying for. The job application question is: ${args.jobQuestion}`,
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

      return fullResponse;
    } catch (error) {
      console.error("Error generating job questions:", error);
      throw error;
    }
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
        temperature: 0.1,
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

// Function to handle chat messages
export const handleChatMessage = action({
  args: {
    chatId: v.id("chats"),
    userId: v.string(),
    message: v.string(),
    isFirstMessage: v.boolean(),
  },
  handler: async (ctx, args) => {
    try {
      console.log("Starting chat message processing");
      
      // Get the current chat
      const chat = await ctx.runQuery(api.chat.getById, {
        chatId: args.chatId,
      });
      
      if (!chat) {
        throw new Error("Chat not found");
      }
      
      // Get user profile for context (only for first message)
      let userProfile = null;
      if (args.isFirstMessage) {
        userProfile = await ctx.runQuery(api.profiles.getProfileByUserId, {
          userId: args.userId,
        });
      }
      
      // Get related job if one is specified
      let relatedJob = null;
      if (chat.relatedJobId) {
        // Get job with proper type casting
        relatedJob = await ctx.runQuery(api.jobs.getJobById, {
          userId: args.userId,
          jobId: chat.relatedJobId as unknown as Id<"jobs">,
        });
      }
      
      // Get message history (last 10 messages)
      const messageHistory = await ctx.runQuery(api.messages.getAll, {
        chatId: args.chatId,
        limit: 10,
      });
      
      // Create system prompt based on context
      let systemPrompt = `You are JobSync AI, a career coach specializing in job applications, resume writing, and interview preparation. Your goal is to provide helpful, personalized advice to job seekers.

Guidelines:
- Be concise, clear, and actionable in your responses.
- Be honest about limitations - if you don't know something, say so.
- Be supportive but realistic - don't make false promises about job prospects.
- Provide specific, practical advice based on the user's background and goals.
- Focus on helping the user improve their job application materials and interview skills.
- When appropriate, use the STAR (Situation, Task, Action, Result) method to help structure responses.
- Analyze and provide constructive criticism on user's application materials, resumes, and responses.
- Always make recommendations grounded in the user's actual background - don't make up experiences or skills.
- Be particularly attentive to skills alignment and look for opportunities to suggest improvements.
- Make sure the user is actually a good candidate for the job.`;

      // Add user profile context if available and this is the first message
      if (userProfile && args.isFirstMessage) {
        systemPrompt += `\n\n### User Profile Context:`;
        
        if (userProfile.education && userProfile.education.length > 0) {
          systemPrompt += `\n#### Education:`;
          userProfile.education.forEach(edu => {
            systemPrompt += `\n- ${edu.degree} in ${edu.field} from ${edu.institution}`;
            if (edu.startDate && edu.endDate) {
              systemPrompt += ` (${edu.startDate} - ${edu.endDate})`;
            }
          });
        }
        
        if (userProfile.workExperience && userProfile.workExperience.length > 0) {
          systemPrompt += `\n#### Work Experience:`;
          userProfile.workExperience.forEach(work => {
            systemPrompt += `\n- ${work.position} at ${work.company}`;
            if (work.startDate) {
              systemPrompt += ` (${work.startDate} - ${work.endDate || "Present"})`;
            }
            if (work.description && work.description.length > 0) {
              work.description.slice(0, 2).forEach(desc => {
                systemPrompt += `\n  * ${desc}`;
              });
            }
            if (work.technologies && work.technologies.length > 0) {
              systemPrompt += `\n  * Technologies: ${work.technologies.join(', ')}`;
            }
          });
        }
        
        if (userProfile.projects && userProfile.projects.length > 0) {
          systemPrompt += `\n#### Projects:`;
          userProfile.projects.forEach(project => {
            systemPrompt += `\n- ${project.name}`;
            if (project.startDate) {
              systemPrompt += ` (${project.startDate} - ${project.endDate || "Present"})`;
            }
            if (project.technologies && project.technologies.length > 0) {
              systemPrompt += `\n  * Technologies: ${project.technologies.join(', ')}`;
            }
          });
        }
        
        if (userProfile.skills && userProfile.skills.length > 0) {
          systemPrompt += `\n#### Skills: ${userProfile.skills.join(", ")}`;
        }
      }
      
      // Add job context if available
      if (relatedJob) {
        systemPrompt += `\n\n### Related Job Context:`;
        systemPrompt += `\n- Job Title: ${relatedJob.title}`;
        systemPrompt += `\n- Job Requirements:\n${relatedJob.description}`;
        if (relatedJob.questions && relatedJob.questions.length > 0) {
          systemPrompt += `\n- Application Questions:`;
          relatedJob.questions.forEach((question, index) => {
            systemPrompt += `\n  ${index + 1}. ${question}`;
          });
        }
      }

      // Prepare conversation history for the model
      const conversation = messageHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Add current user message
      conversation.push({
        role: "user",
        content: args.message
      });
      
      console.log("Calling OpenAI with context and history");
      
      // Stream response from OpenAI
      const { textStream } = streamText({
        model: openai("gpt-4o-mini"),
        temperature: 0.7,
        system: systemPrompt,
        messages: conversation,
      });
      
      let fullResponse = "";
      
      // Collect the complete response
      for await (const delta of textStream) {
        if (delta) {
          fullResponse += delta;
        }
      }
      
      console.log("Received complete response from OpenAI");
      
      return fullResponse;
    } catch (error) {
      console.error("Error in chat handling:", error);
      throw error;
    }
  },
});

export { parseResume };
